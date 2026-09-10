import { tool } from 'ai';
import { z } from 'zod';

export const getMacroContextTool = tool({
  description: 'Fetches real-time macroeconomic indicators: US Dollar Index (DXY), 10Y Treasury Yields, S&P 500 futures, CPI calendar. Returns DATA_UNAVAILABLE if provider is unconfigured.',
  parameters: z.object({}),
  execute: async () => {
    const macroApiKey = process.env.FRED_API_KEY || process.env.MACRO_API_KEY;

    if (!macroApiKey) {
      return {
        status: 'DATA_UNAVAILABLE',
        connected: false,
        source: 'NONE',
        messageAr: 'مصدر بيانات مؤشرات الاقتصاد الكلي (DXY, العوائد) غير متصل',
        regime: 'UNCERTAIN'
      };
    }

    return {
      status: 'DATA_UNAVAILABLE',
      connected: false,
      source: 'NONE',
      messageAr: 'مصدر بيانات مؤشرات الاقتصاد الكلي (DXY, العوائد) غير متصل',
      regime: 'UNCERTAIN'
    };
  }
});
