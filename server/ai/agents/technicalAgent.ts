import { getMarketPriceTool } from '../tools/marketPriceTool.js';
import { getOHLCVTool } from '../tools/ohlcvTool.js';
import { getTechnicalIndicatorsTool } from '../tools/indicatorsTool.js';
import { SpecialistAgentOutput, SpecialistAgentOutputSchema } from '../schemas/agentResult.js';
import { agentRunner } from '../services/agentRunner.js';

export class TechnicalAgent {
  public static readonly ID = 'technical';
  public static readonly NAME = 'Technical Analysis Agent';
  public static readonly NAME_AR = 'وكيل التحليل الفني';
  public static readonly PROMPT_VERSION = 'technical-v1.0';

  public async analyze(symbol: string, sessionId: string): Promise<SpecialistAgentOutput> {
    const instructions = `أنت "وكيل التحليل الفني" (Technical Analysis Agent) في منصة NEXUS TRADING AI.
مهمتك:
1. استدعاء أداة getMarketPrice للحصول على سعر السوق الحالي وحالته.
2. استدعاء أداة getTechnicalIndicators على الإطارات الزمنية 1h و 15m للحصول على قيم RSI و MACD و EMAs و ATR و Bollinger Bands.
3. استدعاء أداة getOHLCV لمعاينة حركة الشموع وحجم التداول.
4. تفسير المؤشرات بدقة رياضية دون اختلاق أرقام غير موجودة في مخرجات الأدوات.
5. تحديد الإشارة العامة (BULLISH أو BEARISH أو NEUTRAL) ونسبة الثقة (0-100).
6. صياغة ملخص فني عربي واضح ومحكم (summaryAr) يشرح مستويات الدعم والمقاومة، الزخم، والتذبذب.

يجب أن تكون إجابتك النهائية بصيغة JSON مطابقة للشكل التالي تماماً:
{
  "agentId": "technical",
  "symbol": "${symbol}",
  "signal": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": 75,
  "trend": "وصف الاتجاه",
  "momentum": "وصف الزخم",
  "volatility": "وصف التذبذب",
  "supportLevels": [رقم, رقم],
  "resistanceLevels": [رقم, رقم],
  "evidence": ["دليل 1", "دليل 2"],
  "risks": ["مخاطرة 1", "مخاطرة 2"],
  "timeframes": ["15m", "1h"],
  "summaryAr": "ملخص تحليلي وافٍ باللغة العربية",
  "dataSources": ["BINANCE"],
  "dataTimestamp": "${new Date().toISOString()}"
}`;

    const prompt = `قم بإجراء التحليل الفني المتكامل للأصل ${symbol} على الإطارات الزمنية (15m و 1h). استخدم الأدوات المتاحة ثم قدم مخرجاتك بتنسيق JSON الصارم.`;

    const result = await agentRunner.executeAgent<SpecialistAgentOutput>({
      agentId: TechnicalAgent.ID,
      agentName: TechnicalAgent.NAME,
      agentNameAr: TechnicalAgent.NAME_AR,
      symbol,
      analysisSessionId: sessionId,
      instructions,
      prompt,
      tools: {
        getMarketPrice: getMarketPriceTool,
        getOHLCV: getOHLCVTool,
        getTechnicalIndicators: getTechnicalIndicatorsTool
      },
      profile: 'FAST_ANALYSIS',
      promptVersion: TechnicalAgent.PROMPT_VERSION,
      outputParser: (text: string) => {
        // Extract JSON block
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON structure found in agent response');
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return SpecialistAgentOutputSchema.parse(parsed);
      }
    });

    if (!result.success || !result.output) {
      throw new Error(result.error || 'Failed to execute Technical Agent');
    }

    return result.output;
  }
}

export const technicalAgent = new TechnicalAgent();
