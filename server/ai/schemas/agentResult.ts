import { z } from 'zod';

export const SignalDirectionSchema = z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']);
export const MarketRegimeSchema = z.enum([
  'BULL_TREND',
  'BEAR_TREND',
  'RANGE',
  'BREAKOUT',
  'HIGH_VOLATILITY',
  'UNCERTAIN'
]);

export const SpecialistAgentOutputSchema = z.object({
  agentId: z.string(),
  symbol: z.string(),
  analysisSessionId: z.string().optional(),
  signal: SignalDirectionSchema,
  confidence: z.number().min(0).max(100),
  trend: z.string().optional().default(''),
  momentum: z.string().optional().default(''),
  volatility: z.string().optional().default(''),
  marketRegime: MarketRegimeSchema.optional(),
  supportLevels: z.array(z.number()).optional().default([]),
  resistanceLevels: z.array(z.number()).optional().default([]),
  evidence: z.array(z.string()).min(1),
  risks: z.array(z.string()).min(1),
  timeframes: z.array(z.string()).optional().default(['1h']),
  summaryAr: z.string().min(5),
  dataSources: z.array(z.string()).optional().default([]),
  dataTimestamp: z.string()
});

export type SpecialistAgentOutput = z.infer<typeof SpecialistAgentOutputSchema>;

export const QuantAgentOutputSchema = z.object({
  agentId: z.literal('quant'),
  symbol: z.string(),
  signal: SignalDirectionSchema,
  directionProbability: z.enum(['PRICE_UP', 'PRICE_DOWN', 'RANGE']),
  confidence: z.number().min(0).max(100),
  meanReversionZScore: z.number().optional(),
  volatilityPercentile: z.number().optional(),
  momentumPersistence: z.string().optional(),
  evidence: z.array(z.string()),
  risks: z.array(z.string()),
  summaryAr: z.string(),
  dataTimestamp: z.string()
});

export type QuantAgentOutput = z.infer<typeof QuantAgentOutputSchema>;

export const RiskAIAgentOutputSchema = z.object({
  agentId: z.literal('risk'),
  symbol: z.string(),
  riskGrade: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']),
  maxDrawdownThreat: z.string(),
  thesisWeaknesses: z.array(z.string()),
  liquidityAssessment: z.string(),
  volatilityCondition: z.string(),
  suggestedStopLossMultiplier: z.number().optional().default(1.5),
  summaryAr: z.string(),
  dataTimestamp: z.string()
});

export type RiskAIAgentOutput = z.infer<typeof RiskAIAgentOutputSchema>;
