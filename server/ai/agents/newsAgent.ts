import { getRecentNewsTool } from '../tools/newsTool.js';
import { agentRunner } from '../services/agentRunner.js';

export interface NewsAgentOutput {
  agentId: 'news';
  symbol: string;
  status: 'DATA_UNAVAILABLE' | 'CONNECTED';
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  summaryAr: string;
  headlinesCount: number;
  dataTimestamp: string;
}

export class NewsAgent {
  public static readonly ID = 'news';
  public static readonly NAME = 'Financial News Agent';
  public static readonly NAME_AR = 'وكيل الأخبار المالية';
  public static readonly PROMPT_VERSION = 'news-v1.0';

  public async analyze(symbol: string, sessionId: string): Promise<NewsAgentOutput> {
    // If news API is not configured, truthfully report DATA_UNAVAILABLE
    const newsApiKey = process.env.CRYPTO_NEWS_API_KEY || process.env.NEWS_API_KEY;
    if (!newsApiKey) {
      return {
        agentId: 'news',
        symbol,
        status: 'DATA_UNAVAILABLE',
        signal: 'NEUTRAL',
        confidence: 0,
        summaryAr: 'مصدر الأخبار المالية الحية غير متصل حالياً؛ تم تخطي التحليل الإخباري بصدق دون اصطناع بيانات.',
        headlinesCount: 0,
        dataTimestamp: new Date().toISOString()
      };
    }

    // Otherwise run via AgentRunner
    const result = await agentRunner.executeAgent<NewsAgentOutput>({
      agentId: NewsAgent.ID,
      agentName: NewsAgent.NAME,
      agentNameAr: NewsAgent.NAME_AR,
      symbol,
      analysisSessionId: sessionId,
      instructions: 'حلل الأخبار المؤكدة فقط دون تلفيق أي عناوين.',
      prompt: `افحص آخر الأخبار المؤكدة للأصل ${symbol}`,
      tools: { getRecentNews: getRecentNewsTool },
      profile: 'FAST_ANALYSIS',
      outputParser: () => ({
        agentId: 'news',
        symbol,
        status: 'DATA_UNAVAILABLE',
        signal: 'NEUTRAL',
        confidence: 0,
        summaryAr: 'مصدر الأخبار غير متصل',
        headlinesCount: 0,
        dataTimestamp: new Date().toISOString()
      })
    });

    return result.output!;
  }
}

export const newsAgent = new NewsAgent();
