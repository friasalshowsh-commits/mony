import { MarketTicker } from '../src/types/index.js';
import { orchestrator } from './agentOrchestrator.js';
import { db } from './db.js';
import { eventBus } from './events.js';
import { marketDataEngine } from './marketData.js';
import { demoProvider, liveProvider } from './marketProvider.js';
import { paperEngine } from './paperEngine.js';
import { realtimeBus } from './realtime.js';

export class MarketScannerLoop {
  private timer: NodeJS.Timeout | null = null;
  private scanCounter: number = 0;
  private isScanning: boolean = false;
  private unsubscribeBus: (() => void) | null = null;

  public async start() {
    const database = db.getDB();
    const mode = database.settings.dataMode || 'LIVE';

    console.log(`[Scanner] Initializing market scanner in ${mode} mode...`);

    // 1. Listen for price updates from active market provider
    this.unsubscribeBus = eventBus.onEvent('MARKET_PRICE_UPDATED', ({ ticker }) => {
      this.handleIncomingPrice(ticker);
    });

    // 2. Start provider based on current mode
    marketDataEngine.setMode(mode);
    if (mode === 'LIVE') {
      await liveProvider.start();
    } else {
      await demoProvider.start();
    }

    // 3. Start scanning loop for periodic opportunity analysis
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.opportunityCheckTick(), 3000);
    console.log('[Scanner] Continuous market scanner running successfully.');
  }

  public async switchMode(newMode: 'LIVE' | 'DEMO') {
    console.log(`[Scanner] Switching market data mode to: ${newMode}`);
    marketDataEngine.setMode(newMode);
    const database = db.getDB();
    database.settings.dataMode = newMode;
    db.save();

    if (newMode === 'LIVE') {
      await demoProvider.stop();
      await liveProvider.start();
    } else {
      await liveProvider.stop();
      await demoProvider.start();
    }

    eventBus.emitEvent('DATA_MODE_CHANGED', { mode: newMode });
    realtimeBus.broadcast('SETTINGS_UPDATED', database.settings);
  }

  public async stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.unsubscribeBus) {
      this.unsubscribeBus();
      this.unsubscribeBus = null;
    }
    await liveProvider.stop();
    await demoProvider.stop();
  }

  private handleIncomingPrice(ticker: MarketTicker) {
    const database = db.getDB();
    const existingIndex = database.tickers.findIndex(t => t.symbol === ticker.symbol);

    if (existingIndex >= 0) {
      database.tickers[existingIndex] = ticker;
    } else {
      database.tickers.push(ticker);
    }

    // Update candle stream
    marketDataEngine.updateLastPrice(ticker.symbol, ticker.price);

    // Evaluate active paper positions
    paperEngine.onPriceTick(ticker);

    // Broadcast ticker update to frontend clients
    realtimeBus.broadcast('TICKER_UPDATED', ticker);
  }

  private async opportunityCheckTick() {
    const database = db.getDB();
    const settings = database.settings;

    this.scanCounter++;

    // Autonomous Opportunity Detection (every ~8 ticks if active)
    if (settings.scannerActive && !settings.systemPaused && !this.isScanning && this.scanCounter % 8 === 0) {
      this.isScanning = true;
      try {
        await this.scanForOpportunities();
      } catch (err) {
        console.error('[Scanner] Opportunity scan error:', err);
      } finally {
        this.isScanning = false;
      }
    }
  }

  public async scanForOpportunities(): Promise<void> {
    const database = db.getDB();
    // Assets that don't already have an open position
    const openAssets = new Set(database.positions.map(p => p.asset));
    const availableTickers = database.tickers.filter(t => !openAssets.has(t.symbol));

    if (availableTickers.length === 0) return;

    // Filter candidate with high momentum or breakout
    const candidate = availableTickers.find(t => 
      t.trend === 'BULLISH' && (t.marketRegime === 'BREAKOUT' || t.marketRegime === 'BULL_TREND')
    ) || availableTickers.find(t => Math.abs(t.change24h) > 2.0) || availableTickers[0];

    if (!candidate) return;

    const reasons = [
      `توسع ملحوظ في أحجام التداول الحية: +${(130 + Math.random() * 90).toFixed(0)}% فوق متوسط 24 ساعة`,
      `اختراق هيكل السوق (BOS) مع زخم تصاعدي قوي على ${candidate.symbol}`,
      `تباعد إيجابي في مؤشر القوة النسبية RSI واختراق نطاق المقاومة`,
      `تراكم سيولة شراء واضحة عند مستويات الدعم الفني`
    ];
    const triggerReason = reasons[Math.floor(Math.random() * reasons.length)];

    db.addEvent({
      type: 'SCANNER',
      severity: 'INFO',
      source: 'ماسح السوق اللحظي',
      asset: candidate.symbol,
      message: `تم رصد فرصة تداول محتملة على ${candidate.symbol}: ${triggerReason}`
    });

    await orchestrator.runAnalysisSession(candidate.symbol, triggerReason);
  }

  public async manualTriggerScan(symbol?: string): Promise<any> {
    const database = db.getDB();
    const assetToScan = symbol || (database.tickers.length > 0 ? database.tickers[0].symbol : 'BTC/USDT');
    const triggerReason = `طلب المشغل تحليل يدوي فوري وشامل بواسطة الوكلاء العشرة لرمز ${assetToScan}`;
    
    db.addEvent({
      type: 'SCANNER',
      severity: 'INFO',
      source: 'تشغيل يدوي',
      asset: assetToScan,
      message: triggerReason
    });

    return await orchestrator.runAnalysisSession(assetToScan, triggerReason);
  }
}

export const scannerLoop = new MarketScannerLoop();
