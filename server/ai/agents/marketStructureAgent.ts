import { getMarketPriceTool } from '../tools/marketPriceTool.js';
import { getOHLCVTool } from '../tools/ohlcvTool.js';
import { getMarketStructureTool } from '../tools/marketStructureTool.js';
import { SpecialistAgentOutput, SpecialistAgentOutputSchema } from '../schemas/agentResult.js';
import { agentRunner } from '../services/agentRunner.js';

export class MarketStructureAgent {
  public static readonly ID = 'market-structure';
  public static readonly NAME = 'Market Structure Agent';
  public static readonly NAME_AR = 'وكيل هيكل السوق';
  public static readonly PROMPT_VERSION = 'structure-v1.0';

  public async analyze(symbol: string, sessionId: string): Promise<SpecialistAgentOutput> {
    const instructions = `أنت "وكيل هيكل السوق" (Market Structure Agent) في منصة NEXUS TRADING AI.
دورك:
1. استدعاء getMarketPrice لمعرفة السعر الفعلي.
2. استدعاء getMarketStructure لمعاينة القمم والقيعان المتصاعدة/الهابطة (HH, HL, LH, LL) وكسر الهيكل (BOS) وتغير الطابع (CHoCH) وكتل الأوامر (Order Blocks).
3. استدعاء getOHLCV لمعاينة سلوك الشموع عند مناطق السيولة.
4. تصنيف النظام الهيكلي: BULL_TREND, BEAR_TREND, RANGE, BREAKOUT, HIGH_VOLATILITY, UNCERTAIN.
5. تحديد الإشارة (BULLISH, BEARISH, NEUTRAL) مع الأدلة والمخاطر وملخص عربي فصيح.

الإخراج النهائي يجب أن يكون بصيغة JSON مطابقة للشكل التالي:
{
  "agentId": "market-structure",
  "symbol": "${symbol}",
  "signal": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": 80,
  "marketRegime": "BREAKOUT" | "BULL_TREND" | "BEAR_TREND" | "RANGE" | "HIGH_VOLATILITY" | "UNCERTAIN",
  "trend": "وصف اتجاه الهيكل",
  "supportLevels": [رقم, رقم],
  "resistanceLevels": [رقم, رقم],
  "evidence": ["دليل 1", "دليل 2"],
  "risks": ["مخاطرة هيكلية"],
  "timeframes": ["1h"],
  "summaryAr": "ملخص هيكل السوق باللغة العربية",
  "dataSources": ["BINANCE"],
  "dataTimestamp": "${new Date().toISOString()}"
}`;

    const prompt = `حلل هيكل السعر والقمم والقيعان ومناطق العرض والطلب للأصل ${symbol}. استخدم الأدوات المتاحة ثم أخرج النتائج بتنسيق JSON.`;

    const result = await agentRunner.executeAgent<SpecialistAgentOutput>({
      agentId: MarketStructureAgent.ID,
      agentName: MarketStructureAgent.NAME,
      agentNameAr: MarketStructureAgent.NAME_AR,
      symbol,
      analysisSessionId: sessionId,
      instructions,
      prompt,
      tools: {
        getMarketPrice: getMarketPriceTool,
        getMarketStructure: getMarketStructureTool,
        getOHLCV: getOHLCVTool
      },
      profile: 'FAST_ANALYSIS',
      promptVersion: MarketStructureAgent.PROMPT_VERSION,
      outputParser: (text: string) => {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON structure found in structure agent response');
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return SpecialistAgentOutputSchema.parse(parsed);
      }
    });

    if (!result.success || !result.output) {
      throw new Error(result.error || 'Failed to execute Market Structure Agent');
    }

    return result.output;
  }
}

export const marketStructureAgent = new MarketStructureAgent();
