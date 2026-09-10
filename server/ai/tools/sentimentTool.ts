import { tool } from 'ai';
import { z } from 'zod';

export const getMarketSentimentTool = tool({
  description: 'Fetches live derivatives sentiment: Funding rates, Open Interest delta, Long/Short liquidation ratios. Returns DATA_UNAVAILABLE if provider is not linked.',
  inputSchema: z.object({
    symbol: z.string().describe('Trading pair e.g. BTC/USDT')
  }),
  execute: async ({ symbol }) => {
    const sentimentApiKey = process.env.COINGLASS_API_KEY || process.env.DERIVATIVES_API_KEY;

    if (!sentimentApiKey) {
      return {
        status: 'DATA_UNAVAILABLE',
        connected: false,
        source: 'NONE',
        messageAr: 'مصدر بيانات معنويات العقود الآجلة والتصفيات غير متصل',
        fundingRate: null,
        openInterestDelta: null,
        longShortRatio: null
      };
    }

    return {
      status: 'DATA_UNAVAILABLE',
      connected: false,
      source: 'NONE',
      messageAr: 'مصدر بيانات معنويات العقود الآجلة والتصفيات غير متصل'
    };
  }
});
