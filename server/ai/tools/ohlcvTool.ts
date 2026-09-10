import { tool } from 'ai';
import { z } from 'zod';
import { marketDataEngine } from '../../marketData.js';

export const getOHLCVTool = tool({
  description: 'Retrieves authoritative historical OHLCV (Open, High, Low, Close, Volume) candlestick data for technical and market structure analysis.',
  inputSchema: z.object({
    symbol: z.string().describe('Asset symbol e.g. BTC/USDT'),
    timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']).default('1h').describe('Timeframe interval'),
    limit: z.number().min(10).max(120).default(50).describe('Number of candles to return')
  }),
  execute: async ({ symbol, timeframe, limit }) => {
    try {
      const candles = await marketDataEngine.getOHLCV(symbol, timeframe, limit);
      if (!candles || candles.length === 0) {
        return {
          symbol,
          timeframe,
          count: 0,
          candles: [],
          status: 'NO_DATA'
        };
      }

      return {
        symbol,
        timeframe,
        count: candles.length,
        candles: candles.map(c => ({
          time: c.time,
          timestamp: c.timestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume
        })),
        latestClose: candles[candles.length - 1].close,
        status: 'SUCCESS'
      };
    } catch (err: any) {
      return {
        symbol,
        timeframe,
        count: 0,
        error: err.message,
        status: 'ERROR'
      };
    }
  }
});
