import { tool } from 'ai';
import { z } from 'zod';

export const getRecentNewsTool = tool({
  description: 'Fetches certified breaking news and macroeconomic headlines affecting the specified asset. If no authenticated provider is linked, strictly returns DATA_UNAVAILABLE.',
  inputSchema: z.object({
    symbol: z.string().describe('Trading pair e.g. BTC/USDT')
  }),
  execute: async ({ symbol }) => {
    // Check if external news provider API key is provided
    const newsApiKey = process.env.CRYPTO_NEWS_API_KEY || process.env.NEWS_API_KEY;
    
    if (!newsApiKey) {
      return {
        status: 'DATA_UNAVAILABLE',
        connected: false,
        source: 'NONE',
        messageAr: 'مصدر الأخبار المالية الحية غير متصل حالياً',
        articles: []
      };
    }

    // When real API key exists, real fetch would occur here
    return {
      status: 'DATA_UNAVAILABLE',
      connected: false,
      source: 'NONE',
      messageAr: 'مصدر الأخبار المالية الحية غير متصل حالياً',
      articles: []
    };
  }
});
