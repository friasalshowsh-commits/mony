import { tool } from 'ai';
import { z } from 'zod';
import { marketDataEngine } from '../../marketData.js';

export const getTechnicalIndicatorsTool = tool({
  description: 'Calculates deterministic mathematical indicators (RSI, MACD, EMAs, SMA, ATR, Bollinger Bands, ADX, VWAP, OBV) from real candles.',
  inputSchema: z.object({
    symbol: z.string().describe('Trading pair symbol, e.g. BTC/USDT'),
    timeframe: z.enum(['5m', '15m', '1h', '4h', '1d']).default('1h').describe('Timeframe interval')
  }),
  execute: async ({ symbol, timeframe }) => {
    try {
      const candles = await marketDataEngine.getOHLCV(symbol, timeframe, 60);
      if (!candles || candles.length < 15) {
        return {
          symbol,
          timeframe,
          status: 'INSUFFICIENT_DATA',
          messageAr: 'بيانات الشموع غير كافية لحساب المؤشرات بدقة'
        };
      }

      const ind = marketDataEngine.calculateIndicators(candles);
      const lastCandle = candles[candles.length - 1];

      return {
        symbol,
        timeframe,
        currentPrice: lastCandle.close,
        rsi: {
          value: ind.rsi,
          signal: ind.rsiSignal,
          zone: ind.rsi > 70 ? 'OVERBOUGHT' : ind.rsi < 30 ? 'OVERSOLD' : 'NEUTRAL'
        },
        macd: {
          value: ind.macd.value,
          signal: ind.macd.signal,
          histogram: ind.macd.histogram,
          trend: ind.macd.trend
        },
        movingAverages: {
          emaAlignment: ind.emaAlignment
        },
        bollingerBands: {
          upper: ind.bollingerBands.upper,
          middle: ind.bollingerBands.middle,
          lower: ind.bollingerBands.lower,
          position: ind.bollingerBands.position
        },
        volatility: {
          atr: ind.atr,
          atrPercent: ((ind.atr / lastCandle.close) * 100).toFixed(2) + '%'
        },
        trendStrength: {
          adx: ind.adx,
          isTrending: ind.adx >= 25
        },
        volume: {
          obvTrend: ind.obvTrend,
          vwap: ind.vwap
        },
        status: 'SUCCESS'
      };
    } catch (err: any) {
      return {
        symbol,
        timeframe,
        status: 'ERROR',
        error: err.message
      };
    }
  }
});
