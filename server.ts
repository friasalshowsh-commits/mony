import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { orchestrator } from './server/agentOrchestrator.js';
import { analysisOrchestrator } from './server/ai/services/analysisOrchestrator.js';
import { nexusAssistantAgent } from './server/ai/agents/assistantAgent.js';
import { usageTracker } from './server/ai/services/usageTracker.js';
import { backtestEngine } from './server/backtestEngine.js';
import { db } from './server/db.js';
import { marketDataEngine } from './server/marketData.js';
import { paperEngine } from './server/paperEngine.js';
import { realtimeBus } from './server/realtime.js';
import { scannerLoop } from './server/scanner.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Start autonomous market tick loop
  scannerLoop.start();

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      mode: 'PAPER_TRADING',
      isLiveTradingLocked: true,
      timestamp: new Date().toISOString(),
      activeAgents: db.getDB().agents.length,
      connectedClients: realtimeBus.getConnectedClientsCount()
    });
  });

  // Full state endpoint for initial hydration & resync
  app.get('/api/state', (req, res) => {
    const database = db.getDB();
    res.json({
      tickers: database.tickers,
      agents: database.agents,
      positions: database.positions,
      orders: database.orders,
      tradeLedger: database.tradeLedger,
      analysisSessions: database.analysisSessions,
      strategies: database.strategies,
      backtests: database.backtests,
      settings: database.settings,
      systemEvents: database.systemEvents,
      portfolio: paperEngine.getPortfolioSummary()
    });
  });

  // Portfolio summary
  app.get('/api/portfolio', (req, res) => {
    res.json(paperEngine.getPortfolioSummary());
  });

  // Realtime Server-Sent Events (SSE) Stream
  app.get('/api/realtime/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    realtimeBus.registerClient(res);
  });

  // Manual Trigger Scanner / Analysis Session
  app.post('/api/scanner/trigger', async (req, res) => {
    try {
      const { symbol } = req.body;
      const session = await scannerLoop.manualTriggerScan(symbol);
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Direct Analysis Run alias
  app.post('/api/analysis/run', async (req, res) => {
    try {
      const symbol = req.body.symbol || req.body.asset || 'BTC/USDT';
      const session = await scannerLoop.manualTriggerScan(symbol);
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get Latest Analysis Session
  app.get('/api/analysis/latest', (req, res) => {
    const database = db.getDB();
    const latest = database.analysisSessions[0] || null;
    res.json({ success: true, session: latest });
  });

  // Toggle Global Pause / Resume
  app.post('/api/system/pause', (req, res) => {
    const database = db.getDB();
    const { paused } = req.body;
    database.settings.systemPaused = typeof paused === 'boolean' ? paused : !database.settings.systemPaused;
    db.save();

    db.addEvent({
      type: 'SYSTEM',
      severity: database.settings.systemPaused ? 'WARNING' : 'INFO',
      source: 'Operator Console',
      message: `Trading system execution ${database.settings.systemPaused ? 'PAUSED' : 'RESUMED'} by operator.`
    });

    realtimeBus.broadcast('SETTINGS_UPDATED', database.settings);
    res.json({ success: true, systemPaused: database.settings.systemPaused });
  });

  // Close single paper position
  app.post('/api/positions/close', (req, res) => {
    const { positionId } = req.body;
    if (!positionId) {
      return res.status(400).json({ error: 'positionId is required' });
    }
    const trade = paperEngine.closePosition(positionId, 'MANUAL_CLOSE');
    if (!trade) {
      return res.status(404).json({ error: 'Position not found' });
    }
    res.json({ success: true, trade });
  });

  // Close all open paper positions (Emergency Flatten)
  app.post('/api/positions/close-all', (req, res) => {
    const database = db.getDB();
    const closedTrades = [];
    while (database.positions.length > 0) {
      const pos = database.positions[0];
      const trade = paperEngine.closePosition(pos.id, 'MANUAL_CLOSE');
      if (trade) closedTrades.push(trade);
    }
    db.addEvent({
      type: 'SYSTEM',
      severity: 'WARNING',
      source: 'Operator Console',
      message: `Emergency flattened all positions (${closedTrades.length} positions closed).`
    });
    res.json({ success: true, closedCount: closedTrades.length });
  });

  // Backtesting runner
  app.post('/api/backtest/run', async (req, res) => {
    try {
      const result = await backtestEngine.runBacktest(req.body);
      db.addEvent({
        type: 'STRATEGY',
        severity: 'SUCCESS',
        source: 'Backtesting Engine',
        asset: result.asset,
        message: `Backtest completed for ${result.strategyName} on ${result.asset}. Return: +${result.totalReturnPercent}%, Win Rate: ${result.winRate}%`
      });
      realtimeBus.broadcast('BACKTEST_COMPLETED', result);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Market Status endpoint
  app.get('/api/market/status', (req, res) => {
    const database = db.getDB();
    const mode = database.settings.dataMode || 'LIVE';
    res.json({
      success: true,
      mode,
      tickersCount: database.tickers.length,
      tickers: database.tickers.map(t => ({
        symbol: t.symbol,
        price: t.price,
        source: t.metadata?.source || (mode === 'LIVE' ? 'BINANCE' : 'DEMO'),
        status: t.metadata?.status || (mode === 'LIVE' ? 'LIVE' : 'DEMO'),
        freshnessMs: t.metadata?.freshnessMs ?? 0,
        isDemo: t.isDemo
      }))
    });
  });

  // Market Data Mode switch (LIVE vs DEMO)
  app.post('/api/market/mode', async (req, res) => {
    try {
      const { mode } = req.body;
      if (mode !== 'LIVE' && mode !== 'DEMO') {
        return res.status(400).json({ error: 'mode must be LIVE or DEMO' });
      }
      await scannerLoop.switchMode(mode);
      db.addEvent({
        type: 'SYSTEM',
        severity: 'INFO',
        source: 'محول وضع السوق',
        message: `تم تحويل وضع بيانات السوق إلى: ${mode === 'LIVE' ? 'الأسعار الحية (Binance Live)' : 'الوضع التجريبي المحاكي (Demo Simulation)'}`
      });
      res.json({ success: true, mode });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Historical Candles endpoint
  app.get('/api/market/candles', async (req, res) => {
    try {
      const symbol = (req.query.symbol as string) || 'BTC/USDT';
      const timeframe = (req.query.timeframe as string) || '1h';
      const count = parseInt(req.query.count as string) || 60;
      const candles = await marketDataEngine.getOHLCV(symbol, timeframe, count);
      res.json({ success: true, symbol, timeframe, candles });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Direct Candidate Trade Execution
  app.post('/api/trades/execute', (req, res) => {
    try {
      const pos = paperEngine.executePaperTrade(req.body);
      res.json({ success: true, position: pos });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Portfolio Reset
  app.post('/api/portfolio/reset', (req, res) => {
    const database = db.getDB();
    database.positions = [];
    database.orders = [];
    database.tradeLedger = [];
    database.settings.currentCashBalance = database.settings.initialPaperBalance;
    database.equityHistory = [
      { timestamp: new Date().toISOString(), equity: database.settings.initialPaperBalance, pnl: 0 }
    ];
    db.save();

    db.addEvent({
      type: 'SYSTEM',
      severity: 'WARNING',
      source: 'إدارة المحفظة',
      message: `تمت إعادة ضبط المحفظة التجريبية إلى الرصيد الابتدائي $${database.settings.initialPaperBalance.toLocaleString()}`
    });

    const summary = paperEngine.getPortfolioSummary();
    realtimeBus.broadcast('PORTFOLIO_UPDATED', summary);
    realtimeBus.broadcast('POSITIONS_UPDATED', []);
    res.json({ success: true, portfolio: summary });
  });

  // Create strategy
  app.post('/api/strategies/create', (req, res) => {
    const database = db.getDB();
    const newStrategy = {
      id: `strat-${Date.now().toString(36)}`,
      name: req.body.name || 'New AI Proposed Strategy',
      description: req.body.description || 'Algorithmic quantitative multi-factor setup',
      version: '1.0.0-draft',
      status: 'DRAFT' as const,
      assets: req.body.assets || ['BTC/USDT', 'ETH/USDT'],
      timeframes: req.body.timeframes || ['1h', '4h'],
      indicators: req.body.indicators || ['EMA 20/50', 'RSI 14'],
      entryConditions: req.body.entryConditions || 'Bullish divergence with BOS',
      exitConditions: req.body.exitConditions || 'Trailing stop or TP target',
      riskSettings: {
        maxRiskPerTradePercent: req.body.riskPerTrade || 1.0,
        minRiskReward: req.body.minRiskReward || 1.5,
        stopLossAtrMultiplier: 1.5
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    database.strategies.unshift(newStrategy);
    db.save();

    db.addEvent({
      type: 'STRATEGY',
      severity: 'INFO',
      source: 'Strategy Lab',
      message: `New strategy created: ${newStrategy.name} [Status: DRAFT]`
    });

    realtimeBus.broadcast('STRATEGY_CREATED', newStrategy);
    res.json({ success: true, strategy: newStrategy });
  });

  // Update strategy lifecycle status
  app.post('/api/strategies/update-status', (req, res) => {
    const { strategyId, status } = req.body;
    const database = db.getDB();
    const strat = database.strategies.find(s => s.id === strategyId);
    if (!strat) return res.status(404).json({ error: 'Strategy not found' });

    strat.status = status;
    strat.updatedAt = new Date().toISOString();
    db.save();

    db.addEvent({
      type: 'STRATEGY',
      severity: 'INFO',
      source: 'Strategy Lab',
      message: `Strategy ${strat.name} promoted to status: ${status}`
    });

    realtimeBus.broadcast('STRATEGY_UPDATED', strat);
    res.json({ success: true, strategy: strat });
  });

  // Update settings
  app.post('/api/settings/update', (req, res) => {
    const database = db.getDB();
    if (req.body.riskSettings) {
      database.settings.riskSettings = { ...database.settings.riskSettings, ...req.body.riskSettings };
    }
    if (req.body.agentWeights) {
      database.settings.agentWeights = { ...database.settings.agentWeights, ...req.body.agentWeights };
    }
    if (req.body.models) {
      database.settings.models = { ...database.settings.models, ...req.body.models };
    }
    if (typeof req.body.aiBudgetUsd === 'number') {
      database.settings.aiBudgetUsd = req.body.aiBudgetUsd;
    }
    if (typeof req.body.initialPaperBalance === 'number') {
      database.settings.initialPaperBalance = req.body.initialPaperBalance;
    }
    if (typeof req.body.theme === 'string') {
      database.settings.theme = req.body.theme;
    }
    if (typeof req.body.language === 'string') {
      database.settings.language = req.body.language;
    }
    db.save();

    db.addEvent({
      type: 'SYSTEM',
      severity: 'INFO',
      source: 'Settings Console',
      message: 'Platform parameters & risk thresholds updated by operator.'
    });

    realtimeBus.broadcast('SETTINGS_UPDATED', database.settings);
    res.json({ success: true, settings: database.settings });
  });

  // AI Observability Summary endpoint
  app.get('/api/ai/observability', (req, res) => {
    try {
      const summary = usageTracker.getObservabilitySummary();
      res.json({ success: true, observability: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Agent Runs History endpoint
  app.get('/api/ai/runs', (req, res) => {
    const database = db.getDB();
    const runs = database.agentRuns || [];
    const limit = parseInt(req.query.limit as string) || 100;
    const agentId = req.query.agentId as string;
    const symbol = req.query.symbol as string;

    let filtered = runs;
    if (agentId) {
      filtered = filtered.filter(r => r.agentId === agentId);
    }
    if (symbol) {
      filtered = filtered.filter(r => r.symbol?.toUpperCase() === symbol.toUpperCase());
    }

    res.json({ success: true, count: filtered.length, runs: filtered.slice(0, limit) });
  });

  // Market Snapshots History endpoint
  app.get('/api/ai/snapshots', (req, res) => {
    const database = db.getDB();
    const snapshots = database.marketSnapshots || [];
    const limit = parseInt(req.query.limit as string) || 50;
    res.json({ success: true, count: snapshots.length, snapshots: snapshots.slice(0, limit) });
  });

  // Toggle Shadow Mode
  app.post('/api/system/shadow-mode', (req, res) => {
    const database = db.getDB();
    const { enabled } = req.body;
    database.settings.shadowMode = typeof enabled === 'boolean' ? enabled : !database.settings.shadowMode;
    db.save();

    db.addEvent({
      type: 'SYSTEM',
      severity: 'INFO',
      source: 'Operator Console',
      message: `Shadow Mode (الوضع الظلي) ${database.settings.shadowMode ? 'ENABLED' : 'DISABLED'}.`
    });

    realtimeBus.broadcast('SETTINGS_UPDATED', database.settings);
    res.json({ success: true, shadowMode: database.settings.shadowMode });
  });

  // Re-run an existing analysis session
  app.post('/api/analysis/session/:id/rerun', async (req, res) => {
    try {
      const { id } = req.params;
      const database = db.getDB();
      const existing = database.analysisSessions.find(s => s.id === id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
      const newSession = await analysisOrchestrator.runSession(existing.asset, `Re-run of session ${id}`);
      res.json({ success: true, session: newSession });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Nexus AI Assistant Tool Calling Endpoint
  app.post('/api/assistant/chat', async (req, res) => {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
      const responseText = await nexusAssistantAgent.chat(message, history || []);
      res.json({
        response: responseText,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn('[Assistant] AI Chat fallback triggered:', err.message);
      
      // Intelligent deterministic fallback if API limit or error
      const database = db.getDB();
      const lower = message.toLowerCase();
      let responseText = '';

      if (lower.includes('analyze') || lower.includes('حلل')) {
        const asset = lower.includes('eth') ? 'ETH/USDT' : lower.includes('sol') ? 'SOL/USDT' : 'BTC/USDT';
        try {
          const session = await orchestrator.runAnalysisSession(asset, `Operator requested via Assistant: "${message}"`);
          responseText = `تم إرسال فريق الوكلاء لتحليل **${asset}**. اكتملت الجلسة **${session.id}** بتوصية: **${session.candidateTrade?.direction || 'NO_TRADE'}** (نسبة الثقة: ${session.candidateTrade?.confidence || 0}%). تقييم محرك المخاطر: **${session.riskDecision?.status || 'N/A'}**.`;
        } catch (e: any) {
          responseText = `تعذر إجراء التحليل: ${e.message}`;
        }
      } else if (lower.includes('why') || lower.includes('لماذا') || lower.includes('رفض')) {
        const latestRejected = database.analysisSessions.find(s => s.riskDecision && !s.riskDecision.approved);
        if (latestRejected) {
          responseText = `آخر صفقة رُفضت كانت لرمز **${latestRejected.asset}** في الجلسة **${latestRejected.id}**.\n\n**أسباب الرفض الصادرة عن محرك المخاطر الحتمي:**\n${latestRejected.riskDecision?.failedRules.map(r => `• ${r}`).join('\n') || 'عدم استيفاء نسبة العائد للمخاطرة'}\n\nيحرص محرك المخاطر على حماية رأس المال من الهبوط الحاد.`;
        } else {
          responseText = `لم تسجل أي صفقات مرفوضة مؤخراً. جميع الصفقات الخاضعة للتقييم استوفت معايير نسبة R:R والحد الأقصى للتراجع.`;
        }
      } else {
        const portfolio = paperEngine.getPortfolioSummary();
        responseText = `مرحباً بك في **مركز قيادة NEXUS TRADING AI**.\n• القيمة الإجمالية للمحفظة: **$${portfolio.equity.toLocaleString()}** (الأرباح المحققة: ${portfolio.totalPnL >= 0 ? '+' : ''}$${portfolio.totalPnL.toLocaleString()})\n• الصفقات المفتوحة: **${portfolio.openPositionsCount}** صفقة\n• عدد الوكلاء النشطين: **10 وكلاء**\n\nيمكنك أن تطلب مني: "حلل البيتكوين"، "لماذا رفضت الصفقة؟"، أو "اعرض الصفقات المفتوحة".`;
      }

      res.json({
        response: responseText,
        timestamp: new Date().toISOString()
      });
    }
  });

  // ==========================================
  // VITE MIDDLEWARE / STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nexus Server] Operational on port ${PORT} (0.0.0.0)`);
  });
}

startServer();
