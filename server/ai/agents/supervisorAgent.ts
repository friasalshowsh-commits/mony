import { getMarketPriceTool } from '../tools/marketPriceTool.js';
import { getPortfolioContextTool } from '../tools/portfolioTool.js';
import { evaluateRiskTool } from '../tools/riskTool.js';
import { SupervisorDecision, SupervisorDecisionSchema } from '../schemas/supervisorDecision.js';
import { SpecialistAgentOutput, QuantAgentOutput, RiskAIAgentOutput } from '../schemas/agentResult.js';
import { agentRunner } from '../services/agentRunner.js';
import { db } from '../../db.js';

export interface ConsensusSummary {
  bullishVotes: number;
  bearishVotes: number;
  neutralVotes: number;
  weightedBullishScore: number;
  weightedBearishScore: number;
  disagreementScore: number; // 0 (full harmony) to 100 (extreme conflict)
  hasHighConflict: boolean;
}

export class SupervisorAgent {
  public static readonly ID = 'supervisor';
  public static readonly NAME = 'Supervisor / CIO Agent';
  public static readonly NAME_AR = 'المدير الرئيسي (CIO)';
  public static readonly PROMPT_VERSION = 'supervisor-v1.0';

  /**
   * Deterministic Consensus Calculation across specialist agent reports
   */
  public calculateConsensus(
    reports: {
      technical?: SpecialistAgentOutput;
      structure?: SpecialistAgentOutput;
      quant?: QuantAgentOutput;
      risk?: RiskAIAgentOutput;
    }
  ): ConsensusSummary {
    const database = db.getDB();
    const weights = database.settings.agentWeights || {
      technical: 25,
      marketStructure: 20,
      quant: 15,
      news: 10,
      sentiment: 10,
      onChain: 10,
      macro: 10
    };

    let bullishVotes = 0;
    let bearishVotes = 0;
    let neutralVotes = 0;
    let weightedBullish = 0;
    let weightedBearish = 0;
    let totalWeight = 0;

    if (reports.technical) {
      const w = weights.technical || 25;
      totalWeight += w;
      if (reports.technical.signal === 'BULLISH') {
        bullishVotes++;
        weightedBullish += w * (reports.technical.confidence / 100);
      } else if (reports.technical.signal === 'BEARISH') {
        bearishVotes++;
        weightedBearish += w * (reports.technical.confidence / 100);
      } else {
        neutralVotes++;
      }
    }

    if (reports.structure) {
      const w = weights.marketStructure || 20;
      totalWeight += w;
      if (reports.structure.signal === 'BULLISH') {
        bullishVotes++;
        weightedBullish += w * (reports.structure.confidence / 100);
      } else if (reports.structure.signal === 'BEARISH') {
        bearishVotes++;
        weightedBearish += w * (reports.structure.confidence / 100);
      } else {
        neutralVotes++;
      }
    }

    if (reports.quant) {
      const w = weights.quant || 15;
      totalWeight += w;
      if (reports.quant.signal === 'BULLISH') {
        bullishVotes++;
        weightedBullish += w * (reports.quant.confidence / 100);
      } else if (reports.quant.signal === 'BEARISH') {
        bearishVotes++;
        weightedBearish += w * (reports.quant.confidence / 100);
      } else {
        neutralVotes++;
      }
    }

    const normBull = totalWeight > 0 ? (weightedBullish / totalWeight) * 100 : 0;
    const normBear = totalWeight > 0 ? (weightedBearish / totalWeight) * 100 : 0;

    // Disagreement score: high if both bull and bear have high competing weights
    let disagreementScore = 0;
    if (normBull > 20 && normBear > 20) {
      disagreementScore = Math.min(100, Math.round((Math.min(normBull, normBear) / Math.max(normBull, normBear)) * 100));
    }

    return {
      bullishVotes,
      bearishVotes,
      neutralVotes,
      weightedBullishScore: Math.round(normBull),
      weightedBearishScore: Math.round(normBear),
      disagreementScore,
      hasHighConflict: disagreementScore >= 60
    };
  }

  /**
   * Synthesizes all specialist agent outputs into an authoritative CIO decision
   */
  public async reviewAndDecide(params: {
    symbol: string;
    currentPrice: number;
    sessionId: string;
    marketRegime: any;
    technicalReport?: SpecialistAgentOutput;
    structureReport?: SpecialistAgentOutput;
    quantReport?: QuantAgentOutput;
    riskReport?: RiskAIAgentOutput;
  }): Promise<SupervisorDecision> {
    const {
      symbol,
      currentPrice,
      sessionId,
      marketRegime,
      technicalReport,
      structureReport,
      quantReport,
      riskReport
    } = params;

    const consensus = this.calculateConsensus({
      technical: technicalReport,
      structure: structureReport,
      quant: quantReport,
      risk: riskReport
    });

    const specialistSummary = JSON.stringify({
      currentPrice,
      consensus,
      technical: technicalReport ? {
        signal: technicalReport.signal,
        confidence: technicalReport.confidence,
        supportLevels: technicalReport.supportLevels,
        resistanceLevels: technicalReport.resistanceLevels,
        evidence: technicalReport.evidence,
        risks: technicalReport.risks
      } : 'UNAVAILABLE',
      structure: structureReport ? {
        signal: structureReport.signal,
        confidence: structureReport.confidence,
        marketRegime: structureReport.marketRegime,
        evidence: structureReport.evidence,
        risks: structureReport.risks
      } : 'UNAVAILABLE',
      quant: quantReport ? {
        signal: quantReport.signal,
        probability: quantReport.directionProbability,
        confidence: quantReport.confidence
      } : 'UNAVAILABLE',
      riskAI: riskReport ? {
        riskGrade: riskReport.riskGrade,
        threat: riskReport.maxDrawdownThreat,
        weaknesses: riskReport.thesisWeaknesses
      } : 'UNAVAILABLE'
    }, null, 2);

    const instructions = `أنت "المدير الرئيسي (Chief Investment Officer)" في منصة NEXUS TRADING AI.
مسؤوليتك:
1. مراجعة تقارير الوكلاء المتخصصين والبيانات الحتمية المرفقة للأصل ${symbol}.
2. تقييم التوافق والتعارض؛ إذا كان هناك تعارض حاد (hasHighConflict=true) أو انعدام لمستويات سعرية واضحة، قرر NO_TRADE أو HOLD.
3. تحديد القرار النهائي الصارم: LONG أو SHORT أو HOLD أو NO_TRADE.
4. حساب مستويات الدخول (suggestedEntry)، وقف الخسارة (stopLoss)، و3 أهداف لجني الأرباح (takeProfits) مع حساب نسبة العائد للمخاطرة R:R (يجب ألا تقل عن 1.5 للصفقات المؤكدة).
5. استدعاء evaluateRisk للتحقق الحتمي من مطابقة الصفقة لقواعد الحساب ومحرك المخاطر.
6. تلخيص الأسباب المؤيدة والمعارضة بوضوح، وكتابة ملخص عربي شامل (summaryAr).

الإخراج النهائي JSON حصراً:
{
  "symbol": "${symbol}",
  "decision": "LONG" | "SHORT" | "HOLD" | "NO_TRADE",
  "confidence": 78,
  "marketRegime": "BREAKOUT" | "BULL_TREND" | "BEAR_TREND" | "RANGE" | "HIGH_VOLATILITY" | "UNCERTAIN",
  "entryLow": رقم أو null,
  "entryHigh": رقم أو null,
  "suggestedEntry": رقم أو null,
  "stopLoss": رقم أو null,
  "takeProfits": [
    {"level": 1, "price": رقم, "percentage": 40},
    {"level": 2, "price": رقم, "percentage": 35},
    {"level": 3, "price": رقم, "percentage": 25}
  ],
  "riskRewardEstimate": رقم أو null,
  "timeHorizon": "1-4 Hours",
  "supportingReasons": ["سبب 1", "سبب 2"],
  "opposingReasons": ["سبب معارض أو مخاطرة"],
  "agentVotes": [
    {"agentId": "technical", "agentName": "Technical Analysis Agent", "signal": "BULLISH", "weight": 25, "confidence": 80}
  ],
  "conflicts": [],
  "disagreementScore": ${consensus.disagreementScore},
  "summaryAr": "ملخص قرار المدير الرئيسي باللغة العربية",
  "dataTimestamp": "${new Date().toISOString()}"
}`;

    const prompt = `هذه تقارير الوكلاء المتخصصين للأصل ${symbol} عند السعر الحقيقي $${currentPrice}:\n${specialistSummary}\n\nاتخذ القرار الاستثماري النهائي الملزم بصيغة JSON.`;

    const result = await agentRunner.executeAgent<SupervisorDecision>({
      agentId: SupervisorAgent.ID,
      agentName: SupervisorAgent.NAME,
      agentNameAr: SupervisorAgent.NAME_AR,
      symbol,
      analysisSessionId: sessionId,
      instructions,
      prompt,
      tools: {
        getMarketPrice: getMarketPriceTool,
        getPortfolioContext: getPortfolioContextTool,
        evaluateRisk: evaluateRiskTool
      },
      profile: 'STRONG_REASONING',
      promptVersion: SupervisorAgent.PROMPT_VERSION,
      outputParser: (text: string) => {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in supervisor response');
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return SupervisorDecisionSchema.parse(parsed);
      }
    });

    if (!result.success || !result.output) {
      throw new Error(result.error || 'Failed to execute Supervisor Agent decision');
    }

    return result.output;
  }
}

export const supervisorAgent = new SupervisorAgent();
