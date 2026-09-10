import { tool } from 'ai';
import { z } from 'zod';
import { backtestEngine } from '../../backtestEngine.js';

export const runStrategyBacktestTool = tool({
  description: 'Simulates historical performance statistics for an algorithmic strategy over historical candle bars.',
  parameters: z.object({
    asset: z.string(),
    timeframe: z.enum(['15m', '1h', '4h', '1d']).default('1h'),
    strategyId: z.string().optional()
  }),
  execute: async ({ asset, timeframe, strategyId }) => {
    try {
      const result = await backtestEngine.runBacktest({
        strategyId: strategyId || 'strat-multi-agent-v3',
        asset,
        timeframe,
        initialCapital: 100000
      });

      return {
        asset,
        timeframe,
        winRate: result.winRate,
        profitFactor: result.profitFactor,
        sharpeRatio: result.sharpeRatio,
        maxDrawdown: result.maxDrawdown,
        totalTrades: result.totalTrades,
        netProfit: result.netProfit
      };
    } catch (err: any) {
      return {
        error: err.message,
        status: 'FAILED'
      };
    }
  }
});
