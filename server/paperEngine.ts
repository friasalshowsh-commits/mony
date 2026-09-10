import { 
  ExitReason, 
  MarketTicker, 
  PaperOrder, 
  PaperPosition, 
  PortfolioSummary, 
  TradeRecord 
} from '../src/types/index.js';
import { db } from './db.js';
import { eventBus } from './events.js';
import { freshnessService } from './marketProvider.js';
import { realtimeBus } from './realtime.js';

export class PaperTradingEngine {
  /**
   * Evaluates all open paper positions against current market price ticks.
   * Triggers automatic SL or TP exits when price boundaries are crossed.
   */
  public onPriceTick(ticker: MarketTicker) {
    const database = db.getDB();
    const openPositions = database.positions;
    if (!openPositions || openPositions.length === 0) return;

    // Track freshness
    freshnessService.updateSeen(ticker.symbol, ticker.metadata?.marketTimestamp || Date.now(), ticker.isDemo);

    for (let i = openPositions.length - 1; i >= 0; i--) {
      const pos = openPositions[i];
      if (pos.asset !== ticker.symbol) continue;

      pos.currentPrice = ticker.price;
      pos.lastUpdated = new Date().toISOString();

      // Calculate distance percentages
      if (pos.direction === 'LONG') {
        pos.unrealizedPnL = parseFloat(((pos.currentPrice - pos.entryPrice) * pos.quantity).toFixed(2));
        pos.unrealizedPnLPercent = parseFloat((((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2));
        pos.distanceToStopPercent = parseFloat((((pos.currentPrice - pos.stopLoss) / pos.currentPrice) * 100).toFixed(2));
        pos.distanceToTargetPercent = parseFloat((((pos.takeProfit - pos.currentPrice) / pos.currentPrice) * 100).toFixed(2));

        // Stop Loss Check
        if (pos.currentPrice <= pos.stopLoss) {
          const exitP = pos.stopLoss;
          this.closePosition(pos.id, 'STOP_LOSS', exitP);
          continue;
        }

        // Take Profit Check
        if (pos.currentPrice >= pos.takeProfit) {
          const exitP = pos.takeProfit;
          this.closePosition(pos.id, 'TAKE_PROFIT', exitP);
          continue;
        }
      } else {
        // SHORT position
        pos.unrealizedPnL = parseFloat(((pos.entryPrice - pos.currentPrice) * pos.quantity).toFixed(2));
        pos.unrealizedPnLPercent = parseFloat((((pos.entryPrice - pos.currentPrice) / pos.entryPrice) * 100).toFixed(2));
        pos.distanceToStopPercent = parseFloat((((pos.stopLoss - pos.currentPrice) / pos.currentPrice) * 100).toFixed(2));
        pos.distanceToTargetPercent = parseFloat((((pos.currentPrice - pos.takeProfit) / pos.currentPrice) * 100).toFixed(2));

        if (pos.currentPrice >= pos.stopLoss) {
          const exitP = pos.stopLoss;
          this.closePosition(pos.id, 'STOP_LOSS', exitP);
          continue;
        }

        if (pos.currentPrice <= pos.takeProfit) {
          const exitP = pos.takeProfit;
          this.closePosition(pos.id, 'TAKE_PROFIT', exitP);
          continue;
        }
      }

      eventBus.emitEvent('POSITION_UPDATED', { position: pos });
    }

    // Broadcast position update
    realtimeBus.broadcast('POSITIONS_UPDATED', database.positions);
  }

  public getOpenPositions(): PaperPosition[] {
    const database = db.getDB();
    return database.positions || [];
  }

  /**
   * Executes an approved candidate trade into a paper position and order.
   */
  public executePaperTrade(params: {
    asset: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    quantity: number;
    stopLoss: number;
    takeProfit: number;
    takeProfitLevels?: { level: number; price: number; percentage: number }[];
    strategyId?: string;
    strategyName?: string;
    supervisorConfidence?: number;
    analysisSessionId?: string;
    riskAmount?: number;
    riskPercent?: number;
    riskRewardRatio?: number;
  }): PaperPosition {
    const database = db.getDB();
    const dataMode = database.settings.dataMode || 'LIVE';

    // Guard: check market data freshness in LIVE mode
    if (dataMode === 'LIVE') {
      const safety = freshnessService.isMarketSafeForExecution(params.asset);
      if (!safety.safe) {
        throw new Error(safety.reason || 'بيانات السوق غير محدثة. تم رفض تنفيذ الصفقة لحماية سلامة المحفظة.');
      }
    }

    const feeRate = database.settings.riskSettings.tradingFeePercent / 100;
    const slippageRate = database.settings.riskSettings.simulatedSlippagePercent / 100;

    const notional = params.entryPrice * params.quantity;
    const fees = notional * feeRate;
    const slippage = notional * slippageRate;

    // Derived risk metrics if not explicitly passed
    const riskDistance = Math.abs(params.entryPrice - params.stopLoss);
    const calculatedRiskAmount = params.riskAmount !== undefined ? params.riskAmount : (riskDistance * params.quantity);
    const currentEquity = database.settings.currentCashBalance;
    const calculatedRiskPercent = params.riskPercent !== undefined ? params.riskPercent : (currentEquity > 0 ? (calculatedRiskAmount / currentEquity) * 100 : 1.0);
    const rewardDistance = Math.abs(params.takeProfit - params.entryPrice);
    const calculatedRR = params.riskRewardRatio !== undefined ? params.riskRewardRatio : (riskDistance > 0 ? rewardDistance / riskDistance : 2.0);
    const defaultTpLevels = params.takeProfitLevels || [
      { level: 1, price: params.takeProfit, percentage: 100 }
    ];

    // Create Order Record
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const order: PaperOrder = {
      id: orderId,
      asset: params.asset,
      side: params.direction === 'LONG' ? 'BUY' : 'SELL',
      type: 'MARKET',
      price: params.entryPrice,
      quantity: params.quantity,
      notional: parseFloat(notional.toFixed(2)),
      status: 'FILLED',
      createdAt: new Date().toISOString(),
      filledAt: new Date().toISOString(),
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      fees: parseFloat(fees.toFixed(2)),
      slippage: parseFloat(slippage.toFixed(2)),
      analysisSessionId: params.analysisSessionId
    };
    database.orders.unshift(order);

    // Create Position Record
    const positionId = `POS-${params.asset.split('/')[0]}-${Date.now().toString(36).toUpperCase()}`;
    const position: PaperPosition = {
      id: positionId,
      asset: params.asset,
      direction: params.direction,
      entryPrice: params.entryPrice,
      currentPrice: params.entryPrice,
      quantity: params.quantity,
      notionalValue: parseFloat(notional.toFixed(2)),
      stopLoss: params.stopLoss,
      takeProfitLevels: defaultTpLevels,
      takeProfit: params.takeProfit,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      allocatedCapital: parseFloat(notional.toFixed(2)),
      riskAmount: parseFloat(calculatedRiskAmount.toFixed(2)),
      riskPercent: parseFloat(calculatedRiskPercent.toFixed(2)),
      riskRewardRatio: parseFloat(calculatedRR.toFixed(2)),
      strategyId: params.strategyId || 'STRAT-AUTONOMOUS',
      strategyName: params.strategyName || 'Autonomous Quant Strategy',
      supervisorConfidence: params.supervisorConfidence || 85,
      openedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      analysisSessionId: params.analysisSessionId,
      distanceToStopPercent: parseFloat((Math.abs(params.entryPrice - params.stopLoss) / params.entryPrice * 100).toFixed(2)),
      distanceToTargetPercent: parseFloat((Math.abs(params.takeProfit - params.entryPrice) / params.entryPrice * 100).toFixed(2)),
      marketDataSource: dataMode === 'LIVE' ? 'BINANCE' : 'DEMO',
      marketDataMode: dataMode,
      executionMode: 'PAPER',
      entryMarketTimestamp: Date.now(),
      tradeType: dataMode === 'LIVE' ? 'LIVE_MARKET_PAPER' : 'DEMO_PAPER'
    };

    database.positions.unshift(position);
    database.settings.currentCashBalance -= (notional + fees + slippage);
    db.save();

    const arabicDirection = params.direction === 'LONG' ? 'شراء (LONG)' : 'بيع (SHORT)';
    const arabicMode = dataMode === 'LIVE' ? 'أسعار حية (Binance)' : 'بيانات تجريبية (Demo)';

    db.addEvent({
      type: 'ORDER',
      severity: 'SUCCESS',
      source: 'محرك التداول التجريبي',
      asset: params.asset,
      message: `تم تنفيذ أمر التداول التجريبي ${orderId}: ${arabicDirection} ${params.quantity} ${params.asset} بسعر $${params.entryPrice.toLocaleString()} [${arabicMode}]`
    });

    eventBus.emitEvent('ORDER_CREATED', { order });
    eventBus.emitEvent('POSITION_OPENED', { position });
    eventBus.emitEvent('PORTFOLIO_UPDATED', { portfolio: this.getPortfolioSummary() });

    realtimeBus.broadcast('ORDER_FILLED', order);
    realtimeBus.broadcast('POSITION_OPENED', position);
    realtimeBus.broadcast('PORTFOLIO_UPDATED', this.getPortfolioSummary());

    return position;
  }

  /**
   * Closes an active paper position and logs complete accounting & trade review.
   */
  public closePosition(positionId: string, reason: ExitReason, exitPrice?: number): TradeRecord | null {
    const database = db.getDB();
    const index = database.positions.findIndex(p => p.id === positionId);
    if (index === -1) return null;

    const pos = database.positions[index];
    database.positions.splice(index, 1);

    const actualExitPrice = exitPrice || pos.currentPrice;
    const durationMinutes = Math.max(1, Math.round((Date.now() - new Date(pos.openedAt).getTime()) / 60000));

    const feeRate = database.settings.riskSettings.tradingFeePercent / 100;
    const slippageRate = database.settings.riskSettings.simulatedSlippagePercent / 100;
    const exitNotional = actualExitPrice * pos.quantity;
    const fees = (pos.notionalValue * feeRate) + (exitNotional * feeRate);
    const slippage = exitNotional * slippageRate;

    let grossPnL = 0;
    if (pos.direction === 'LONG') {
      grossPnL = (actualExitPrice - pos.entryPrice) * pos.quantity;
    } else {
      grossPnL = (pos.entryPrice - actualExitPrice) * pos.quantity;
    }

    const netPnL = grossPnL - fees - slippage;
    const netPnLPercent = pos.notionalValue > 0 ? (netPnL / pos.notionalValue) * 100 : 0;

    // Find analysis session for review data
    const session = database.analysisSessions.find(s => s.id === pos.analysisSessionId);

    // Agent 10: Post-Trade Review Generation
    const isWin = netPnL > 0;
    const tradeReview = {
      reviewedAt: new Date().toISOString(),
      thesisAccuracy: isWin ? ('CORRECT' as const) : ('FAILED' as const),
      whatWorked: isWin 
        ? [
            `تنفيذ دقيق لنقطة الدخول عند الدعم الفني`,
            `تحقيق الهدف السعري عند مقاومة المؤشرات الفنية`,
            `إدارة المخاطر التزمت بنسبة ${pos.riskPercent}% المحددة مسبقاً`
          ]
        : [
            `تفعيل أمر وقف الخسارة بنجاح حمى المحفظة من هبوط حاد`
          ],
      whatFailed: isWin 
        ? []
        : [
            `تقلب سعري حاد اخترق منطقة الإلغاء`,
            `وصول السعر إلى وقف الخسارة قبل استئناف الاتجاه الصاعد`
          ],
      agentErrors: isWin 
        ? []
        : [
            `تحليل هيكل السوق لم يقدر ضغط التصحيح على الإطار الزمني الأكبر`
          ],
      lessonProposal: isWin
        ? `الحفاظ على أوزان الثقة الحالية لاستراتيجية ${pos.strategyName}.`
        : `يوصى بتوسيع وقف الخسارة بمقدار 0.2 ATR في ظروف التقلب المرتفع.`
    };

    const tradeRecord: TradeRecord = {
      id: `TR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      accountId: 'PAPER-ACC-01',
      asset: pos.asset,
      exchange: pos.marketDataSource === 'BINANCE' ? 'BINANCE' : 'PAPER_SIMULATOR',
      mode: 'PAPER',
      direction: pos.direction,
      strategyName: pos.strategyName,
      entryDate: pos.openedAt,
      entryPrice: pos.entryPrice,
      exitDate: new Date().toISOString(),
      exitPrice: actualExitPrice,
      quantity: pos.quantity,
      notionalValue: pos.notionalValue,
      stopLoss: pos.stopLoss,
      takeProfit: pos.takeProfit,
      grossPnL: parseFloat(grossPnL.toFixed(2)),
      fees: parseFloat(fees.toFixed(2)),
      slippage: parseFloat(slippage.toFixed(2)),
      netPnL: parseFloat(netPnL.toFixed(2)),
      netPnLPercent: parseFloat(netPnLPercent.toFixed(2)),
      riskAmount: pos.riskAmount,
      riskPercent: pos.riskPercent,
      riskRewardRatio: pos.riskRewardRatio,
      durationMinutes,
      exitReason: reason,
      supervisorConfidence: pos.supervisorConfidence,
      marketRegime: session?.marketSnapshot.marketRegime || 'BULL_TREND',
      analysisSessionId: pos.analysisSessionId,
      agentVotes: session?.candidateTrade?.agentVotes.map(v => ({
        agentId: v.agentId,
        signal: v.signal,
        confidence: v.confidence
      })) || [],
      originalThesis: session?.candidateTrade?.supervisorSummary || `تنفيذ آلي لاستراتيجية ${pos.strategyName}`,
      postTradeReview: tradeReview,
      marketDataSource: pos.marketDataSource || 'BINANCE',
      marketDataMode: pos.marketDataMode || 'LIVE',
      tradeType: pos.tradeType || 'LIVE_MARKET_PAPER'
    };

    database.tradeLedger.unshift(tradeRecord);
    database.settings.currentCashBalance += (pos.notionalValue + netPnL);

    // Record equity point
    const currentEquity = this.getPortfolioSummary().equity;
    database.equityHistory.push({
      timestamp: new Date().toISOString(),
      equity: currentEquity,
      pnl: netPnL
    });

    db.save();

    const arabicReasonMap: Record<ExitReason, string> = {
      STOP_LOSS: 'وقف الخسارة (Stop Loss)',
      TAKE_PROFIT: 'جني الأرباح (Take Profit)',
      MANUAL_CLOSE: 'إغلاق يدوي',
      STRATEGY_EXIT: 'إشارة خروج الاستراتيجية',
      RISK_EXIT: 'خروج حماية المخاطر',
      TRAILING_STOP: 'وقف متحرك',
      TIME_EXIT: 'انتهاء الوقت المحدد',
      SYSTEM_EXIT: 'إغلاق طوارئ النظام'
    };

    const reasonAr = arabicReasonMap[reason] || reason;
    const pnlSign = netPnL >= 0 ? '+' : '';

    db.addEvent({
      type: 'TRADE',
      severity: netPnL >= 0 ? 'SUCCESS' : 'WARNING',
      asset: pos.asset,
      source: 'محرك التداول التجريبي',
      message: `تم إغلاق صفقة ${pos.asset} بسبب [${reasonAr}]: صافي النتيجة: ${pnlSign}$${netPnL.toLocaleString()} (${pnlSign}${netPnLPercent.toFixed(2)}%)`
    });

    eventBus.emitEvent('POSITION_CLOSED', { position: pos, trade: tradeRecord });
    eventBus.emitEvent('PORTFOLIO_UPDATED', { portfolio: this.getPortfolioSummary() });

    realtimeBus.broadcast('POSITION_CLOSED', { position: pos, trade: tradeRecord });
    realtimeBus.broadcast('TRADE_RECORDED', tradeRecord);
    realtimeBus.broadcast('PORTFOLIO_UPDATED', this.getPortfolioSummary());

    return tradeRecord;
  }

  public getPortfolioSummary(): PortfolioSummary {
    const database = db.getDB();
    const startingBalance = database.settings.initialPaperBalance;
    const cashBalance = database.settings.currentCashBalance;

    let allocatedCapital = 0;
    let unrealizedPnL = 0;
    let openRiskUsd = 0;

    for (const p of database.positions) {
      allocatedCapital += p.notionalValue;
      unrealizedPnL += p.unrealizedPnL;
      openRiskUsd += p.riskAmount;
    }

    const equity = parseFloat((cashBalance + allocatedCapital + unrealizedPnL).toFixed(2));
    const realizedPnL = parseFloat(database.tradeLedger.reduce((sum, t) => sum + t.netPnL, 0).toFixed(2));
    const totalPnL = parseFloat((realizedPnL + unrealizedPnL).toFixed(2));

    const todayStr = new Date().toISOString().split('T')[0];
    const dailyRealized = database.tradeLedger
      .filter(t => t.exitDate.startsWith(todayStr))
      .reduce((sum, t) => sum + t.netPnL, 0);
    const dailyPnL = parseFloat((dailyRealized + unrealizedPnL).toFixed(2));
    const dailyPnLPercent = parseFloat(((dailyPnL / startingBalance) * 100).toFixed(2));

    const totalTradesCount = database.tradeLedger.length;
    const winningTradesCount = database.tradeLedger.filter(t => t.netPnL > 0).length;
    const losingTradesCount = totalTradesCount - winningTradesCount;
    const winRate = totalTradesCount > 0 ? parseFloat(((winningTradesCount / totalTradesCount) * 100).toFixed(1)) : 0;

    // Drawdown calculation
    let peak = startingBalance;
    let maxDrawdownPercent = 0;
    for (const pt of database.equityHistory) {
      if (pt.equity > peak) peak = pt.equity;
      const dd = ((peak - pt.equity) / peak) * 100;
      if (dd > maxDrawdownPercent) maxDrawdownPercent = dd;
    }
    const currentDrawdownPercent = peak > 0 ? parseFloat((Math.max(0, ((peak - equity) / peak) * 100)).toFixed(2)) : 0;

    return {
      startingBalance,
      cashBalance: parseFloat(cashBalance.toFixed(2)),
      equity,
      allocatedCapital: parseFloat(allocatedCapital.toFixed(2)),
      availableCapital: parseFloat(Math.max(0, cashBalance).toFixed(2)),
      unrealizedPnL: parseFloat(unrealizedPnL.toFixed(2)),
      realizedPnL,
      totalPnL,
      dailyPnL,
      dailyPnLPercent,
      winRate,
      totalTradesCount,
      winningTradesCount,
      losingTradesCount,
      currentDrawdownPercent,
      maxDrawdownPercent: parseFloat(maxDrawdownPercent.toFixed(2)),
      openPositionsCount: database.positions.length,
      openRiskUsd: parseFloat(openRiskUsd.toFixed(2)),
      openRiskPercent: parseFloat(((openRiskUsd / equity) * 100).toFixed(2)),
      equityHistory: database.equityHistory
    };
  }
}

export const paperEngine = new PaperTradingEngine();

