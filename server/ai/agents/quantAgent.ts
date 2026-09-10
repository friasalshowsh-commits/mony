import { getMarketPriceTool } from '../tools/marketPriceTool.js';
import { getOHLCVTool } from '../tools/ohlcvTool.js';
import { getTechnicalIndicatorsTool } from '../tools/indicatorsTool.js';
import { runStrategyBacktestTool } from '../tools/backtestTool.js';
import { QuantAgentOutput, QuantAgentOutputSchema } from '../schemas/agentResult.js';
import { agentRunner } from '../services/agentRunner.js';

export class QuantAgent {
  public static readonly ID = 'quant';
  public static readonly NAME = 'Quantitative Agent';
  public static readonly NAME_AR = 'الوكيل الكمي';
  public static readonly PROMPT_VERSION = 'quant-v1.0';

  public async analyze(symbol: string, sessionId: string): Promise<QuantAgentOutput> {
    const instructions = `أنت "الوكيل الكمي" (Quantitative Agent) في منصة NEXUS TRADING AI.
مهمتك تفسير الإحصائيات والاحتمالات الرياضية دون افتراض اليقين أو اختلاق أرقام:
1. استدعاء getMarketPrice لمعرفة السعر الحالي.
2. استدعاء getTechnicalIndicators لتقييم مستويات التذبذب والانحراف المعياري (Bollinger, ATR).
3. استدعاء runStrategyBacktest لمعاينة مقاييس الأداء التاريخية (Sharpe Ratio, Profit Factor, Win Rate).
4. تفسير النتائج بنموذج احتمالي (PRICE_UP, PRICE_DOWN, RANGE) وتحديد مستوى الثقة.
5. تقديم ملخص عربي إحصائي دقيق.

يجب أن يكون الإخراج بتنسيق JSON حصراً:
{
  "agentId": "quant",
  "symbol": "${symbol}",
  "signal": "BULLISH" | "BEARISH" | "NEUTRAL",
  "directionProbability": "PRICE_UP" | "PRICE_DOWN" | "RANGE",
  "confidence": 75,
  "meanReversionZScore": 1.2,
  "volatilityPercentile": 65,
  "momentumPersistence": "متوسط إلى قوي",
  "evidence": ["دليل إحصائي 1", "دليل إحصائي 2"],
  "risks": ["مخاطرة إحصائية"],
  "summaryAr": "ملخص تحليلي كمي باللغة العربية",
  "dataTimestamp": "${new Date().toISOString()}"
}`;

    const prompt = `قم بإجراء التحليل الكمي والاحتمالي للأصل ${symbol}. استخدم الأدوات الإحصائية ثم أخرج النتائج بتنسيق JSON.`;

    const result = await agentRunner.executeAgent<QuantAgentOutput>({
      agentId: QuantAgent.ID,
      agentName: QuantAgent.NAME,
      agentNameAr: QuantAgent.NAME_AR,
      symbol,
      analysisSessionId: sessionId,
      instructions,
      prompt,
      tools: {
        getMarketPrice: getMarketPriceTool,
        getOHLCV: getOHLCVTool,
        getTechnicalIndicators: getTechnicalIndicatorsTool,
        runStrategyBacktest: runStrategyBacktestTool
      },
      profile: 'STRONG_REASONING',
      promptVersion: QuantAgent.PROMPT_VERSION,
      outputParser: (text: string) => {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in quant agent response');
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return QuantAgentOutputSchema.parse(parsed);
      }
    });

    if (!result.success || !result.output) {
      throw new Error(result.error || 'Failed to execute Quant Agent');
    }

    return result.output;
  }
}

export const quantAgent = new QuantAgent();
