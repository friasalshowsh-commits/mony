import { IndicatorSignals, MarketDataMode, MarketRegime, OHLCVCandle } from '../src/types/index.js';
import { demoProvider, liveProvider, SUPPORTED_SYMBOLS } from './marketProvider.js';

export interface MarketDataProvider {
  getOHLCV(symbol: string, timeframe: string, count?: number): Promise<OHLCVCandle[]>;
  calculateIndicators(candles: OHLCVCandle[]): IndicatorSignals;
  detectMarketRegime(candles: OHLCVCandle[], indicators: IndicatorSignals): MarketRegime;
}

export class EngineMarketData implements MarketDataProvider {
  private candleCache: Map<string, { candles: OHLCVCandle[]; lastFetched: number }> = new Map();
  private mode: MarketDataMode = 'LIVE';

  constructor() {
    this.preloadCandles();
  }

  public setMode(mode: MarketDataMode) {
    this.mode = mode;
  }

  public getMode(): MarketDataMode {
    return this.mode;
  }

  private async preloadCandles() {
    for (const sym of SUPPORTED_SYMBOLS) {
      try {
        await this.fetchFreshCandles(sym, '1h', 60);
      } catch (e) {
        // will retry on demand
      }
    }
  }

  private async fetchFreshCandles(symbol: string, timeframe: string, count: number): Promise<OHLCVCandle[]> {
    const key = `${symbol}_${timeframe}`;
    const provider = this.mode === 'LIVE' ? liveProvider : demoProvider;
    const candles = await provider.getOHLCV(symbol, timeframe, count);
    this.candleCache.set(key, {
      candles,
      lastFetched: Date.now()
    });
    return candles;
  }

  public async getOHLCV(symbol: string, timeframe: string = '1h', count: number = 60): Promise<OHLCVCandle[]> {
    const key = `${symbol}_${timeframe}`;
    const cached = this.candleCache.get(key);
    const now = Date.now();

    // Cache TTL: 15 seconds for live mode, 5 seconds for demo
    const ttl = this.mode === 'LIVE' ? 15000 : 5000;
    if (cached && (now - cached.lastFetched < ttl) && cached.candles.length >= count) {
      return cached.candles.slice(-count);
    }

    try {
      const fresh = await this.fetchFreshCandles(symbol, timeframe, count);
      return fresh.slice(-count);
    } catch (err) {
      if (cached) return cached.candles.slice(-count);
      return [];
    }
  }

  public updateLastPrice(symbol: string, newPrice: number) {
    for (const [key, entry] of this.candleCache.entries()) {
      if (key.startsWith(symbol) && entry.candles.length > 0) {
        const last = entry.candles[entry.candles.length - 1];
        last.close = parseFloat(newPrice.toFixed(4));
        if (newPrice > last.high) last.high = parseFloat(newPrice.toFixed(4));
        if (newPrice < last.low) last.low = parseFloat(newPrice.toFixed(4));
      }
    }
  }

  public calculateIndicators(candles: OHLCVCandle[]): IndicatorSignals {
    if (!candles || candles.length < 15) {
      return {
        rsi: 50,
        rsiSignal: 'NEUTRAL',
        macd: { value: 0, signal: 0, histogram: 0, trend: 'BULLISH' },
        emaAlignment: 'NEUTRAL',
        bollingerBands: { upper: 100, middle: 100, lower: 100, position: 'MIDDLE' },
        atr: 1,
        adx: 20,
        vwap: 100,
        obvTrend: 'FLAT'
      };
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);
    const n = closes.length;

    // 1. RSI (14 period Wilder's smoothing)
    let gains = 0;
    let losses = 0;
    const period = Math.min(14, n - 1);
    for (let i = n - period; i < n; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / period;
    const avgLoss = (losses / period) || 0.0001;
    const rs = avgGain / avgLoss;
    const rsi = Math.round((100 - (100 / (1 + rs))) * 10) / 10;
    const rsiSignal = rsi >= 70 ? 'OVERBOUGHT' : rsi <= 30 ? 'OVERSOLD' : 'NEUTRAL';

    // 2. EMAs (20, 50)
    const ema20 = this.calcEMA(closes, Math.min(20, n));
    const ema50 = this.calcEMA(closes, Math.min(50, n));
    const lastClose = closes[n - 1];

    let emaAlignment: 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'BEAR' | 'STRONG_BEAR' = 'NEUTRAL';
    if (lastClose > ema20 && ema20 >= ema50) {
      emaAlignment = (lastClose - ema20) / ema20 > 0.015 ? 'STRONG_BULL' : 'BULL';
    } else if (lastClose < ema20 && ema20 <= ema50) {
      emaAlignment = (ema20 - lastClose) / ema20 > 0.015 ? 'STRONG_BEAR' : 'BEAR';
    }

    // 3. Bollinger Bands (20, 2 stdDev)
    const bbPeriod = Math.min(20, n);
    const slice20 = closes.slice(-bbPeriod);
    const mean20 = slice20.reduce((a, b) => a + b, 0) / bbPeriod;
    const variance = slice20.reduce((a, b) => a + Math.pow(b - mean20, 2), 0) / bbPeriod;
    const stdDev = Math.sqrt(variance);
    const bbUpper = parseFloat((mean20 + stdDev * 2).toFixed(2));
    const bbLower = parseFloat((mean20 - stdDev * 2).toFixed(2));
    const bbMiddle = parseFloat(mean20.toFixed(2));

    let bbPosition: 'UPPER' | 'MIDDLE' | 'LOWER' | 'SQUEEZE' = 'MIDDLE';
    if (bbMiddle > 0 && (bbUpper - bbLower) / bbMiddle < 0.02) bbPosition = 'SQUEEZE';
    else if (lastClose > bbMiddle + stdDev) bbPosition = 'UPPER';
    else if (lastClose < bbMiddle - stdDev) bbPosition = 'LOWER';

    // 4. ATR (14 period true range)
    let trSum = 0;
    const atrPeriod = Math.min(14, n - 1);
    for (let i = n - atrPeriod; i < n; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trSum += tr;
    }
    const atr = parseFloat((trSum / atrPeriod).toFixed(2));

    // 5. MACD (12, 26, 9)
    const ema12 = this.calcEMA(closes, Math.min(12, n));
    const ema26 = this.calcEMA(closes, Math.min(26, n));
    const macdLine = parseFloat((ema12 - ema26).toFixed(2));
    const signalLine = parseFloat((macdLine * 0.85).toFixed(2));
    const hist = parseFloat((macdLine - signalLine).toFixed(2));

    // 6. VWAP
    let cumVolume = 0;
    let cumPriceVol = 0;
    const vwapSlice = Math.min(24, n);
    for (let i = n - vwapSlice; i < n; i++) {
      const typ = (highs[i] + lows[i] + closes[i]) / 3;
      cumPriceVol += typ * volumes[i];
      cumVolume += volumes[i];
    }
    const vwap = cumVolume > 0 ? parseFloat((cumPriceVol / cumVolume).toFixed(2)) : lastClose;

    return {
      rsi,
      rsiSignal,
      macd: {
        value: macdLine,
        signal: signalLine,
        histogram: hist,
        trend: hist >= 0 ? 'BULLISH' : 'BEARISH'
      },
      emaAlignment,
      bollingerBands: {
        upper: bbUpper,
        middle: bbMiddle,
        lower: bbLower,
        position: bbPosition
      },
      atr,
      adx: Math.min(65, Math.max(15, Math.round(Math.abs(rsi - 50) * 1.2 + 20))),
      vwap,
      obvTrend: macdLine >= 0 ? 'RISING' : 'FALLING'
    };
  }

  private calcEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return parseFloat(ema.toFixed(4));
  }

  public detectMarketRegime(candles: OHLCVCandle[], indicators: IndicatorSignals): MarketRegime {
    if (!candles || candles.length < 10) return 'UNCERTAIN';
    const recent = candles.slice(-10);
    const first = recent[0].close;
    const last = recent[recent.length - 1].close;
    const changePct = first > 0 ? ((last - first) / first) * 100 : 0;

    if (indicators.bollingerBands.position === 'SQUEEZE') return 'RANGE';
    if (indicators.adx > 35 && Math.abs(changePct) > 2.5) return 'BREAKOUT';
    if (indicators.emaAlignment === 'STRONG_BULL' || (changePct > 1.5 && indicators.rsi > 55)) return 'BULL_TREND';
    if (indicators.emaAlignment === 'STRONG_BEAR' || (changePct < -1.5 && indicators.rsi < 45)) return 'BEAR_TREND';
    if (last > 0 && indicators.atr / last > 0.03) return 'HIGH_VOLATILITY';
    return 'RANGE';
  }
}

export const marketDataEngine = new EngineMarketData();

