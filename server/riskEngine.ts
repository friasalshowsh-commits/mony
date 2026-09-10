import { CandidateTrade, PaperPosition, RiskDecision, TradeRecord, UserSettings } from '../src/types/index.js';

export interface PositionSizeResult {
  allowedQuantity: number;
  notionalUsd: number;
  riskAmountUsd: number;
  riskPercent: number;
}

export class DeterministicRiskEngine {
  /**
   * Deterministic Position Sizing Calculation
   */
  public calculatePositionSize(
    equity: number,
    riskPercent: number,
    entryPrice: number,
    stopLossPrice: number,
    maxAssetExposurePercent: number
  ): PositionSizeResult {
    const riskAmountUsd = (equity * (riskPercent / 100));
    const distancePerUnit = Math.abs(entryPrice - stopLossPrice);

    if (distancePerUnit <= 0) {
      return { allowedQuantity: 0, notionalUsd: 0, riskAmountUsd: 0, riskPercent: 0 };
    }

    let quantity = riskAmountUsd / distancePerUnit;
    let notional = quantity * entryPrice;

    // Hard ceiling: Max asset exposure limit
    const maxAllowedNotional = equity * (maxAssetExposurePercent / 100);
    if (notional > maxAllowedNotional) {
      notional = maxAllowedNotional;
      quantity = notional / entryPrice;
    }

    return {
      allowedQuantity: parseFloat(quantity.toFixed(4)),
      notionalUsd: parseFloat(notional.toFixed(2)),
      riskAmountUsd: parseFloat(Math.min(riskAmountUsd, Math.abs(entryPrice - stopLossPrice) * quantity).toFixed(2)),
      riskPercent: parseFloat(((riskAmountUsd / equity) * 100).toFixed(2))
    };
  }

  /**
   * Evaluates candidate trade against strict hard risk constraints.
   * AI cannot bypass or override this deterministic evaluator.
   */
  public evaluateCandidate(
    candidate: CandidateTrade,
    settings: UserSettings,
    currentPositions: PaperPosition[],
    recentTrades: TradeRecord[],
    currentEquity: number
  ): RiskDecision {
    const rules = settings.riskSettings;
    const reasons: string[] = [];
    const failedRules: string[] = [];
    const ruleChecks: RiskDecision['ruleChecks'] = [];

    // 1. Minimum Risk / Reward Rule
    const rrCheck = candidate.riskRewardRatio >= rules.minimumRiskReward;
    ruleChecks.push({
      rule: 'Minimum Risk/Reward Ratio',
      passed: rrCheck,
      value: candidate.riskRewardRatio.toFixed(2),
      threshold: `>= ${rules.minimumRiskReward.toFixed(2)}`
    });
    if (!rrCheck) {
      failedRules.push(`Risk/Reward ratio ${candidate.riskRewardRatio.toFixed(2)} is below minimum allowed ${rules.minimumRiskReward.toFixed(2)}`);
    }

    // 2. Max Open Positions Limit
    const openPosCount = currentPositions.length;
    const posCheck = openPosCount < rules.maxOpenPositions;
    ruleChecks.push({
      rule: 'Maximum Open Positions',
      passed: posCheck,
      value: `${openPosCount}`,
      threshold: `< ${rules.maxOpenPositions}`
    });
    if (!posCheck) {
      failedRules.push(`Maximum open positions limit reached (${openPosCount} / ${rules.maxOpenPositions})`);
    }

    // 3. Existing position in same asset
    const existingSameAsset = currentPositions.some(p => p.asset === candidate.asset);
    ruleChecks.push({
      rule: 'Duplicate Asset Position Protection',
      passed: !existingSameAsset,
      value: existingSameAsset ? 'ACTIVE POSITION' : 'NONE',
      threshold: 'NO DUPLICATES'
    });
    if (existingSameAsset) {
      failedRules.push(`An active position already exists for ${candidate.asset}`);
    }

    // 4. Daily Loss Limit
    const today = new Date().toISOString().split('T')[0];
    const todayLosses = recentTrades
      .filter(t => t.exitDate.startsWith(today) && t.netPnL < 0)
      .reduce((sum, t) => sum + Math.abs(t.netPnL), 0);
    const maxDailyLossAllowedUsd = currentEquity * (rules.maxDailyLossPercent / 100);
    const dailyLossCheck = todayLosses < maxDailyLossAllowedUsd;
    ruleChecks.push({
      rule: 'Max Daily Loss Limit',
      passed: dailyLossCheck,
      value: `$${todayLosses.toFixed(2)}`,
      threshold: `< $${maxDailyLossAllowedUsd.toFixed(2)} (${rules.maxDailyLossPercent}%)`
    });
    if (!dailyLossCheck) {
      failedRules.push(`Daily loss limit reached ($${todayLosses.toFixed(2)} >= $${maxDailyLossAllowedUsd.toFixed(2)})`);
    }

    // 5. Max Consecutive Losses Protection
    let consecutiveLosses = 0;
    for (const trade of recentTrades) {
      if (trade.netPnL < 0) consecutiveLosses++;
      else break;
    }
    const consecCheck = consecutiveLosses < rules.maxConsecutiveLosses;
    ruleChecks.push({
      rule: 'Max Consecutive Losses Lock',
      passed: consecCheck,
      value: `${consecutiveLosses}`,
      threshold: `< ${rules.maxConsecutiveLosses}`
    });
    if (!consecCheck) {
      failedRules.push(`Consecutive loss cooldown triggered (${consecutiveLosses} consecutive losses)`);
    }

    // 6. Global System Pause Check
    ruleChecks.push({
      rule: 'System Execution State',
      passed: !settings.systemPaused,
      value: settings.systemPaused ? 'PAUSED' : 'ACTIVE',
      threshold: 'ACTIVE'
    });
    if (settings.systemPaused) {
      failedRules.push('Trading system execution is globally PAUSED by operator');
    }

    // Calculate deterministic sizing
    const sizing = this.calculatePositionSize(
      currentEquity,
      rules.riskPerTradePercent,
      candidate.suggestedEntry,
      candidate.stopLoss,
      rules.maxAssetExposurePercent
    );

    const approved = failedRules.length === 0 && candidate.direction !== 'NO_TRADE' && candidate.direction !== 'HOLD';

    if (approved) {
      reasons.push(
        `All ${ruleChecks.length} deterministic risk checks passed.`,
        `Calculated position size: ${sizing.allowedQuantity} units ($${sizing.notionalUsd.toLocaleString()}).`,
        `Risk bounded to $${sizing.riskAmountUsd.toLocaleString()} (${sizing.riskPercent}% of equity).`
      );
    } else {
      reasons.push(...failedRules);
    }

    return {
      asset: candidate.asset,
      approved,
      status: approved ? 'APPROVED' : 'REJECTED',
      reasons,
      failedRules,
      suggestedPositionSizeUsd: sizing.notionalUsd,
      suggestedQuantity: sizing.allowedQuantity,
      calculatedRiskUsd: sizing.riskAmountUsd,
      riskPercentage: sizing.riskPercent,
      riskRewardRatio: candidate.riskRewardRatio,
      accountEquity: currentEquity,
      timestamp: new Date().toISOString(),
      ruleChecks
    };
  }
}

export const deterministicRiskEngine = new DeterministicRiskEngine();
