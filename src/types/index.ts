// NEXUS TRADING AI - Shared Domain Types

export type MarketDataSource = 'BINANCE' | 'BYBIT' | 'DEMO' | 'COINBASE';
export type MarketDataMode = 'LIVE' | 'DEMO';
export type MarketDataStatus = 'LIVE' | 'DELAYED' | 'STALE' | 'DEMO' | 'DISCONNECTED';

export interface MarketSourceMetadata {
  source: MarketDataSource;
  mode: MarketDataMode;
  receivedAt: string;
  marketTimestamp: number;
  freshnessMs: number;
  isDemo: boolean;
  status: MarketDataStatus;
}

export type MarketRegime = 
  | 'BULL_TREND'
  | 'BEAR_TREND'
  | 'RANGE'
  | 'BREAKOUT'
  | 'HIGH_VOLATILITY'
  | 'UNCERTAIN';

export type MacroRegime = 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL' | 'UNCERTAIN';

export type SignalDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type TradeDirection = 'LONG' | 'SHORT' | 'HOLD' | 'NO_TRADE';

export type AgentStatus = 
  | 'IDLE' 
  | 'QUEUED' 
  | 'ANALYZING' 
  | 'SEARCHING' 
  | 'WAITING_FOR_DATA' 
  | 'CALLING_TOOL' 
  | 'REVIEWING' 
  | 'COMPLETED' 
  | 'REJECTED' 
  | 'ERROR' 
  | 'DISABLED';

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  weight: number; // percentage (e.g., 25 for Technical Agent)
  model: string;
  status: AgentStatus;
  currentAsset?: string;
  currentTask?: string;
  tasksCompleted: number;
  tasksFailed: number;
  avgLatencyMs: number;
  tokensUsed: number;
  estimatedCostUsd: number;
  avgConfidence: number;
  lastActive: string;
  lastResult?: string;
}

export interface IndicatorSignals {
  rsi: number;
  rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
  macd: { value: number; signal: number; histogram: number; trend: 'BULLISH' | 'BEARISH' | 'CROSSOVER' };
  emaAlignment: 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'BEAR' | 'STRONG_BEAR';
  bollingerBands: { upper: number; middle: number; lower: number; position: 'UPPER' | 'MIDDLE' | 'LOWER' | 'SQUEEZE' };
  atr: number;
  adx: number;
  vwap: number;
  obvTrend: 'RISING' | 'FALLING' | 'FLAT';
}

export interface AgentReport {
  agentId: string;
  agentName: string;
  asset: string;
  timestamp: string;
  timeframe: string;
  signal: SignalDirection;
  confidence: number; // 0 to 100
  evidence: string[];
  risks: string[];
  dataSources: string[];
  dataFreshness: 'LIVE' | 'DELAYED' | 'STALE' | 'DEMO';
  summary: string;
  rawDetails?: Record<string, any>;
}

export interface CandidateTrade {
  asset: string;
  direction: TradeDirection;
  confidence: number;
  marketRegime: MarketRegime;
  currentPrice: number;
  entryLow: number;
  entryHigh: number;
  suggestedEntry: number;
  stopLoss: number;
  takeProfits: { level: number; price: number; percentage: number }[];
  riskRewardRatio: number;
  timeHorizon: string;
  supportingReasons: string[];
  opposingReasons: string[];
  agentVotes: { agentId: string; agentName: string; signal: SignalDirection; weight: number; confidence: number }[];
  supervisorSummary: string;
  dataTimestamp: string;
}

export interface RiskDecision {
  tradeCandidateId?: string;
  asset: string;
  approved: boolean;
  status: 'APPROVED' | 'REJECTED';
  reasons: string[];
  failedRules: string[];
  suggestedPositionSizeUsd: number;
  suggestedQuantity: number;
  calculatedRiskUsd: number;
  riskPercentage: number;
  riskRewardRatio: number;
  accountEquity: number;
  timestamp: string;
  ruleChecks: {
    rule: string;
    passed: boolean;
    value: string | number;
    threshold: string | number;
  }[];
}

export type OrderStatus = 
  | 'PENDING' 
  | 'OPEN' 
  | 'PARTIALLY_FILLED' 
  | 'FILLED' 
  | 'CANCELLED' 
  | 'REJECTED' 
  | 'CLOSED';

export type OrderType = 'MARKET' | 'LIMIT';
export type OrderSide = 'BUY' | 'SELL';

export interface PaperOrder {
  id: string;
  asset: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  quantity: number;
  notional: number;
  status: OrderStatus;
  createdAt: string;
  filledAt?: string;
  stopLoss?: number;
  takeProfit?: number;
  fees: number;
  slippage: number;
  reason?: string;
  analysisSessionId?: string;
}

export type PositionStatus = 'OPEN' | 'CLOSED';

export interface PaperPosition {
  id: string;
  asset: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  notionalValue: number;
  stopLoss: number;
  takeProfitLevels: { level: number; price: number; percentage: number }[];
  takeProfit: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  allocatedCapital: number;
  riskAmount: number;
  riskPercent: number;
  riskRewardRatio: number;
  strategyId: string;
  strategyName: string;
  supervisorConfidence: number;
  openedAt: string;
  lastUpdated: string;
  analysisSessionId: string;
  distanceToStopPercent: number;
  distanceToTargetPercent: number;
  marketDataSource?: MarketDataSource;
  marketDataMode?: MarketDataMode;
  executionMode?: 'PAPER';
  entryMarketTimestamp?: number;
  tradeType?: 'LIVE_MARKET_PAPER' | 'DEMO_PAPER';
}

export type ExitReason = 
  | 'STOP_LOSS'
  | 'TAKE_PROFIT'
  | 'MANUAL_CLOSE'
  | 'STRATEGY_EXIT'
  | 'RISK_EXIT'
  | 'TRAILING_STOP'
  | 'TIME_EXIT'
  | 'SYSTEM_EXIT';

export interface TradeRecord {
  id: string;
  accountId: string;
  asset: string;
  exchange: 'PAPER_SIMULATOR' | 'BINANCE' | 'BYBIT';
  mode: 'PAPER' | 'LIVE';
  direction: 'LONG' | 'SHORT';
  strategyName: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  quantity: number;
  notionalValue: number;
  stopLoss: number;
  takeProfit: number;
  grossPnL: number;
  fees: number;
  slippage: number;
  netPnL: number;
  netPnLPercent: number;
  riskAmount: number;
  riskPercent: number;
  riskRewardRatio: number;
  durationMinutes: number;
  exitReason: ExitReason;
  supervisorConfidence: number;
  marketRegime: MarketRegime;
  analysisSessionId: string;
  agentVotes: { agentId: string; signal: SignalDirection; confidence: number }[];
  originalThesis: string;
  marketDataSource?: MarketDataSource;
  marketDataMode?: MarketDataMode;
  executionMode?: 'PAPER';
  entryMarketTimestamp?: number;
  tradeType?: 'LIVE_MARKET_PAPER' | 'DEMO_PAPER';
  // Post trade review by Agent 10
  postTradeReview?: {
    reviewedAt: string;
    thesisAccuracy: 'CORRECT' | 'PARTIALLY_CORRECT' | 'FAILED';
    whatWorked: string[];
    whatFailed: string[];
    agentErrors: string[];
    lessonProposal: string;
  };
}

export interface AnalysisSession {
  id: string;
  asset: string;
  startTime: string;
  completedAt?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  triggerEvent: string;
  marketSnapshot: {
    price: number;
    change24h: number;
    volume24h: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    marketRegime: MarketRegime;
    indicators?: Partial<IndicatorSignals>;
  };
  agentReports: AgentReport[];
  candidateTrade?: CandidateTrade;
  riskDecision?: RiskDecision;
  tradeExecuted?: boolean;
  orderId?: string;
  disagreementsDetected: boolean;
  conflictReviewSummary?: string;
}

export interface MarketTicker {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  marketRegime: MarketRegime;
  aiScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastUpdated: string;
  isDemo: boolean;
  metadata?: MarketSourceMetadata;
}

export interface OHLCVCandle {
  timestamp: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Candle = OHLCVCandle;

export type StrategyStatus = 
  | 'DRAFT' 
  | 'BACKTESTING' 
  | 'OUT_OF_SAMPLE' 
  | 'PAPER' 
  | 'APPROVED' 
  | 'ARCHIVED';

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  version: string;
  status: StrategyStatus;
  assets: string[];
  timeframes: string[];
  indicators: string[];
  entryConditions: string;
  exitConditions: string;
  riskSettings: {
    maxRiskPerTradePercent: number;
    minRiskReward: number;
    stopLossAtrMultiplier: number;
  };
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    netProfit: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
}

export interface BacktestTrade {
  id: string;
  date: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  exitReason: string;
}

export interface BacktestResult {
  id: string;
  strategyId: string;
  strategyName: string;
  asset: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalEquity: number;
  totalReturnPercent: number;
  netProfit: number;
  winRate: number;
  lossRate: number;
  profitFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  totalTrades: number;
  averageTradeDuration: string;
  expectancy: number;
  equityCurve: { time: string; equity: number; drawdown: number }[];
  trades: BacktestTrade[];
  monthlyReturns: { month: string; returnPercent: number }[];
}

export type EventSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface SystemEvent {
  id: string;
  timestamp: string;
  type: 
    | 'MARKET_DATA' 
    | 'SCANNER' 
    | 'AGENT' 
    | 'SUPERVISOR' 
    | 'RISK' 
    | 'ORDER' 
    | 'TRADE' 
    | 'PORTFOLIO' 
    | 'STRATEGY' 
    | 'SYSTEM' 
    | 'SECURITY';
  severity: EventSeverity;
  source: string;
  asset?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface RiskSettings {
  riskPerTradePercent: number; // default 1%
  maxDailyLossPercent: number; // default 3%
  maxPortfolioDrawdownPercent: number; // default 10%
  maxOpenPositions: number; // default 5
  minimumRiskReward: number; // default 1.5
  maxAssetExposurePercent: number; // default 20%
  maxConsecutiveLosses: number; // default 3
  tradingFeePercent: number; // default 0.06%
  simulatedSlippagePercent: number; // default 0.05%
  isLiveTradingLocked: boolean; // MUST be true by default!
}

export interface AgentWeights {
  technical: number;
  marketStructure: number;
  quant: number;
  news: number;
  sentiment: number;
  onChain: number;
  macro: number;
}

export interface UserSettings {
  initialPaperBalance: number;
  currentCashBalance: number;
  riskSettings: RiskSettings;
  agentWeights: AgentWeights;
  models: {
    supervisorModel: string;
    analyticalModel: string;
    fastModel: string;
  };
  aiBudgetUsd: number;
  aiBudgetUsedUsd: number;
  scannerIntervalSeconds: number;
  scannerActive: boolean;
  agentsActive: boolean;
  systemPaused: boolean;
  theme: 'dark' | 'light';
  language: 'en' | 'ar';
  dataMode: 'LIVE' | 'DEMO';
  shadowMode: boolean;
  autoPaperTrading: boolean;
  aiBudgetDailyUsd: number;
  aiBudgetUsedTodayUsd: number;
  maxAnalysesPerHour: number;
  maxParallelAgents: number;
}

export interface PortfolioSummary {
  startingBalance: number;
  cashBalance: number;
  equity: number;
  allocatedCapital: number;
  availableCapital: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  winRate: number;
  totalTradesCount: number;
  winningTradesCount: number;
  losingTradesCount: number;
  currentDrawdownPercent: number;
  maxDrawdownPercent: number;
  openPositionsCount: number;
  openRiskUsd: number;
  openRiskPercent: number;
  equityHistory: { timestamp: string; equity: number; pnl: number }[];
}

// Phase 3 Vercel AI Multi-Agent System Architecture Definitions
export interface AgentDefinition {
  id: string;
  name: string;
  nameAr: string;
  role: string;
  roleAr: string;
  enabled: boolean;
  provider: 'google' | 'openai' | 'anthropic' | 'computational';
  model: string;
  tools: string[];
  isDeterministic: boolean;
  status: 'DISCONNECTED' | 'DEMO' | 'READY_TO_CONNECT' | 'COMPUTATIONAL_ENGINE' | 'ACTIVE';
  statusAr: string;
}

export interface AgentToolCallRecord {
  name: string;
  timestamp: string;
  input?: any;
  outputSummary?: string;
  durationMs?: number;
}

export interface AgentRunRecord {
  id: string;
  analysisSessionId: string;
  parentRunId?: string;
  agentId: string;
  agentName: string;
  symbol: string;
  provider: string;
  model: string;
  actualModel: string;
  status: 'QUEUED' | 'RUNNING' | 'CALLING_TOOL' | 'REVIEWING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
  startedAt: string;
  completedAt?: string;
  latencyMs: number;
  inputSummary: string;
  structuredOutput?: any;
  errorCode?: string;
  errorMessage?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  promptVersion: string;
  toolsUsed: AgentToolCallRecord[];
}

export interface AIObservabilitySummary {
  todayRequests: number;
  todayTokens: number;
  todayCostUsd: number;
  avgLatencyMs: number;
  successRatePercent: number;
  activeSessionsCount: number;
  totalErrorsCount: number;
  perAgentStats: Record<string, {
    runsCount: number;
    tokens: number;
    costUsd: number;
    avgLatencyMs: number;
    successRate: number;
  }>;
  perModelStats: Record<string, {
    callsCount: number;
    tokens: number;
    costUsd: number;
  }>;
}

export interface AgentRun {
  id: string;
  agentId: string;
  sessionId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AgentResult {
  agentId: string;
  status: string;
  summary: string;
  data?: any;
}

