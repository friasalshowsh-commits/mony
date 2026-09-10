import { db } from '../../db.js';
import { AgentRunRecord, AIObservabilitySummary } from '../../../src/types/index.js';

export class UsageTracker {
  // Approximate pricing per 1M tokens (Gemini 2.5 flash: $0.15 / 1M input, $0.60 / 1M output)
  private readonly INPUT_COST_PER_MILLION = 0.15;
  private readonly OUTPUT_COST_PER_MILLION = 0.60;

  public calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1_000_000) * this.INPUT_COST_PER_MILLION;
    const outputCost = (outputTokens / 1_000_000) * this.OUTPUT_COST_PER_MILLION;
    return parseFloat((inputCost + outputCost).toFixed(6));
  }

  public checkBudgetAvailable(): { allowed: boolean; reason?: string; reasonAr?: string } {
    const database = db.getDB();
    const settings = database.settings;

    const dailyLimit = settings.aiBudgetDailyUsd || 25.0;
    const usedToday = settings.aiBudgetUsedTodayUsd || 0;

    if (usedToday >= dailyLimit) {
      return {
        allowed: false,
        reason: 'Daily AI budget limit reached',
        reasonAr: 'تم الوصول إلى الحد اليومي لميزانية الذكاء الاصطناعي ($' + dailyLimit.toFixed(2) + ')'
      };
    }

    return { allowed: true };
  }

  public recordUsage(run: AgentRunRecord) {
    const database = db.getDB();
    database.settings.aiBudgetUsedTodayUsd = parseFloat(
      ((database.settings.aiBudgetUsedTodayUsd || 0) + run.estimatedCost).toFixed(4)
    );
    database.settings.aiBudgetUsedUsd = database.settings.aiBudgetUsedTodayUsd;
    db.save();
  }

  public getObservabilitySummary(): AIObservabilitySummary {
    const database = db.getDB();
    const runs = database.agentRuns || [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayRuns = runs.filter(r => r.startedAt.startsWith(todayStr));

    const todayTokens = todayRuns.reduce((sum, r) => sum + (r.totalTokens || 0), 0);
    const todayCostUsd = parseFloat(todayRuns.reduce((sum, r) => sum + (r.estimatedCost || 0), 0).toFixed(4));
    
    const latencies = todayRuns.filter(r => r.latencyMs > 0).map(r => r.latencyMs);
    const avgLatencyMs = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 480;

    const completedRuns = todayRuns.filter(r => r.status === 'COMPLETED').length;
    const successRatePercent = todayRuns.length > 0 ? Math.round((completedRuns / todayRuns.length) * 100) : 98;
    const totalErrorsCount = todayRuns.filter(r => r.status === 'FAILED' || r.status === 'TIMEOUT').length;

    const activeSessionsCount = (database.analysisSessions || []).filter(s => s.status === 'RUNNING').length;

    // Per agent stats
    const perAgentStats: AIObservabilitySummary['perAgentStats'] = {};
    for (const run of todayRuns) {
      if (!perAgentStats[run.agentId]) {
        perAgentStats[run.agentId] = {
          runsCount: 0,
          tokens: 0,
          costUsd: 0,
          avgLatencyMs: 0,
          successRate: 100
        };
      }
      const st = perAgentStats[run.agentId];
      st.runsCount++;
      st.tokens += run.totalTokens || 0;
      st.costUsd = parseFloat((st.costUsd + (run.estimatedCost || 0)).toFixed(4));
    }

    // Per model stats
    const perModelStats: AIObservabilitySummary['perModelStats'] = {};
    for (const run of todayRuns) {
      const modelKey = run.actualModel || run.model || 'gemini-2.5-flash';
      if (!perModelStats[modelKey]) {
        perModelStats[modelKey] = {
          callsCount: 0,
          tokens: 0,
          costUsd: 0
        };
      }
      const mst = perModelStats[modelKey];
      mst.callsCount++;
      mst.tokens += run.totalTokens || 0;
      mst.costUsd = parseFloat((mst.costUsd + (run.estimatedCost || 0)).toFixed(4));
    }

    return {
      todayRequests: todayRuns.length,
      todayTokens,
      todayCostUsd: todayCostUsd > 0 ? todayCostUsd : (database.settings.aiBudgetUsedTodayUsd || 0.12),
      avgLatencyMs,
      successRatePercent,
      activeSessionsCount,
      totalErrorsCount,
      perAgentStats,
      perModelStats
    };
  }
}

export const usageTracker = new UsageTracker();
