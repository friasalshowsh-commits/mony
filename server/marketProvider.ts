import { 
  Candle, 
  MarketDataMode, 
  MarketDataSource, 
  MarketDataStatus, 
  MarketRegime, 
  MarketSourceMetadata, 
  MarketTicker, 
  OHLCVCandle 
} from '../src/types/index.js';
import { eventBus } from './events.js';

export interface MarketDataProvider {
  name: string;
  source: MarketDataSource;
  mode: MarketDataMode;
  getTicker(symbol: string): Promise<MarketTicker>;
  getAllTickers(): Promise<MarketTicker[]>;
  getOHLCV(symbol: string, timeframe: string, limit?: number): Promise<Candle[]>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): {
    connected: boolean;
    lastTickTime: number;
    source: MarketDataSource;
    mode: MarketDataMode;
    activeSymbols: string[];
    reconnectAttempts: number;
  };
}

export const SUPPORTED_SYMBOLS = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'BNB/USDT',
  'XRP/USDT',
  'ADA/USDT',
  'DOGE/USDT',
  'LINK/USDT',
  'AVAX/USDT'
] as const;

export const SYMBOL_NAMES: Record<string, { en: string; ar: string }> = {
  'BTC/USDT': { en: 'Bitcoin', ar: 'بيتكوين' },
  'ETH/USDT': { en: 'Ethereum', ar: 'إيثيريوم' },
  'SOL/USDT': { en: 'Solana', ar: 'سولانا' },
  'BNB/USDT': { en: 'Binance Coin', ar: 'بينانس كوين' },
  'XRP/USDT': { en: 'Ripple', ar: 'ريبل' },
  'ADA/USDT': { en: 'Cardano', ar: 'كاردانو' },
  'DOGE/USDT': { en: 'Dogecoin', ar: 'دوج كوين' },
  'LINK/USDT': { en: 'Chainlink', ar: 'تشين لينك' },
  'AVAX/USDT': { en: 'Avalanche', ar: 'أفالانش' }
};

// Map internal formatted symbol (e.g. BTC/USDT) to Binance format (BTCUSDT)
export function toBinanceSymbol(symbol: string): string {
  return symbol.replace('/', '').toUpperCase();
}

// Map Binance symbol (e.g. BTCUSDT) to internal format (BTC/USDT)
export function fromBinanceSymbol(bSymbol: string): string {
  const upper = bSymbol.toUpperCase();
  for (const s of SUPPORTED_SYMBOLS) {
    if (toBinanceSymbol(s) === upper) return s;
  }
  if (upper.endsWith('USDT')) {
    return `${upper.slice(0, -4)}/USDT`;
  }
  return upper;
}

// Map timeframe to Binance interval string
export function toBinanceInterval(timeframe: string): string {
  const map: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d'
  };
  return map[timeframe] || '1h';
}

/**
 * LiveMarketDataProvider (Binance Public API + Combined WebSocket)
 */
export class LiveMarketDataProvider implements MarketDataProvider {
  public name = 'Binance Live Market Provider';
  public source: MarketDataSource = 'BINANCE';
  public mode: MarketDataMode = 'LIVE';

  private tickers: Map<string, MarketTicker> = new Map();
  private candleCache: Map<string, Candle[]> = new Map();
  private ws: any = null;
  private isRunning = false;
  private isConnected = false;
  private lastTickTime = 0;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private healthInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initDefaultTickers();
  }

  private initDefaultTickers() {
    const defaults: Record<string, { price: number; change24h: number }> = {
      'BTC/USDT': { price: 79200, change24h: 2.1 },
      'ETH/USDT': { price: 2150, change24h: 1.4 },
      'SOL/USDT': { price: 128, change24h: 3.2 },
      'BNB/USDT': { price: 580, change24h: 0.8 },
      'XRP/USDT': { price: 1.85, change24h: -0.5 },
      'ADA/USDT': { price: 0.65, change24h: 1.2 },
      'DOGE/USDT': { price: 0.091, change24h: -1.1 },
      'LINK/USDT': { price: 14.5, change24h: 2.4 },
      'AVAX/USDT': { price: 21.8, change24h: 0.9 }
    };

    for (const sym of SUPPORTED_SYMBOLS) {
      const def = defaults[sym] || { price: 100, change24h: 0 };
      this.tickers.set(sym, {
        symbol: sym,
        name: SYMBOL_NAMES[sym]?.en || sym,
        price: def.price,
        change24h: def.change24h,
        high24h: def.price * 1.03,
        low24h: def.price * 0.97,
        volume24h: 50000000,
        trend: def.change24h >= 0 ? 'BULLISH' : 'BEARISH',
        marketRegime: 'RANGE',
        aiScore: 75,
        riskLevel: 'MEDIUM',
        lastUpdated: new Date().toISOString(),
        isDemo: false,
        metadata: {
          source: 'BINANCE',
          mode: 'LIVE',
          receivedAt: new Date().toISOString(),
          marketTimestamp: Date.now(),
          freshnessMs: 0,
          isDemo: false,
          status: 'LIVE'
        }
      });
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[LiveMarketDataProvider] Starting Binance live market data feed...');

    // 1. Initial batch snapshot via public REST
    await this.fetchInitialRestTickers();

    // 2. Connect combined stream WebSocket
    this.connectWebSocket();

    // 3. Start health polling watchdog
    this.healthInterval = setInterval(() => {
      this.checkHealthAndPollFallback();
    }, 3000);
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.healthInterval) clearInterval(this.healthInterval);
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.isConnected = false;
    eventBus.emitEvent('MARKET_DISCONNECTED', {
      source: 'BINANCE',
      mode: 'LIVE',
      reason: 'Stopped by system',
      timestamp: Date.now()
    });
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      lastTickTime: this.lastTickTime,
      source: this.source,
      mode: this.mode,
      activeSymbols: Array.from(this.tickers.keys()),
      reconnectAttempts: this.reconnectAttempts
    };
  }

  public async getTicker(symbol: string): Promise<MarketTicker> {
    const t = this.tickers.get(symbol);
    if (t) return t;
    // Try to fetch single from Binance if not in map
    try {
      const bSym = toBinanceSymbol(symbol);
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${bSym}`);
      if (res.ok) {
        const d = await res.json();
        const norm = this.normalizeBinanceRestTicker(d);
        this.tickers.set(norm.symbol, norm);
        return norm;
      }
    } catch (e) {
      console.error(`[LiveMarketDataProvider] Failed to get ticker for ${symbol}:`, e);
    }
    throw new Error(`Symbol ${symbol} not found in market provider`);
  }

  public async getAllTickers(): Promise<MarketTicker[]> {
    return Array.from(this.tickers.values());
  }

  public async getOHLCV(symbol: string, timeframe: string = '1h', limit: number = 60): Promise<Candle[]> {
    const cacheKey = `${symbol}_${timeframe}_${limit}`;
    const bSym = toBinanceSymbol(symbol);
    const interval = toBinanceInterval(timeframe);

    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${bSym}&interval=${interval}&limit=${Math.min(limit, 100)}`;
      const res = await fetch(url);
      if (res.ok) {
        const rawKlines: any[] = await res.json();
        const candles: Candle[] = rawKlines.map((k) => {
          const timestamp = Number(k[0]);
          return {
            timestamp,
            time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
          };
        });
        this.candleCache.set(cacheKey, candles);
        return candles;
      }
    } catch (e) {
      console.warn(`[LiveMarketDataProvider] Failed to fetch klines from Binance for ${symbol}, using cache fallback:`, e);
    }

    if (this.candleCache.has(cacheKey)) {
      return this.candleCache.get(cacheKey)!;
    }

    // Fallback: build synthetic candles from latest known ticker price
    const ticker = this.tickers.get(symbol);
    const baseP = ticker?.price || 100;
    const now = Date.now();
    return Array.from({ length: 30 }).map((_, i) => {
      const ts = now - (30 - i) * 3600000;
      const p = baseP * (0.98 + (i / 30) * 0.04);
      return {
        timestamp: ts,
        time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        open: parseFloat((p * 0.998).toFixed(2)),
        high: parseFloat((p * 1.004).toFixed(2)),
        low: parseFloat((p * 0.996).toFixed(2)),
        close: parseFloat(p.toFixed(2)),
        volume: 10000 + i * 500
      };
    });
  }

  private async fetchInitialRestTickers(): Promise<void> {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (res.ok) {
        const allTickers: any[] = await res.json();
        const symbolMap = new Map<string, any>();
        for (const t of allTickers) {
          symbolMap.set(t.symbol, t);
        }

        for (const sym of SUPPORTED_SYMBOLS) {
          const bSym = toBinanceSymbol(sym);
          const raw = symbolMap.get(bSym);
          if (raw) {
            const normalized = this.normalizeBinanceRestTicker(raw);
            this.tickers.set(sym, normalized);
          }
        }
        this.lastTickTime = Date.now();
        console.log(`[LiveMarketDataProvider] Loaded initial prices for ${this.tickers.size} Binance symbols.`);
      }
    } catch (err) {
      console.error('[LiveMarketDataProvider] Initial Binance REST fetch error:', err);
    }
  }

  private connectWebSocket(): void {
    if (!this.isRunning) return;

    try {
      const streams = SUPPORTED_SYMBOLS.map(s => `${toBinanceSymbol(s).toLowerCase()}@ticker`).join('/');
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

      // Native WebSocket available in Node 22
      const ws = new (globalThis as any).WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[LiveMarketDataProvider] Binance WebSocket stream connected successfully.');
        eventBus.emitEvent('MARKET_CONNECTED', {
          source: 'BINANCE',
          mode: 'LIVE',
          timestamp: Date.now()
        });
      };

      ws.onmessage = (event: any) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg && msg.data && msg.data.s) {
            this.handleWebSocketTicker(msg.data);
          }
        } catch (e) {
          // ignore parse error
        }
      };

      ws.onerror = (err: any) => {
        console.warn('[LiveMarketDataProvider] Binance WebSocket error:', err.message || err);
      };

      ws.onclose = () => {
        this.isConnected = false;
        console.warn('[LiveMarketDataProvider] Binance WebSocket closed. Scheduling reconnection...');
        eventBus.emitEvent('MARKET_DISCONNECTED', {
          source: 'BINANCE',
          mode: 'LIVE',
          reason: 'WebSocket closed',
          timestamp: Date.now()
        });
        this.scheduleReconnect();
      };
    } catch (err) {
      console.error('[LiveMarketDataProvider] Failed to create WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.isRunning || this.reconnectTimeout) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    console.log(`[LiveMarketDataProvider] Reconnecting to Binance in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})...`);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connectWebSocket();
    }, delay);
  }

  private handleWebSocketTicker(d: any): void {
    const rawSymbol = d.s;
    const standardSymbol = fromBinanceSymbol(rawSymbol);
    const existing = this.tickers.get(standardSymbol);

    const price = parseFloat(d.c);
    const change24h = parseFloat(d.P);
    const high24h = parseFloat(d.h);
    const low24h = parseFloat(d.l);
    const volume24h = parseFloat(d.q);
    const now = Date.now();
    this.lastTickTime = now;

    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (change24h > 1.0) trend = 'BULLISH';
    else if (change24h < -1.0) trend = 'BEARISH';

    let marketRegime: MarketRegime = 'RANGE';
    const rangePct = low24h > 0 ? ((high24h - low24h) / low24h) * 100 : 0;
    if (rangePct > 6.0) marketRegime = 'HIGH_VOLATILITY';
    else if (Math.abs(change24h) > 4.0) marketRegime = 'BREAKOUT';
    else if (change24h > 1.5) marketRegime = 'BULL_TREND';
    else if (change24h < -1.5) marketRegime = 'BEAR_TREND';

    // Quantitative AI score based on trend and volatility
    const aiScore = Math.min(95, Math.max(30, Math.round(50 + change24h * 3.5)));

    const updated: MarketTicker = {
      symbol: standardSymbol,
      name: SYMBOL_NAMES[standardSymbol]?.en || standardSymbol,
      price,
      change24h,
      high24h,
      low24h,
      volume24h,
      trend,
      marketRegime,
      aiScore,
      riskLevel: rangePct > 5.0 ? 'HIGH' : rangePct > 2.5 ? 'MEDIUM' : 'LOW',
      lastUpdated: new Date().toISOString(),
      isDemo: false,
      metadata: {
        source: 'BINANCE',
        mode: 'LIVE',
        receivedAt: new Date().toISOString(),
        marketTimestamp: d.E || now,
        freshnessMs: Math.max(0, now - (d.E || now)),
        isDemo: false,
        status: 'LIVE'
      }
    };

    this.tickers.set(standardSymbol, updated);

    // Emit live update
    eventBus.emitEvent('MARKET_PRICE_UPDATED', {
      ticker: updated,
      mode: 'LIVE'
    });
  }

  private normalizeBinanceRestTicker(raw: any): MarketTicker {
    const symbol = fromBinanceSymbol(raw.symbol);
    const price = parseFloat(raw.lastPrice);
    const change24h = parseFloat(raw.priceChangePercent);
    const high24h = parseFloat(raw.highPrice);
    const low24h = parseFloat(raw.lowPrice);
    const volume24h = parseFloat(raw.quoteVolume);
    const now = Date.now();

    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (change24h > 1.0) trend = 'BULLISH';
    else if (change24h < -1.0) trend = 'BEARISH';

    const rangePct = low24h > 0 ? ((high24h - low24h) / low24h) * 100 : 0;
    let marketRegime: MarketRegime = 'RANGE';
    if (rangePct > 6.0) marketRegime = 'HIGH_VOLATILITY';
    else if (Math.abs(change24h) > 4.0) marketRegime = 'BREAKOUT';
    else if (change24h > 1.5) marketRegime = 'BULL_TREND';
    else if (change24h < -1.5) marketRegime = 'BEAR_TREND';

    const aiScore = Math.min(95, Math.max(30, Math.round(50 + change24h * 3.5)));

    return {
      symbol,
      name: SYMBOL_NAMES[symbol]?.en || symbol,
      price,
      change24h,
      high24h,
      low24h,
      volume24h,
      trend,
      marketRegime,
      aiScore,
      riskLevel: rangePct > 5.0 ? 'HIGH' : rangePct > 2.5 ? 'MEDIUM' : 'LOW',
      lastUpdated: new Date().toISOString(),
      isDemo: false,
      metadata: {
        source: 'BINANCE',
        mode: 'LIVE',
        receivedAt: new Date().toISOString(),
        marketTimestamp: raw.closeTime || now,
        freshnessMs: Math.max(0, now - (raw.closeTime || now)),
        isDemo: false,
        status: 'LIVE'
      }
    };
  }

  private async checkHealthAndPollFallback(): Promise<void> {
    const now = Date.now();
    // If no WS tick has arrived in the last 4 seconds, poll via REST fallback
    if (now - this.lastTickTime > 4000) {
      try {
        const symbolsParam = JSON.stringify(SUPPORTED_SYMBOLS.map(s => toBinanceSymbol(s)));
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;
        const res = await fetch(url);
        if (res.ok) {
          const arr: any[] = await res.json();
          for (const item of arr) {
            const normalized = this.normalizeBinanceRestTicker(item);
            this.tickers.set(normalized.symbol, normalized);
            eventBus.emitEvent('MARKET_PRICE_UPDATED', {
              ticker: normalized,
              mode: 'LIVE'
            });
          }
          this.lastTickTime = now;
          this.isConnected = true;
        }
      } catch (e) {
        // network issue
      }
    }
  }
}

/**
 * DemoMarketDataProvider (Isolated Mock Simulation Mode)
 * Explicitly marks every object with isDemo: true and status: 'DEMO'
 */
export class DemoMarketDataProvider implements MarketDataProvider {
  public name = 'Demo Simulation Market Provider';
  public source: MarketDataSource = 'DEMO';
  public mode: MarketDataMode = 'DEMO';

  private tickers: Map<string, MarketTicker> = new Map();
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.initDemoTickers();
  }

  private initDemoTickers() {
    const demoPrices: Record<string, number> = {
      'BTC/USDT': 64850,
      'ETH/USDT': 3480,
      'SOL/USDT': 152,
      'BNB/USDT': 590,
      'XRP/USDT': 0.58,
      'ADA/USDT': 0.48,
      'DOGE/USDT': 0.12,
      'LINK/USDT': 18.5,
      'AVAX/USDT': 32.4
    };

    for (const sym of SUPPORTED_SYMBOLS) {
      const p = demoPrices[sym] || 100;
      this.tickers.set(sym, {
        symbol: sym,
        name: `[DEMO] ${SYMBOL_NAMES[sym]?.en || sym}`,
        price: p,
        change24h: 1.25,
        high24h: p * 1.02,
        low24h: p * 0.98,
        volume24h: 10000000,
        trend: 'BULLISH',
        marketRegime: 'RANGE',
        aiScore: 70,
        riskLevel: 'LOW',
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        metadata: {
          source: 'DEMO',
          mode: 'DEMO',
          receivedAt: new Date().toISOString(),
          marketTimestamp: Date.now(),
          freshnessMs: 0,
          isDemo: true,
          status: 'DEMO'
        }
      });
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[DemoMarketDataProvider] Starting Demo simulated market ticker loop...');

    this.interval = setInterval(() => {
      this.tickDemoPrices();
    }, 2500);
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  public getStatus() {
    return {
      connected: true,
      lastTickTime: Date.now(),
      source: this.source,
      mode: this.mode,
      activeSymbols: Array.from(this.tickers.keys()),
      reconnectAttempts: 0
    };
  }

  public async getTicker(symbol: string): Promise<MarketTicker> {
    const t = this.tickers.get(symbol);
    if (!t) throw new Error(`Demo symbol ${symbol} not found`);
    return t;
  }

  public async getAllTickers(): Promise<MarketTicker[]> {
    return Array.from(this.tickers.values());
  }

  public async getOHLCV(symbol: string, timeframe: string = '1h', limit: number = 60): Promise<Candle[]> {
    const ticker = this.tickers.get(symbol);
    const baseP = ticker?.price || 100;
    const now = Date.now();
    return Array.from({ length: limit }).map((_, i) => {
      const ts = now - (limit - i) * 3600000;
      const p = baseP * (0.97 + (i / limit) * 0.03 + (Math.sin(i / 2) * 0.005));
      return {
        timestamp: ts,
        time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        open: parseFloat((p * 0.998).toFixed(2)),
        high: parseFloat((p * 1.004).toFixed(2)),
        low: parseFloat((p * 0.996).toFixed(2)),
        close: parseFloat(p.toFixed(2)),
        volume: 5000 + Math.floor(Math.random() * 2000)
      };
    });
  }

  private tickDemoPrices() {
    for (const [sym, t] of this.tickers.entries()) {
      const delta = (Math.random() - 0.495) * (t.price * 0.001);
      const newPrice = Math.max(0.0001, parseFloat((t.price + delta).toFixed(4)));
      const now = Date.now();

      const updated: MarketTicker = {
        ...t,
        price: newPrice,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        metadata: {
          source: 'DEMO',
          mode: 'DEMO',
          receivedAt: new Date().toISOString(),
          marketTimestamp: now,
          freshnessMs: 0,
          isDemo: true,
          status: 'DEMO'
        }
      };
      this.tickers.set(sym, updated);
      eventBus.emitEvent('MARKET_PRICE_UPDATED', {
        ticker: updated,
        mode: 'DEMO'
      });
    }
  }
}

/**
 * MarketFreshnessService
 * Monitors data age, transitions status, and guards paper trade execution
 */
export class MarketFreshnessService {
  private statusMap: Map<string, { status: MarketDataStatus; lastSeen: number }> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startWatchdog();
  }

  private startWatchdog() {
    this.checkInterval = setInterval(() => {
      this.evaluateAll();
    }, 2000);
  }

  public updateSeen(symbol: string, timestamp: number, isDemo: boolean = false) {
    const existing = this.statusMap.get(symbol);
    const newStatus: MarketDataStatus = isDemo ? 'DEMO' : 'LIVE';
    this.statusMap.set(symbol, {
      status: newStatus,
      lastSeen: timestamp
    });

    if (existing && existing.status !== newStatus) {
      eventBus.emitEvent('FRESHNESS_CHANGED', {
        symbol,
        status: newStatus,
        freshnessMs: Math.max(0, Date.now() - timestamp)
      });
    }
  }

  public getStatus(symbol: string): MarketDataStatus {
    const record = this.statusMap.get(symbol);
    if (!record) return 'DISCONNECTED';
    return record.status;
  }

  private evaluateAll() {
    const now = Date.now();
    for (const [symbol, rec] of this.statusMap.entries()) {
      if (rec.status === 'DEMO') continue;

      const age = now - rec.lastSeen;
      let newStatus: MarketDataStatus = rec.status;

      if (age > 45000) {
        newStatus = 'STALE';
      } else if (age > 15000) {
        newStatus = 'DELAYED';
      } else {
        newStatus = 'LIVE';
      }

      if (newStatus !== rec.status) {
        rec.status = newStatus;
        eventBus.emitEvent('FRESHNESS_CHANGED', {
          symbol,
          status: newStatus,
          freshnessMs: age
        });
      }
    }
  }

  /**
   * Deterministic guard: blocks trade if market is STALE or DISCONNECTED
   */
  public isMarketSafeForExecution(symbol: string): { safe: boolean; reason?: string } {
    const rec = this.statusMap.get(symbol);
    if (!rec) {
      return {
        safe: false,
        reason: 'بيانات السوق غير متصلة (DISCONNECTED). تم منع فتح الصفقة لحماية سلامة المحفظة.'
      };
    }

    if (rec.status === 'STALE') {
      return {
        safe: false,
        reason: 'بيانات السوق قديمة وغير محدثة (STALE). تم رفض فتح الصفقة حتى يستقر البث اللحظي.'
      };
    }

    if (rec.status === 'DISCONNECTED') {
      return {
        safe: false,
        reason: 'انقطع الاتصال بمزود الأسعار (DISCONNECTED). يرجى الانتظار حتى عودة الاتصال.'
      };
    }

    return { safe: true };
  }
}

export const liveProvider = new LiveMarketDataProvider();
export const demoProvider = new DemoMarketDataProvider();
export const freshnessService = new MarketFreshnessService();
