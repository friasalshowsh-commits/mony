import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../../db.js';
import { paperEngine } from '../../paperEngine.js';
import { deterministicRiskEngine } from '../../riskEngine.js';
import { CandidateTrade } from '../../../src/types/index.js';

export const evaluateRiskTool = tool({
  description: 'Authoritative deterministic risk evaluation tool. Checks candidate trade against hard constraints (R:R, max loss, exposure, drawdown). Result CANNOT be altered or overridden by AI.',
  inputSchema: z.object({
    symbol: z.string(),
    direction: z.enum(['LONG', 'SHORT', 'HOLD', 'NO_TRADE']),
    entryPrice: z.number().positive(),
    stopLoss: z.number().positive(),
    takeProfits: z.array(z.object({
      level: z.number(),
      price: z.number(),
      percentage: z.number()
    })),
    riskRewardRatio: z.number()
  }),
  execute: async ({ symbol, direction, entryPrice, stopLoss, takeProfits, riskRewardRatio }) => {
    if (direction === 'HOLD' || direction === 'NO_TRADE') {
      return {
        approved: false,
        status: 'REJECTED',
        reasonCodes: ['DIRECTION_NOT_ACTIONABLE'],
        messageAr: 'الصفقة ليست عملية دخول (HOLD / NO_TRADE)'
      };
    }

    const database = db.getDB();
    const portfolio = paperEngine.getPortfolioSummary();
    const openPositions = paperEngine.getOpenPositions();

    const candidateMock: CandidateTrade = {
      asset: symbol,
      direction: direction as any,
      confidence: 80,
      marketRegime: 'BREAKOUT',
      currentPrice: entryPrice,
      entryLow: entryPrice * 0.998,
      entryHigh: entryPrice * 1.002,
      suggestedEntry: entryPrice,
      stopLoss: stopLoss,
      takeProfits: takeProfits,
      riskRewardRatio: riskRewardRatio,
      timeHorizon: '1-4h',
      supportingReasons: ['Evaluated via Risk Tool'],
      opposingReasons: [],
      agentVotes: [],
      supervisorSummary: '',
      dataTimestamp: new Date().toISOString()
    };

    const decision = deterministicRiskEngine.evaluateCandidate(
      candidateMock,
      database.settings,
      openPositions,
      database.tradeLedger,
      portfolio.equity
    );

    return {
      approved: decision.approved,
      status: decision.status,
      riskAmountUsd: decision.calculatedRiskUsd,
      riskPercentage: decision.riskPercentage,
      riskRewardRatio: decision.riskRewardRatio,
      suggestedQuantity: decision.suggestedQuantity,
      suggestedPositionSizeUsd: decision.suggestedPositionSizeUsd,
      failedRules: decision.failedRules,
      reasons: decision.reasons,
      ruleChecks: decision.ruleChecks.map(r => ({
        rule: r.rule,
        passed: r.passed,
        value: r.value,
        threshold: r.threshold
      })),
      timestamp: decision.timestamp
    };
  }
});
