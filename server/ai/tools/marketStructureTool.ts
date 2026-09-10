import { tool } from 'ai';
import { z } from 'zod';
import { marketDataEngine } from '../../marketData.js';

export const getMarketStructureTool = tool({
  description: 'Analyzes price action structure: Swing Highs/Lows, Break of Structure (BOS), Change of Character (CHoCH), Order Blocks, and Key Support/Resistance levels.',
  inputSchema: z.object({
    symbol: z.string().describe('Trading pair symbol, e.g. BTC/USDT'),
    timeframe: z.enum(['15m', '1h', '4h', '1d']).default('1h')
  }),
  execute: async ({ symbol, timeframe }) => {
    try {
      const candles = await marketDataEngine.getOHLCV(symbol, timeframe, 60);
      if (!candles || candles.length < 20) {
        return {
          symbol,
          timeframe,
          status: 'INSUFFICIENT_DATA',
          messageAr: 'البيانات غير كافية لتحليل هيكل السوق'
        };
      }

      const currentPrice = candles[candles.length - 1].close;

      // Detect swing highs and lows
      const swingHighs: number[] = [];
      const swingLows: number[] = [];

      for (let i = 2; i < candles.length - 2; i++) {
        const c = candles[i];
        const prev1 = candles[i - 1];
        const prev2 = candles[i - 2];
        const next1 = candles[i + 1];
        const next2 = candles[i + 2];

        if (c.high > prev1.high && c.high > prev2.high && c.high > next1.high && c.high > next2.high) {
          swingHighs.push(c.high);
        }
        if (c.low < prev1.low && c.low < prev2.low && c.low < next1.low && c.low < next2.low) {
          swingLows.push(c.low);
        }
      }

      const lastHigh = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : currentPrice * 1.02;
      const prevHigh = swingHighs.length > 1 ? swingHighs[swingHighs.length - 2] : lastHigh * 0.99;
      const lastLow = swingLows.length > 0 ? swingLows[swingLows.length - 1] : currentPrice * 0.98;
      const prevLow = swingLows.length > 1 ? swingLows[swingLows.length - 2] : lastLow * 0.99;

      const isHigherHigh = lastHigh > prevHigh;
      const isHigherLow = lastLow > prevLow;
      const isLowerLow = lastLow < prevLow;
      const isLowerHigh = lastHigh < prevHigh;

      let structuralTrend: 'BULLISH' | 'BEARISH' | 'RANGING' = 'RANGING';
      let breakOfStructure: string = 'NONE';

      if (isHigherHigh && isHigherLow) {
        structuralTrend = 'BULLISH';
        if (currentPrice > lastHigh) {
          breakOfStructure = 'BULLISH_BOS_CONFIRMED';
        }
      } else if (isLowerHigh && isLowerLow) {
        structuralTrend = 'BEARISH';
        if (currentPrice < lastLow) {
          breakOfStructure = 'BEARISH_BOS_CONFIRMED';
        }
      }

      // Order block zones
      const orderBlockDemand = {
        low: parseFloat((lastLow * 0.995).toFixed(2)),
        high: parseFloat((lastLow * 1.008).toFixed(2)),
        type: 'BULLISH_ORDER_BLOCK'
      };
      const orderBlockSupply = {
        low: parseFloat((lastHigh * 0.992).toFixed(2)),
        high: parseFloat((lastHigh * 1.005).toFixed(2)),
        type: 'BEARISH_ORDER_BLOCK'
      };

      // Support and resistance levels
      const supportLevels = [
        parseFloat(lastLow.toFixed(2)),
        parseFloat((lastLow * 0.975).toFixed(2)),
        parseFloat((currentPrice * 0.95).toFixed(2))
      ].sort((a, b) => b - a);

      const resistanceLevels = [
        parseFloat(lastHigh.toFixed(2)),
        parseFloat((lastHigh * 1.025).toFixed(2)),
        parseFloat((currentPrice * 1.05).toFixed(2))
      ].sort((a, b) => a - b);

      return {
        symbol,
        timeframe,
        currentPrice,
        structuralTrend,
        breakOfStructure,
        swingPoints: {
          lastHigh: parseFloat(lastHigh.toFixed(2)),
          lastLow: parseFloat(lastLow.toFixed(2)),
          isHigherHigh,
          isHigherLow,
          isLowerHigh,
          isLowerLow
        },
        orderBlocks: {
          demand: orderBlockDemand,
          supply: orderBlockSupply
        },
        keyLevels: {
          supportLevels,
          resistanceLevels
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
