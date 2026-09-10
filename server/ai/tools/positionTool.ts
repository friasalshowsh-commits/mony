import { tool } from 'ai';
import { z } from 'zod';
import { paperEngine } from '../../paperEngine.js';

export const getOpenPositionsTool = tool({
  description: 'Read-only tool retrieving active open paper trading positions and their real-time unrealized PnL.',
  inputSchema: z.object({
    symbol: z.string().optional().describe('Optional symbol filter e.g. BTC/USDT')
  }),
  execute: async ({ symbol }) => {
    const positions = paperEngine.getOpenPositions();
    const filtered = symbol ? positions.filter(p => p.asset.toUpperCase() === symbol.toUpperCase()) : positions;

    return {
      count: filtered.length,
      positions: filtered.map(p => ({
        id: p.id,
        asset: p.asset,
        direction: p.direction,
        entryPrice: p.entryPrice,
        currentPrice: p.currentPrice,
        quantity: p.quantity,
        notionalValue: p.notionalValue,
        stopLoss: p.stopLoss,
        takeProfit: p.takeProfit,
        unrealizedPnL: p.unrealizedPnL,
        unrealizedPnLPercent: p.unrealizedPnLPercent,
        riskAmount: p.riskAmount,
        openedAt: p.openedAt
      }))
    };
  }
});
