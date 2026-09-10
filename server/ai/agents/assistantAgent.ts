import { tool, generateText } from 'ai';
import { z } from 'zod';
import { db } from '../../db.js';
import { paperEngine } from '../../paperEngine.js';
import { modelRouter } from '../modelRouter.js';
import { getMarketPriceTool } from '../tools/marketPriceTool.js';
import { getPortfolioContextTool } from '../tools/portfolioTool.js';
import { getOpenPositionsTool } from '../tools/positionTool.js';
import { analysisOrchestrator } from '../services/analysisOrchestrator.js';

export const getRecentTradesTool = tool({
  description: 'Retrieves completed historical paper trades, net PnL, exit reasons, and post-trade reviews.',
  parameters: z.object({
    limit: z.number().default(5)
  }),
  execute: async ({ limit }) => {
    const database = db.getDB();
    const trades = (database.tradeLedger || []).slice(0, limit);
    return {
      count: trades.length,
      trades: trades.map(t => ({
        id: t.id,
        asset: t.asset,
        direction: t.direction,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        netPnL: t.netPnL,
        netPnLPercent: t.netPnLPercent,
        exitReason: t.exitReason,
        exitDate: t.exitDate
      }))
    };
  }
});

export const getLatestAnalysisSessionsTool = tool({
  description: 'Retrieves recent AI analysis sessions, decisions (LONG/SHORT/HOLD/NO_TRADE), and risk verdicts.',
  parameters: z.object({
    limit: z.number().default(3)
  }),
  execute: async ({ limit }) => {
    const database = db.getDB();
    const sessions = (database.analysisSessions || []).slice(0, limit);
    return {
      count: sessions.length,
      sessions: sessions.map(s => ({
        id: s.id,
        asset: s.asset,
        status: s.status,
        startTime: s.startTime,
        decision: s.candidateTrade?.direction || 'NO_TRADE',
        confidence: s.candidateTrade?.confidence,
        riskStatus: s.riskDecision?.status,
        failedRules: s.riskDecision?.failedRules
      }))
    };
  }
});

export const triggerAssetAnalysisTool = tool({
  description: 'Triggers a full multi-agent analysis session on an asset (e.g. BTC/USDT). Does NOT open a trade automatically.',
  parameters: z.object({
    symbol: z.string().describe('Trading pair e.g. BTC/USDT')
  }),
  execute: async ({ symbol }) => {
    try {
      const session = await analysisOrchestrator.runSession(symbol, 'ASSISTANT_REQUEST');
      return {
        success: true,
        sessionId: session.id,
        symbol,
        decision: session.candidateTrade?.direction || 'NO_TRADE',
        confidence: session.candidateTrade?.confidence,
        riskStatus: session.riskDecision?.status,
        summaryAr: session.candidateTrade?.supervisorSummary || 'تم اكتمال التحليل بنجاح'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message
      };
    }
  }
});

export class NexusAssistantAgent {
  public async chat(userMessage: string, history: { role: 'user' | 'assistant'; content: string }[] = []): Promise<string> {
    const route = modelRouter.getModelForAgent('nexus-assistant', 'STRONG_REASONING');

    const system = `أنت "مساعد NEXUS الذكي" (NEXUS AI Assistant) - المساعد التداولي المتخصص لمنصة NEXUS TRADING AI.
إرشاداتك الصارمة:
1. أجب باللغة العربية الفصحى دائماً بأسلوب مهني واحترافي رفيع.
2. استخدم الأدوات المتاحة لجلب الحقائق المالية الحقيقية (الأسعار، أرباح اليوم، الصفقات المفتوحة، جلسات التحليل). لا تخترع أرقاماً أبداً!
3. إذا طلب المستخدم تحليل عملة (مثل "حلل البيتكوين" أو "حلل ETH")، يمكنك استخدام أداة triggerAssetAnalysis لبدء جلسة تحليل للوكلاء.
4. إذا سأل المستخدم لماذا رُفضت صفقة معينة، استخدم أداة getLatestAnalysisSessions لمعرفة سبب رفض محرك المخاطر.
5. ذكّر دائماً أن التداول الفعلي مقفل وأن المنصة تعمل بنظام التداول التجريبي الآمن (Paper Trading).`;

    const tools = {
      getMarketPrice: getMarketPriceTool,
      getPortfolioContext: getPortfolioContextTool,
      getOpenPositions: getOpenPositionsTool,
      getRecentTrades: getRecentTradesTool,
      getLatestSessions: getLatestAnalysisSessionsTool,
      triggerAnalysis: triggerAssetAnalysisTool
    };

    const messages = [
      ...history.map(h => ({ role: h.role as any, content: h.content })),
      { role: 'user' as const, content: userMessage }
    ];

    const response = await generateText({
      model: route.model,
      system,
      messages,
      tools,
      maxSteps: 5
    });

    return response.text || 'عذراً، لم أتمكن من صياغة إجابة في الوقت الحالي.';
  }
}

export const nexusAssistantAgent = new NexusAssistantAgent();
