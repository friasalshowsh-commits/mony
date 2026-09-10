import { db } from '../../db.js';
import { marketDataEngine } from '../../marketData.js';
import { paperEngine } from '../../paperEngine.js';
import { realtimeBus } from '../../realtime.js';
import { deterministicRiskEngine } from '../../riskEngine.js';
import { usageTracker } from './usageTracker.js';

import { technicalAgent } from '../agents/technicalAgent.js';
import { marketStructureAgent } from '../agents/marketStructureAgent.js';
import { quantAgent } from '../agents/quantAgent.js';
import { riskAIAgent } from '../agents/riskAgent.js';
import { newsAgent } from '../agents/newsAgent.js';
import { sentimentAgent } from '../agents/sentimentAgent.js';
import { supervisorAgent } from '../agents/supervisorAgent.js';

import { 
  AgentReport, 
  AnalysisSession, 
  CandidateTrade, 
  RiskDecision 
} from '../../../src/types/index.js';
import { MarketSnapshotRecord } from '../../db/interfaces.js';

export class AnalysisOrchestrator {
  private activeSessionsBySymbol: Map<string, { sessionId: string; startedAt: number }> = new Map();
  private readonly COOLDOWN_MS = 25000; // 25s duplicate analysis cooldown

  /**
   * Main entry point: Executes a complete multi-agent research session on an asset
   */
  public async runSession(symbol: string, triggerEvent: string = 'MANUAL_SCAN'): Promise<AnalysisSession> {
    const database = db.getDB();
    const settings = database.settings;

    // 0. Safety: Check system state
    if (settings.systemPaused || !settings.agentsActive) {
      throw new Error('النظام أو وكلاء الذكاء الاصطناعي في وضع الإيقاف المؤقت حالياً.');
    }

    // 0. Budget verification
    const budgetCheck = usageTracker.checkBudgetAvailable();
    if (!budgetCheck.allowed) {
      throw new Error(budgetCheck.reasonAr || budgetCheck.reason);
    }

    // 0. Duplicate analysis cooldown
    const existing = this.activeSessionsBySymbol.get(symbol);
    if (existing && Date.now() - existing.startedAt < this.COOLDOWN_MS) {
      const active = database.analysisSessions.find(s => s.id === existing.sessionId);
      if (active) return active;
    }

    // 0. Check market data freshness
    const ticker = database.tickers.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
    if (!ticker) {
      throw new Error(`الأصل ${symbol} غير متوفر في المنصة.`);
    }

    const freshnessMs = ticker.metadata?.freshnessMs ?? 0;
    if (freshnessMs > 30000 && !ticker.isDemo) {
      throw new Error('تعذر إجراء التحليل لأن بيانات السوق الحية غير محدثة (Stale Data).');
    }

    const sessionId = `AN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    this.activeSessionsBySymbol.set(symbol, { sessionId, startedAt: Date.now() });

    // 1. GATHER REAL MARKET DATA & PERSIST MARKET SNAPSHOT FIRST
    const candles = await marketDataEngine.getOHLCV(symbol, '1h', 60);
    const indicators = marketDataEngine.calculateIndicators(candles);
    const regime = marketDataEngine.detectMarketRegime(candles, indicators);
    const currentPrice = ticker.price || (candles.length > 0 ? candles[candles.length - 1].close : 100);

    const snapshotId = `SNAP-${sessionId}`;
    const snapshotRecord: MarketSnapshotRecord = {
      id: snapshotId,
      symbol,
      price: currentPrice,
      timestamp: Date.now(),
      timeframe: '1h',
      source: ticker.metadata?.source || (ticker.isDemo ? 'DEMO' : 'BINANCE'),
      mode: ticker.isDemo ? 'DEMO' : 'LIVE',
      indicators,
      candleReferences: candles.slice(-5).map(c => ({
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume
      })),
      createdAt: new Date().toISOString()
    };
    db.addMarketSnapshot(snapshotRecord);

    // 2. CREATE INITIAL ANALYSIS SESSION
    const session: AnalysisSession = {
      id: sessionId,
      asset: symbol,
      startTime: new Date().toISOString(),
      status: 'RUNNING',
      triggerEvent,
      marketSnapshot: {
        price: currentPrice,
        change24h: ticker.change24h,
        volume24h: ticker.volume24h,
        trend: ticker.trend,
        marketRegime: regime,
        indicators
      },
      agentReports: [],
      disagreementsDetected: false
    };

    database.analysisSessions.unshift(session);
    if (database.analysisSessions.length > 200) {
      database.analysisSessions = database.analysisSessions.slice(0, 200);
    }
    db.save();

    realtimeBus.broadcast('ANALYSIS_SESSION_CREATED', {
      session,
      timestamp: new Date().toISOString()
    });

    db.addEvent({
      type: 'SUPERVISOR',
      severity: 'INFO',
      source: 'SUPERVISOR_ORCHESTRATOR',
      asset: symbol,
      message: `تم إنشاء جلسة التحليل ${sessionId} للأصل ${symbol}`
    });

    // 3. RUN SPECIALIST AGENTS CONCURRENTLY (Controlled Parallelism)
    const agentReports: AgentReport[] = [];

    // Parallel execution for core technical, structure, quant, and risk
    const [techRes, structRes, quantRes, riskRes, newsRes, sentRes] = await Promise.allSettled([
      technicalAgent.analyze(symbol, sessionId),
      marketStructureAgent.analyze(symbol, sessionId),
      quantAgent.analyze(symbol, sessionId),
      riskAIAgent.evaluateContextualRisk(symbol, sessionId),
      newsAgent.analyze(symbol, sessionId),
      sentimentAgent.analyze(symbol, sessionId)
    ]);

    // Handle Technical Result
    const technicalReport = techRes.status === 'fulfilled' ? techRes.value : undefined;
    if (technicalReport) {
      agentReports.push({
        agentId: 'agent-technical',
        agentName: 'Technical Analysis Agent',
        asset: symbol,
        timestamp: technicalReport.dataTimestamp,
        timeframe: '1h',
        signal: technicalReport.signal,
        confidence: technicalReport.confidence,
        evidence: technicalReport.evidence,
        risks: technicalReport.risks,
        dataSources: technicalReport.dataSources,
        dataFreshness: ticker.isDemo ? 'DEMO' : 'LIVE',
        summary: technicalReport.summaryAr
      });
    }

    // Handle Structure Result
    const structureReport = structRes.status === 'fulfilled' ? structRes.value : undefined;
    if (structureReport) {
      agentReports.push({
        agentId: 'agent-market-structure',
        agentName: 'Market Structure Agent',
        asset: symbol,
        timestamp: structureReport.dataTimestamp,
        timeframe: '1h',
        signal: structureReport.signal,
        confidence: structureReport.confidence,
        evidence: structureReport.evidence,
        risks: structureReport.risks,
        dataSources: structureReport.dataSources,
        dataFreshness: ticker.isDemo ? 'DEMO' : 'LIVE',
        summary: structureReport.summaryAr
      });
    }

    // Handle Quant Result
    const quantReport = quantRes.status === 'fulfilled' ? quantRes.value : undefined;
    if (quantReport) {
      agentReports.push({
        agentId: 'agent-quant',
        agentName: 'Quantitative Agent',
        asset: symbol,
        timestamp: quantReport.dataTimestamp,
        timeframe: '1h',
        signal: quantReport.signal,
        confidence: quantReport.confidence,
        evidence: quantReport.evidence,
        risks: quantReport.risks,
        dataSources: ['EMPIRICAL_STATS'],
        dataFreshness: 'LIVE',
        summary: quantReport.summaryAr
      });
    }

    // Handle Risk AI Result
    const riskReport = riskRes.status === 'fulfilled' ? riskRes.value : undefined;
    if (riskReport) {
      agentReports.push({
        agentId: 'agent-risk',
        agentName: 'Risk Assessment Agent',
        asset: symbol,
        timestamp: riskReport.dataTimestamp,
        timeframe: '1h',
        signal: riskReport.riskGrade === 'LOW' ? 'BULLISH' : riskReport.riskGrade === 'HIGH' ? 'BEARISH' : 'NEUTRAL',
        confidence: 85,
        evidence: [`مستوى المخاطر السياقية: ${riskReport.riskGrade}`, riskReport.liquidityAssessment],
        risks: riskReport.thesisWeaknesses,
        dataSources: ['PORTFOLIO_ENGINE'],
        dataFreshness: 'LIVE',
        summary: riskReport.summaryAr
      });
    }

    // Attach News & Sentiment notices
    if (newsRes.status === 'fulfilled') {
      agentReports.push({
        agentId: 'agent-news',
        agentName: 'News Sentiment Agent',
        asset: symbol,
        timestamp: new Date().toISOString(),
        timeframe: '1d',
        signal: 'NEUTRAL',
        confidence: 0,
        evidence: [],
        risks: [],
        dataSources: ['OFFLINE'],
        dataFreshness: 'LIVE',
        summary: newsRes.value.summaryAr
      });
    }

    if (sentRes.status === 'fulfilled') {
      agentReports.push({
        agentId: 'agent-sentiment',
        agentName: 'Market Sentiment Agent',
        asset: symbol,
        timestamp: new Date().toISOString(),
        timeframe: '1d',
        signal: 'NEUTRAL',
        confidence: 0,
        evidence: [],
        risks: [],
        dataSources: ['OFFLINE'],
        dataFreshness: 'LIVE',
        summary: sentRes.value.summaryAr
      });
    }

    session.agentReports = agentReports;

    // 4. SUPERVISOR REVIEW & DECISION
    realtimeBus.broadcast('SUPERVISOR_REVIEW_STARTED', {
      sessionId,
      symbol,
      agentReportsCount: agentReports.length,
      timestamp: new Date().toISOString()
    });

    const supervisorDecision = await supervisorAgent.reviewAndDecide({
      symbol,
      currentPrice,
      sessionId,
      marketRegime: regime,
      technicalReport,
      structureReport,
      quantReport,
      riskReport
    });

    session.disagreementsDetected = supervisorDecision.disagreementScore >= 50;
    session.conflictReviewSummary = supervisorDecision.conflicts.length > 0 
      ? supervisorDecision.conflicts.join('; ') 
      : undefined;

    // Build CandidateTrade
    let candidateTrade: CandidateTrade | undefined = undefined;
    if (supervisorDecision.decision === 'LONG' || supervisorDecision.decision === 'SHORT') {
      const entry = supervisorDecision.suggestedEntry || currentPrice;
      const stop = supervisorDecision.stopLoss || (supervisorDecision.decision === 'LONG' ? entry * 0.98 : entry * 1.02);
      const riskReward = supervisorDecision.riskRewardEstimate || 2.0;

      candidateTrade = {
        asset: symbol,
        direction: supervisorDecision.decision,
        confidence: supervisorDecision.confidence,
        marketRegime: supervisorDecision.marketRegime,
        currentPrice,
        entryLow: supervisorDecision.entryLow || entry * 0.998,
        entryHigh: supervisorDecision.entryHigh || entry * 1.002,
        suggestedEntry: entry,
        stopLoss: stop,
        takeProfits: supervisorDecision.takeProfits.length > 0 ? supervisorDecision.takeProfits : [
          { level: 1, price: supervisorDecision.decision === 'LONG' ? entry * 1.015 : entry * 0.985, percentage: 50 },
          { level: 2, price: supervisorDecision.decision === 'LONG' ? entry * 1.03 : entry * 0.97, percentage: 50 }
        ],
        riskRewardRatio: riskReward,
        timeHorizon: supervisorDecision.timeHorizon,
        supportingReasons: supervisorDecision.supportingReasons,
        opposingReasons: supervisorDecision.opposingReasons,
        agentVotes: supervisorDecision.agentVotes,
        supervisorSummary: supervisorDecision.summaryAr,
        dataTimestamp: supervisorDecision.dataTimestamp
      };
      session.candidateTrade = candidateTrade;
    }

    realtimeBus.broadcast('SUPERVISOR_DECISION_CREATED', {
      sessionId,
      symbol,
      decision: supervisorDecision.decision,
      confidence: supervisorDecision.confidence,
      candidateTrade,
      summaryAr: supervisorDecision.summaryAr,
      timestamp: new Date().toISOString()
    });

    // 5. EVALUATE VIA DETERMINISTIC RISK ENGINE
    let riskDecision: RiskDecision | undefined = undefined;
    if (candidateTrade) {
      realtimeBus.broadcast('RISK_CHECK_STARTED', {
        sessionId,
        symbol,
        candidateTrade,
        timestamp: new Date().toISOString()
      });

      const openPositions = paperEngine.getOpenPositions();
      const portfolio = paperEngine.getPortfolioSummary();

      riskDecision = deterministicRiskEngine.evaluateCandidate(
        candidateTrade,
        settings,
        openPositions,
        database.tradeLedger,
        portfolio.equity
      );

      session.riskDecision = riskDecision;

      if (riskDecision.approved) {
        realtimeBus.broadcast('RISK_APPROVED', {
          sessionId,
          symbol,
          riskDecision,
          timestamp: new Date().toISOString()
        });

        db.addEvent({
          type: 'RISK',
          severity: 'SUCCESS',
          source: 'DETERMINISTIC_RISK_ENGINE',
          asset: symbol,
          message: `محرك المخاطر وافق على صفقة ${candidateTrade.direction} للأصل ${symbol}`
        });

        // 6. EXECUTE PAPER TRADE IF AUTO PAPER IS ON AND SHADOW MODE IS OFF
        if (settings.autoPaperTrading && !settings.shadowMode) {
          try {
            const executedPosition = paperEngine.executePaperTrade({
              asset: symbol,
              direction: candidateTrade.direction as 'LONG' | 'SHORT',
              quantity: riskDecision.suggestedQuantity,
              entryPrice: candidateTrade.suggestedEntry,
              stopLoss: candidateTrade.stopLoss,
              takeProfit: candidateTrade.takeProfits[0]?.price || (candidateTrade.direction === 'LONG' ? candidateTrade.suggestedEntry * 1.03 : candidateTrade.suggestedEntry * 0.97),
              strategyId: 'strat-multi-agent-v3',
              strategyName: 'Vercel AI Multi-Agent Consensus',
              supervisorConfidence: candidateTrade.confidence,
              analysisSessionId: sessionId
            });

            session.tradeExecuted = true;
            session.orderId = executedPosition.id;

            realtimeBus.broadcast('PAPER_ORDER_CREATED', {
              sessionId,
              position: executedPosition,
              timestamp: new Date().toISOString()
            });

            realtimeBus.broadcast('POSITION_OPENED', {
              sessionId,
              position: executedPosition,
              timestamp: new Date().toISOString()
            });
          } catch (execErr: any) {
            console.error('[AnalysisOrchestrator] Auto paper execution error:', execErr);
          }
        } else if (settings.shadowMode) {
          db.addEvent({
            type: 'RISK',
            severity: 'INFO',
            source: 'SHADOW_MODE',
            asset: symbol,
            message: `الوضع الظلي (Shadow Mode) مفعّل: تم تسجيل التوصية والتحقق من المخاطر بنجاح دون فتح مركز ورقي تلقائي.`
          });
        }
      } else {
        realtimeBus.broadcast('RISK_REJECTED', {
          sessionId,
          symbol,
          reasons: riskDecision.failedRules,
          timestamp: new Date().toISOString()
        });

        db.addEvent({
          type: 'RISK',
          severity: 'WARNING',
          source: 'DETERMINISTIC_RISK_ENGINE',
          asset: symbol,
          message: `محرك المخاطر الحتمي رفض الصفقة: ${riskDecision.failedRules.join(', ')}`
        });
      }
    }

    // 7. FINALIZE SESSION & PERSIST
    session.status = 'COMPLETED';
    session.completedAt = new Date().toISOString();
    db.save();

    this.activeSessionsBySymbol.delete(symbol);

    realtimeBus.broadcast('SESSION_COMPLETED', {
      session,
      timestamp: new Date().toISOString()
    });

    return session;
  }
}

export const analysisOrchestrator = new AnalysisOrchestrator();
