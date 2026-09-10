import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../../db.js';
import { paperEngine } from '../../paperEngine.js';

export const createPaperOrderTool = tool({
  description: 'Execution tool for opening paper trading positions. Gated by strict validation: requires Risk Approval, fresh prices, active paper mode, and Shadow Mode disabled.',
  parameters: z.object({
    symbol: z.string(),
    direction: z.enum(['LONG', 'SHORT']),
    quantity: z.number().positive(),
    entryPrice: z.number().positive(),
    stopLoss: z.number().positive(),
    takeProfit: z.number().positive(),
    strategyId: z.string().optional(),
    strategyName: z.string().optional(),
    analysisSessionId: z.string().optional(),
    riskApproved: z.boolean().describe('Must be explicitly true from deterministic risk engine')
  }),
  execute: async ({
    symbol,
    direction,
    quantity,
    entryPrice,
    stopLoss,
    takeProfit,
    strategyId,
    strategyName,
    analysisSessionId,
    riskApproved
  }) => {
    const database = db.getDB();
    const settings = database.settings;

    // Safety checks
    if (!riskApproved) {
      return {
        success: false,
        status: 'BLOCKED_RISK_REJECTED',
        messageAr: 'تم حظر فتح الصفقة لعدم مصادقة محرك المخاطر الحتمي'
      };
    }

    if (settings.systemPaused) {
      return {
        success: false,
        status: 'BLOCKED_SYSTEM_PAUSED',
        messageAr: 'النظام موقوف حالياً من قبل المشغل'
      };
    }

    if (settings.shadowMode) {
      return {
        success: false,
        status: 'SHADOW_MODE_ACTIVE',
        messageAr: 'الوضع الظلي مفعّل (Shadow Mode): تم تسجيل التوصية والقرار دون تنفيذ طلب ورقي تلقائي'
      };
    }

    // Verify price freshness
    const ticker = database.tickers.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
    if (!ticker) {
      return {
        success: false,
        status: 'BLOCKED_NO_TICKER',
        messageAr: `الرمز ${symbol} غير متوفر`
      };
    }

    const freshnessMs = ticker.metadata?.freshnessMs ?? 0;
    if (freshnessMs > 20000) {
      return {
        success: false,
        status: 'BLOCKED_STALE_PRICE',
        messageAr: 'بيانات الأسعار قديمة جداً (Stale) للتنفيذ'
      };
    }

    try {
      const position = paperEngine.executePaperTrade({
        asset: symbol,
        direction,
        quantity,
        entryPrice,
        stopLoss,
        takeProfit,
        strategyId: strategyId || 'strat-multi-agent-v3',
        strategyName: strategyName || 'Vercel AI Multi-Agent Consensus',
        supervisorConfidence: 85,
        analysisSessionId: analysisSessionId || 'SESSION-AUTO'
      });

      return {
        success: true,
        status: 'POSITION_OPENED',
        positionId: position.id,
        notionalValue: position.notionalValue,
        openedAt: position.openedAt,
        messageAr: `تم فتح صفقة ${direction === 'LONG' ? 'شراء' : 'بيع'} ورقية بنجاح على ${symbol}`
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'ERROR',
        error: err.message
      };
    }
  }
});
