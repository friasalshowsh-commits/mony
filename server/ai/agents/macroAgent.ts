export interface MacroAgentOutput {
  agentId: 'macro';
  status: 'DATA_UNAVAILABLE' | 'CONNECTED';
  regime: 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL' | 'UNCERTAIN';
  confidence: number;
  summaryAr: string;
  dataTimestamp: string;
}

export class MacroAgent {
  public static readonly ID = 'macro';
  public static readonly NAME = 'Macroeconomic Agent';
  public static readonly NAME_AR = 'وكيل الاقتصاد الكلي';
  public static readonly PROMPT_VERSION = 'macro-v1.0';

  public async analyze(sessionId: string): Promise<MacroAgentOutput> {
    const apiKey = process.env.FRED_API_KEY || process.env.MACRO_API_KEY;
    if (!apiKey) {
      return {
        agentId: 'macro',
        status: 'DATA_UNAVAILABLE',
        regime: 'UNCERTAIN',
        confidence: 0,
        summaryAr: 'مصدر مؤشرات الاقتصاد الكلي (DXY, سندات الخزانة الأمريكية) غير متصل.',
        dataTimestamp: new Date().toISOString()
      };
    }

    return {
      agentId: 'macro',
      status: 'DATA_UNAVAILABLE',
      regime: 'UNCERTAIN',
      confidence: 0,
      summaryAr: 'مصدر الاقتصاد الكلي غير متصل',
      dataTimestamp: new Date().toISOString()
    };
  }
}

export const macroAgent = new MacroAgent();
