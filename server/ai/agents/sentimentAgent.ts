export interface SentimentAgentOutput {
  agentId: 'sentiment';
  symbol: string;
  status: 'DATA_UNAVAILABLE' | 'CONNECTED';
  signal: 'VERY_BEARISH' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'VERY_BULLISH';
  confidence: number;
  summaryAr: string;
  dataTimestamp: string;
}

export class SentimentAgent {
  public static readonly ID = 'sentiment';
  public static readonly NAME = 'Market Sentiment Agent';
  public static readonly NAME_AR = 'وكيل معنويات السوق';
  public static readonly PROMPT_VERSION = 'sentiment-v1.0';

  public async analyze(symbol: string, sessionId: string): Promise<SentimentAgentOutput> {
    const apiKey = process.env.COINGLASS_API_KEY || process.env.DERIVATIVES_API_KEY;
    if (!apiKey) {
      return {
        agentId: 'sentiment',
        symbol,
        status: 'DATA_UNAVAILABLE',
        signal: 'NEUTRAL',
        confidence: 0,
        summaryAr: 'مصدر بيانات معنويات العقود ومعدلات التمويل والتصفيات غير متصل؛ تم تسجيل عدم توفر البيانات.',
        dataTimestamp: new Date().toISOString()
      };
    }

    return {
      agentId: 'sentiment',
      symbol,
      status: 'DATA_UNAVAILABLE',
      signal: 'NEUTRAL',
      confidence: 0,
      summaryAr: 'مصدر معنويات العقود غير متصل',
      dataTimestamp: new Date().toISOString()
    };
  }
}

export const sentimentAgent = new SentimentAgent();
