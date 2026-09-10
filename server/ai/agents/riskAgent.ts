import { getMarketPriceTool } from '../tools/marketPriceTool.js';
import { getPortfolioContextTool } from '../tools/portfolioTool.js';
import { getOpenPositionsTool } from '../tools/positionTool.js';
import { RiskAIAgentOutput, RiskAIAgentOutputSchema } from '../schemas/agentResult.js';
import { agentRunner } from '../services/agentRunner.js';

export class RiskAIAgent {
  public static readonly ID = 'risk';
  public static readonly NAME = 'Risk Assessment Agent';
  public static readonly NAME_AR = 'وكيل تحليل المخاطر';
  public static readonly PROMPT_VERSION = 'risk-v1.0';

  public async evaluateContextualRisk(symbol: string, sessionId: string): Promise<RiskAIAgentOutput> {
    const instructions = `أنت "وكيل تحليل المخاطر" (Risk Assessment Agent) في منصة NEXUS TRADING AI.
مهمتك دراسة المخاطر السياقية للأصل:
1. استدعاء getPortfolioContext لمعرفة رأس المال المتاح، ونسبة التراجع الإجمالي (Drawdown)، ومستوى المخاطر المفتوحة.
2. استدعاء getOpenPositions لمعاينة تركز المحفظة وما إذا كان هناك صفقات قائمة على نفس الأصل أو أصول مرتبطة.
3. استدعاء getMarketPrice لفحص حداثة السعر وتذبذب السوق.
4. تقييم نقاط الضعف المحتملة في أطروحة التداول، مخاطر السيولة، وظروف التذبذب الحاد.
5. تصنيف مستوى الخطر: LOW, MEDIUM, HIGH, EXTREME.
ملاحظة هامة: تقييمك سياقي استشاري، بينما المصادقة النهائية تخضع دائماً لمحرك المخاطر الحتمي الصارم (Deterministic Risk Engine).

الإخراج بتنسيق JSON:
{
  "agentId": "risk",
  "symbol": "${symbol}",
  "riskGrade": "LOW" | "MEDIUM" | "HIGH" | "EXTREME",
  "maxDrawdownThreat": "وصف التهديد على المحفظة",
  "thesisWeaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
  "liquidityAssessment": "تقييم السيولة",
  "volatilityCondition": "حالة التذبذب",
  "suggestedStopLossMultiplier": 1.5,
  "summaryAr": "ملخص تقييم المخاطر باللغة العربية",
  "dataTimestamp": "${new Date().toISOString()}"
}`;

    const prompt = `قم بإجراء تقييم شامل لمخاطر التداول على الأصل ${symbol} في ضوء حالة المحفظة والسيولة والتقلبات. أخرج النتيجة بتنسيق JSON.`;

    const result = await agentRunner.executeAgent<RiskAIAgentOutput>({
      agentId: RiskAIAgent.ID,
      agentName: RiskAIAgent.NAME,
      agentNameAr: RiskAIAgent.NAME_AR,
      symbol,
      analysisSessionId: sessionId,
      instructions,
      prompt,
      tools: {
        getMarketPrice: getMarketPriceTool,
        getPortfolioContext: getPortfolioContextTool,
        getOpenPositions: getOpenPositionsTool
      },
      profile: 'STRONG_REASONING',
      promptVersion: RiskAIAgent.PROMPT_VERSION,
      outputParser: (text: string) => {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in risk agent response');
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return RiskAIAgentOutputSchema.parse(parsed);
      }
    });

    if (!result.success || !result.output) {
      throw new Error(result.error || 'Failed to execute Risk Agent');
    }

    return result.output;
  }
}

export const riskAIAgent = new RiskAIAgent();
