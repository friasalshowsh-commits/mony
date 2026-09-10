import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../../db.js';
import { marketDataEngine } from '../../marketData.js';

export const getMarketPriceTool = tool({
  description: 'Fetches the authoritative current market price, timestamp, freshness, and connection status for a cryptocurrency pair.',
  inputSchema: z.object({
    symbol: z.string().describe('Trading pair symbol, e.g. BTC/USDT, ETH/USDT')
  }),
  execute: async ({ symbol }) => {
    const database = db.getDB();
    const ticker = database.tickers.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
    
    if (!ticker) {
      return {
        found: false,
        symbol,
        status: 'DISCONNECTED',
        messageAr: `الرمز ${symbol} غير متوفر في قائمة المراقبة النشطة`
      };
    }

    const freshnessMs = ticker.metadata?.freshnessMs ?? 0;
    const isStale = freshnessMs > 15000;
    const status = isStale ? 'STALE' : (ticker.metadata?.status || 'LIVE');

    return {
      found: true,
      symbol: ticker.symbol,
      price: ticker.price,
      change24h: ticker.change24h,
      high24h: ticker.high24h,
      low24h: ticker.low24h,
      volume24h: ticker.volume24h,
      trend: ticker.trend,
      marketRegime: ticker.marketRegime,
      source: ticker.metadata?.source || (ticker.isDemo ? 'DEMO' : 'BINANCE'),
      status,
      freshnessMs,
      isDemo: ticker.isDemo,
      marketTimestamp: ticker.metadata?.marketTimestamp || Date.now(),
      receivedAt: ticker.lastUpdated
    };
  }
});
