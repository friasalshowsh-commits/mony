import { z } from 'zod';
import { MarketRegimeSchema } from './agentResult.js';

export const MarketContextSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change24h: z.number(),
  high24h: z.number(),
  low24h: z.number(),
  volume24h: z.number(),
  trend: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']),
  marketRegime: MarketRegimeSchema,
  source: z.string(),
  status: z.enum(['LIVE', 'DELAYED', 'STALE', 'DEMO', 'DISCONNECTED']),
  freshnessMs: z.number(),
  isDemo: z.boolean(),
  indicators: z.record(z.any()).optional(),
  timestamp: z.string()
});

export type MarketContext = z.infer<typeof MarketContextSchema>;
