import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { 
  AgentProfile, 
  AnalysisSession, 
  BacktestResult, 
  MarketTicker, 
  PaperOrder, 
  PaperPosition, 
  PortfolioSummary, 
  SystemEvent, 
  TradeRecord, 
  TradingStrategy, 
  UserSettings 
} from '../types/index.js';

interface NexusContextType {
  tickers: MarketTicker[];
  agents: AgentProfile[];
  positions: PaperPosition[];
  orders: PaperOrder[];
  tradeLedger: TradeRecord[];
  analysisSessions: AnalysisSession[];
  strategies: TradingStrategy[];
  backtests: BacktestResult[];
  settings: UserSettings | null;
  systemEvents: SystemEvent[];
  portfolio: PortfolioSummary | null;
  connected: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
  selectedAsset: string;
  setSelectedAsset: (asset: string) => void;
  selectedSession: AnalysisSession | null;
  setSelectedSession: (session: AnalysisSession | null) => void;
  selectedTrade: TradeRecord | null;
  setSelectedTrade: (trade: TradeRecord | null) => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  triggerScan: (symbol?: string) => Promise<AnalysisSession | undefined>;
  toggleSystemPause: (paused?: boolean) => Promise<boolean>;
  closePosition: (positionId: string) => Promise<TradeRecord | undefined>;
  closeAllPositions: () => Promise<number>;
  runBacktest: (params: any) => Promise<BacktestResult>;
  createStrategy: (params: any) => Promise<TradingStrategy>;
  updateStrategyStatus: (strategyId: string, status: string) => Promise<TradingStrategy>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  askAssistant: (prompt: string) => Promise<{ response: string; actionTaken?: string }>;
  switchDataMode: (mode: 'LIVE' | 'DEMO') => Promise<void>;
  executeCandidateTrade: (tradeParams: any) => Promise<PaperPosition>;
  resetPortfolio: () => Promise<void>;
  toggleLanguage: () => Promise<void>;
}

const NexusContext = createContext<NexusContextType | null>(null);

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [tradeLedger, setTradeLedger] = useState<TradeRecord[]>([]);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC/USDT');
  const [selectedSession, setSelectedSession] = useState<AnalysisSession | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<TradeRecord | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Initial full hydration
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setTickers(data.tickers || []);
        setAgents(data.agents || []);
        setPositions(data.positions || []);
        setOrders(data.orders || []);
        setTradeLedger(data.tradeLedger || []);
        setAnalysisSessions(data.analysisSessions || []);
        setStrategies(data.strategies || []);
        setBacktests(data.backtests || []);
        setSettings(data.settings || null);
        setSystemEvents(data.systemEvents || []);
        setPortfolio(data.portfolio || null);
      }
    } catch (err) {
      console.error('[Nexus] Hydration error:', err);
    }
  };

  // Connect Realtime SSE Stream
  useEffect(() => {
    fetchState();

    let retryTimeout: NodeJS.Timeout;

    const setupSSE = () => {
      const es = new EventSource('/api/realtime/events');
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;

          if (type === 'CONNECTED') {
            setConnected(true);
          } else if (type === 'TICKER_UPDATED') {
            setTickers(prev => prev.map(t => t.symbol === data.symbol ? data : t));
          } else if (type === 'AGENT_UPDATED') {
            setAgents(prev => prev.map(a => a.id === data.id ? data : a));
          } else if (type === 'POSITIONS_UPDATED') {
            setPositions(data);
          } else if (type === 'POSITION_OPENED') {
            setPositions(prev => [data, ...prev.filter(p => p.id !== data.id)]);
          } else if (type === 'POSITION_CLOSED') {
            setPositions(prev => prev.filter(p => p.id !== data.position.id));
            setTradeLedger(prev => [data.trade, ...prev]);
          } else if (type === 'ORDER_FILLED' || type === 'ORDER_CREATED') {
            setOrders(prev => [data, ...prev.filter(o => o.id !== data.id)]);
          } else if (type === 'PORTFOLIO_UPDATED') {
            setPortfolio(data);
          } else if (type === 'ANALYSIS_SESSION_CREATED') {
            setAnalysisSessions(prev => [data, ...prev.filter(s => s.id !== data.id)]);
          } else if (type === 'ANALYSIS_SESSION_COMPLETED') {
            setAnalysisSessions(prev => [data, ...prev.filter(s => s.id !== data.id)]);
          } else if (type === 'SETTINGS_UPDATED') {
            setSettings(data);
          } else if (type === 'STRATEGY_CREATED' || type === 'STRATEGY_UPDATED') {
            setStrategies(prev => [data, ...prev.filter(s => s.id !== data.id)]);
          } else if (type === 'BACKTEST_COMPLETED') {
            setBacktests(prev => [data, ...prev.filter(b => b.id !== data.id)]);
          }
        } catch (e) {
          console.error('[Nexus SSE Parse Error]', e);
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        retryTimeout = setTimeout(setupSSE, 3000);
      };
    };

    setupSSE();

    // Fallback sync interval every 15s to keep accounting pristine
    const syncInterval = setInterval(fetchState, 15000);

    return () => {
      clearInterval(syncInterval);
      clearTimeout(retryTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const triggerScan = async (symbol?: string) => {
    try {
      const res = await fetch('/api/scanner/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol || selectedAsset })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setAnalysisSessions(prev => [data.session, ...prev]);
          setSelectedSession(data.session);
          return data.session;
        }
      }
    } catch (err) {
      console.error('Failed to trigger scan:', err);
    }
  };

  const toggleSystemPause = async (paused?: boolean) => {
    try {
      const res = await fetch('/api/system/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused })
      });
      const data = await res.json();
      if (settings) {
        setSettings({ ...settings, systemPaused: data.systemPaused });
      }
      return data.systemPaused;
    } catch (err) {
      console.error('Failed to toggle system pause:', err);
      return false;
    }
  };

  const closePosition = async (positionId: string) => {
    try {
      const res = await fetch('/api/positions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId })
      });
      const data = await res.json();
      if (data.success && data.trade) {
        setPositions(prev => prev.filter(p => p.id !== positionId));
        setTradeLedger(prev => [data.trade, ...prev]);
        return data.trade;
      }
    } catch (err) {
      console.error('Failed to close position:', err);
    }
  };

  const closeAllPositions = async () => {
    try {
      const res = await fetch('/api/positions/close-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setPositions([]);
        fetchState();
        return data.closedCount;
      }
    } catch (err) {
      console.error('Failed to close all positions:', err);
    }
    return 0;
  };

  const runBacktest = async (params: any) => {
    const res = await fetch('/api/backtest/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (data.result) {
      setBacktests(prev => [data.result, ...prev]);
      return data.result;
    }
    throw new Error(data.error || 'Backtest failed');
  };

  const createStrategy = async (params: any) => {
    const res = await fetch('/api/strategies/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (data.strategy) {
      setStrategies(prev => [data.strategy, ...prev]);
      return data.strategy;
    }
    throw new Error(data.error || 'Failed to create strategy');
  };

  const updateStrategyStatus = async (strategyId: string, status: string) => {
    const res = await fetch('/api/strategies/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategyId, status })
    });
    const data = await res.json();
    if (data.strategy) {
      setStrategies(prev => prev.map(s => s.id === strategyId ? data.strategy : s));
      return data.strategy;
    }
    throw new Error(data.error || 'Failed to update strategy status');
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const res = await fetch('/api/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    const data = await res.json();
    if (data.settings) {
      setSettings(data.settings);
    }
  };

  const switchDataMode = async (mode: 'LIVE' | 'DEMO') => {
    try {
      const res = await fetch('/api/market/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (data.success && settings) {
        setSettings({ ...settings, dataMode: mode });
        fetchState();
      }
    } catch (err) {
      console.error('Failed to switch data mode:', err);
    }
  };

  const executeCandidateTrade = async (tradeParams: any) => {
    const res = await fetch('/api/trades/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeParams)
    });
    const data = await res.json();
    if (data.success && data.position) {
      setPositions(prev => [data.position, ...prev]);
      fetchState();
      return data.position;
    }
    throw new Error(data.error || 'Failed to execute trade');
  };

  const resetPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setPositions([]);
        setOrders([]);
        setTradeLedger([]);
        if (data.portfolio) setPortfolio(data.portfolio);
        fetchState();
      }
    } catch (err) {
      console.error('Failed to reset portfolio:', err);
    }
  };

  const toggleLanguage = async () => {
    if (!settings) return;
    const nextLang = settings.language === 'ar' ? 'en' : 'ar';
    await updateSettings({ language: nextLang });
  };

  const askAssistant = async (prompt: string) => {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt })
    });
    const data = await res.json();
    return data;
  };

  return (
    <NexusContext.Provider
      value={{
        tickers,
        agents,
        positions,
        orders,
        tradeLedger,
        analysisSessions,
        strategies,
        backtests,
        settings,
        systemEvents,
        portfolio,
        connected,
        activeView,
        setActiveView,
        selectedAsset,
        setSelectedAsset,
        selectedSession,
        setSelectedSession,
        selectedTrade,
        setSelectedTrade,
        isAssistantOpen,
        setIsAssistantOpen,
        triggerScan,
        toggleSystemPause,
        closePosition,
        closeAllPositions,
        runBacktest,
        createStrategy,
        updateStrategyStatus,
        updateSettings,
        askAssistant,
        switchDataMode,
        executeCandidateTrade,
        resetPortfolio,
        toggleLanguage
      }}
    >
      {children}
    </NexusContext.Provider>
  );
};

export const useNexus = () => {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error('useNexus must be used within a NexusProvider');
  }
  return context;
};
