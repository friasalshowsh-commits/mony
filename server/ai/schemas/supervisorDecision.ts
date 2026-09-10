import { z } from 'zod';
import { MarketRegimeSchema, SignalDirectionSchema } from './agentResult.js';

export const TradeDecisionSchema = z.enum(['LONG', 'SHORT', 'HOLD', 'NO_TRADE']);

export const AgentVoteSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  signal: SignalDirectionSchema,
  weight: z.number(),
  confidence: z.number()
});

export const TakeProfitLevelSchema = z.object({
  level: z.number(),
  price: z.number(),
  percentage: z.number()
});

export const SupervisorDecisionSchema = z.object({
  symbol: z.string(),
  decision: TradeDecisionSchema,
  confidence: z.number().min(0).max(100),
  marketRegime: MarketRegimeSchema,
  entryLow: z.number().nullable(),
  entryHigh: z.number().nullable(),
  suggestedEntry: z.number().nullable(),
  stopLoss: z.number().nullable(),
  takeProfits: z.array(TakeProfitLevelSchema).default([]),
  riskRewardEstimate: z.number().nullable(),
  timeHorizon: z.string().default('1-4 Hours'),
  supportingReasons: z.array(z.string()).default([]),
  opposingReasons: z.array(z.string()).default([]),
  agentVotes: z.array(AgentVoteSchema).default([]),
  conflicts: z.array(z.string()).default([]),
  disagreementScore: z.number().default(0), // 0 to 100
  summaryAr: z.string().min(5),
  dataTimestamp: z.string()
});

export type SupervisorDecision = z.infer<typeof SupervisorDecisionSchema>;
