import { tool } from 'ai';
import { z } from 'zod';
import { paperEngine } from '../../paperEngine.js';

export const getPortfolioContextTool = tool({
  description: 'Read-only tool returning authoritative account equity, available cash, open risk, current drawdown, and daily PnL.',
  inputSchema: z.object({}),
  execute: async () => {
    const summary = paperEngine.getPortfolioSummary();
    return {
      equity: summary.equity,
      cashBalance: summary.cashBalance,
      availableCapital: summary.availableCapital,
      allocatedCapital: summary.allocatedCapital,
      dailyPnL: summary.dailyPnL,
      dailyPnLPercent: summary.dailyPnLPercent,
      currentDrawdownPercent: summary.currentDrawdownPercent,
      openPositionsCount: summary.openPositionsCount,
      openRiskUsd: summary.openRiskUsd,
      openRiskPercent: summary.openRiskPercent,
      winRate: summary.winRate,
      totalTradesCount: summary.totalTradesCount
    };
  }
});
