import fs from 'fs';
import path from 'path';
import { 
  AgentProfile, 
  AgentRunRecord,
  AnalysisSession, 
  BacktestResult, 
  MarketTicker, 
  PaperOrder, 
  PaperPosition, 
  SystemEvent, 
  TradeRecord, 
  TradingStrategy, 
  UserSettings 
} from '../src/types/index.js';
import { MarketSnapshotRecord } from './db/interfaces.js';

export interface NexusDatabaseSchema {
  settings: UserSettings;
  agents: AgentProfile[];
  tickers: MarketTicker[];
  positions: PaperPosition[];
  orders: PaperOrder[];
  tradeLedger: TradeRecord[];
  analysisSessions: AnalysisSession[];
  strategies: TradingStrategy[];
  backtests: BacktestResult[];
  systemEvents: SystemEvent[];
  equityHistory: { timestamp: string; equity: number; pnl: number }[];
  agentRuns: AgentRunRecord[];
  marketSnapshots: MarketSnapshotRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nexus_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultAgents: AgentProfile[] = [
  {
    id: 'agent-supervisor',
    name: 'Supervisor / CIO Agent',
    role: 'Chief Investment Officer & Multi-Agent Orchestrator',
    weight: 0,
    model: 'gemini-3.8-flash',
    status: 'IDLE',
    tasksCompleted: 142,
    tasksFailed: 1,
    avgLatencyMs: 640,
    tokensUsed: 284500,
    estimatedCostUsd: 0.142,
    avgConfidence: 81,
    lastActive: new Date().toISOString(),
    lastResult: 'Candidate LONG proposal compiled for BTC/USDT'
  },
  {
    id: 'agent-technical',
    name: 'Technical Analysis Agent',
    role: 'Multi-Timeframe Momentum, Moving Averages, Volatility',
    weight: 25,
    model: 'gemini-3.8-flash',
    status: 'IDLE',
    tasksCompleted: 215,
    tasksFailed: 0,
    avgLatencyMs: 410,
    tokensUsed: 198000,
    estimatedCostUsd: 0.099,
    avgConfidence: 84,
    lastActive: new Date().toISOString(),
    lastResult: 'RSI Bullish Divergence on 1H; EMA 20/50 Golden Cross'
  },
  {
    id: 'agent-market-structure',
    name: 'Market Structure Agent',
    role: 'Swing Points, Break of Structure, Liquidity Pools & Order Blocks',
    weight: 20,
    model: 'gemini-3.8-flash',
    status: 'IDLE',
    tasksCompleted: 210,
    tasksFailed: 0,
    avgLatencyMs: 380,
    tokensUsed: 175000,
    estimatedCostUsd: 0.088,
    avgConfidence: 79,
    lastActive: new Date().toISOString(),
    lastResult: 'Confirmed Higher-High structure breakout above $64,200 demand flip'
  },
  {
    id: 'agent-quant',
    name: 'Quantitative Agent',
    role: 'Statistical Probabilities, Volatility Distribution, Rolling Sharpe',
    weight: 15,
    model: 'gemini-3.8-flash',
    status: 'IDLE',
    tasksCompleted: 198,
    tasksFailed: 2,
    avgLatencyMs: 320,
    tokensUsed: 142000,
    estimatedCostUsd: 0.071,
    avgConfidence: 76,
    lastActive: new Date().toISOString(),
    lastResult: 'Probability distribution: Up 68%, Range 22%, Down 10%'
  },
  {
    id: 'agent-news',
    name: 'News Intelligence Agent',
    role: 'Crypto Catalysts, Macro Releases, Regulatory & Institutional Flow',
    weight: 10,
    model: 'gemini-3.8-flash',
    status: 'IDLE',
    tasksCompleted: 185,
    tasksFailed: 0,
    avgLatencyMs: 450,
    tokensUsed: 160000,
    estimatedCostUsd: 0.080,
    avgConfidence: 72,
    lastActive: new Date().toISOString(),
    lastResult: 'High institutional net inflows reported via spot ETFs'
  },
  {
    id: 'agent-sentiment',
    name: 'Sentiment Agent',
    role: 'Fear & Greed Index, Funding Rates, Long/Short Ratio, Open Interest',
    weight: 10,
    model: 'gemini-3.8-flash',
    status: 'IDLE',
    tasksCompleted: 204,
    tasksFailed: 0,
    avgLatencyMs: 290,
    tokensUsed: 110000,
    estimatedCostUsd: 0.055,
    avgConfidence: 75,
    lastActive: new Date().toISOString(),
    lastResult: 'Funding rates neutral at +0.008%, no crowded long squeeze risk'
  },
  {
    id: 'agent-onchain',
    name: 'On-Chain Agent',
    role: 'Exchange Reserves, Whale Accumulation, Stablecoin Dominance',
    weight: 10,
    model: 'gemini-3.8-flash',
    status: 'IDLE',
    tasksCompleted: 172,
    tasksFailed: 1,
    avgLatencyMs: 490,
    tokensUsed: 130000,
    estimatedCostUsd: 0.065,
    avgConfidence: 78,
    lastActive: new Date().toISOString(),
    lastResult: 'Net exchange outflow: 4,200 BTC moved to cold custody'
  },
  {
    id: 'agent-macro',
    name: 'Macro Agent',
    role: 'DXY Dollar Index, Treasury Yields, Risk-On/Risk-Off Regime',
    weight: 10,
    model: 'gemini-3.8-flash',
    status: 'IDLE',
    tasksCompleted: 160,
    tasksFailed: 0,
    avgLatencyMs: 360,
    tokensUsed: 98000,
    estimatedCostUsd: 0.049,
    avgConfidence: 70,
    lastActive: new Date().toISOString(),
    lastResult: 'DXY softening below 103.8; broad liquidity supportive'
  },
  {
    id: 'agent-risk',
    name: 'Risk Manager Agent',
    role: 'Contextual Drawdown Risk, Position Concentration & Slippage Assessment',
    weight: 0,
    model: 'gemini-3.8-flash',
    status: 'IDLE',
    tasksCompleted: 195,
    tasksFailed: 0,
    avgLatencyMs: 260,
    tokensUsed: 89000,
    estimatedCostUsd: 0.045,
    avgConfidence: 90,
    lastActive: new Date().toISOString(),
    lastResult: 'Contextual risk: APPROVED. Recommend standard 1.0% risk sizing'
  },
  {
    id: 'agent-trade-review',
    name: 'Trade Review Agent',
    role: 'Post-Trade Post-Mortem, Root Cause Diagnostics & Strategic Lessons',
    weight: 0,
    model: 'gemini-3.8-flash',
    status: 'IDLE',
    tasksCompleted: 68,
    tasksFailed: 0,
    avgLatencyMs: 510,
    tokensUsed: 95000,
    estimatedCostUsd: 0.048,
    avgConfidence: 88,
    lastActive: new Date().toISOString(),
    lastResult: 'Stored lesson: Respect 4H support levels during consolidation'
  }
];

const initialTickers: MarketTicker[] = [
  {
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    price: 64850.00,
    change24h: 3.42,
    high24h: 65420.00,
    low24h: 62710.00,
    volume24h: 2845012000,
    trend: 'BULLISH',
    marketRegime: 'BREAKOUT',
    aiScore: 84,
    riskLevel: 'LOW',
    lastUpdated: new Date().toISOString(),
    isDemo: false
  },
  {
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    price: 3480.50,
    change24h: 2.15,
    high24h: 3530.00,
    low24h: 3390.00,
    volume24h: 1420800000,
    trend: 'BULLISH',
    marketRegime: 'BULL_TREND',
    aiScore: 78,
    riskLevel: 'MEDIUM',
    lastUpdated: new Date().toISOString(),
    isDemo: false
  },
  {
    symbol: 'SOL/USDT',
    name: 'Solana',
    price: 152.40,
    change24h: 5.68,
    high24h: 156.80,
    low24h: 144.10,
    volume24h: 890400000,
    trend: 'BULLISH',
    marketRegime: 'BREAKOUT',
    aiScore: 86,
    riskLevel: 'MEDIUM',
    lastUpdated: new Date().toISOString(),
    isDemo: false
  },
  {
    symbol: 'BNB/USDT',
    name: 'BNB',
    price: 585.20,
    change24h: -0.45,
    high24h: 594.00,
    low24h: 580.10,
    volume24h: 340000000,
    trend: 'NEUTRAL',
    marketRegime: 'RANGE',
    aiScore: 54,
    riskLevel: 'LOW',
    lastUpdated: new Date().toISOString(),
    isDemo: false
  },
  {
    symbol: 'AVAX/USDT',
    name: 'Avalanche',
    price: 28.90,
    change24h: 4.12,
    high24h: 29.80,
    low24h: 27.50,
    volume24h: 210000000,
    trend: 'BULLISH',
    marketRegime: 'BULL_TREND',
    aiScore: 72,
    riskLevel: 'MEDIUM',
    lastUpdated: new Date().toISOString(),
    isDemo: false
  },
  {
    symbol: 'LINK/USDT',
    name: 'Chainlink',
    price: 12.85,
    change24h: 1.80,
    high24h: 13.20,
    low24h: 12.40,
    volume24h: 145000000,
    trend: 'BULLISH',
    marketRegime: 'RANGE',
    aiScore: 69,
    riskLevel: 'LOW',
    lastUpdated: new Date().toISOString(),
    isDemo: false
  },
  {
    symbol: 'XRP/USDT',
    name: 'Ripple',
    price: 2.15,
    change24h: -0.80,
    high24h: 2.22,
    low24h: 2.08,
    volume24h: 980000000,
    trend: 'NEUTRAL',
    marketRegime: 'RANGE',
    aiScore: 65,
    riskLevel: 'MEDIUM',
    lastUpdated: new Date().toISOString(),
    isDemo: false
  },
  {
    symbol: 'ADA/USDT',
    name: 'Cardano',
    price: 0.72,
    change24h: 1.45,
    high24h: 0.75,
    low24h: 0.69,
    volume24h: 240000000,
    trend: 'BULLISH',
    marketRegime: 'RANGE',
    aiScore: 68,
    riskLevel: 'LOW',
    lastUpdated: new Date().toISOString(),
    isDemo: false
  },
  {
    symbol: 'DOGE/USDT',
    name: 'Dogecoin',
    price: 0.18,
    change24h: -1.20,
    high24h: 0.195,
    low24h: 0.174,
    volume24h: 420000000,
    trend: 'BEARISH',
    marketRegime: 'HIGH_VOLATILITY',
    aiScore: 58,
    riskLevel: 'HIGH',
    lastUpdated: new Date().toISOString(),
    isDemo: false
  }
];

const initialStrategies: TradingStrategy[] = [
  {
    id: 'strat-nexus-momentum',
    name: 'Nexus Multi-Agent Trend Confirmation v2.4',
    description: 'Autonomous multi-timeframe breakout confirmation filtering for liquidity grabs and volume expansion.',
    version: '2.4.0',
    status: 'APPROVED',
    assets: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    timeframes: ['15m', '1h', '4h'],
    indicators: ['EMA 20/50/200', 'RSI 14', 'ATR 14', 'Volume Profile'],
    entryConditions: 'Price closes above 20 EMA with 1H RSI > 55, Market Structure BOS confirmed, and Technical + Structure score > 75%',
    exitConditions: 'Trailing stop behind 20 EMA or full take-profit at TP3 (3.5x risk/reward)',
    riskSettings: {
      maxRiskPerTradePercent: 1.0,
      minRiskReward: 1.8,
      stopLossAtrMultiplier: 1.5
    },
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-09-01T15:30:00Z',
    stats: {
      totalTrades: 48,
      winRate: 64.6,
      profitFactor: 2.38,
      netProfit: 14280.50,
      sharpeRatio: 1.94,
      maxDrawdown: 4.8
    }
  },
  {
    id: 'strat-mean-reversion',
    name: 'Statistical Mean Reversion & Liquidity Sweep v1.2',
    description: 'Fades overextended moves when price sweeps key session highs/lows with RSI divergence in ranging regimes.',
    version: '1.2.1',
    status: 'PAPER',
    assets: ['ETH/USDT', 'SOL/USDT', 'AVAX/USDT'],
    timeframes: ['5m', '15m', '1h'],
    indicators: ['Bollinger Bands 20,2', 'RSI 14', 'Z-Score Price', 'ADX'],
    entryConditions: 'Z-score > 2.2 outside outer Bollinger Band with ADX < 20 and bearish divergence',
    exitConditions: 'Touch of Bollinger Band midline or fixed 1.5 R:R',
    riskSettings: {
      maxRiskPerTradePercent: 0.8,
      minRiskReward: 1.5,
      stopLossAtrMultiplier: 1.2
    },
    createdAt: '2026-08-20T12:00:00Z',
    updatedAt: '2026-09-05T08:00:00Z',
    stats: {
      totalTrades: 24,
      winRate: 58.3,
      profitFactor: 1.72,
      netProfit: 5420.00,
      sharpeRatio: 1.45,
      maxDrawdown: 5.2
    }
  },
  {
    id: 'strat-quant-breakout',
    name: 'Deep Liquidity Volatility Breakout (Experimental)',
    description: 'AI-generated strategy targeting high open-interest compression phases with volatility expansion.',
    version: '0.9.0-alpha',
    status: 'DRAFT',
    assets: ['SOL/USDT', 'AVAX/USDT'],
    timeframes: ['1h', '4h'],
    indicators: ['Keltner Channels', 'Bollinger Bands', 'Funding Rate', 'Open Interest'],
    entryConditions: 'Squeeze duration > 48 hours + aggressive funding rate delta',
    exitConditions: 'Trailing stop 2.0 ATR',
    riskSettings: {
      maxRiskPerTradePercent: 0.5,
      minRiskReward: 2.0,
      stopLossAtrMultiplier: 2.0
    },
    createdAt: '2026-09-06T18:00:00Z',
    updatedAt: '2026-09-07T11:00:00Z'
  }
];

const initialTrades: TradeRecord[] = [
  {
    id: 'TR-20260906-084',
    accountId: 'PAPER-ACC-01',
    asset: 'BTC/USDT',
    exchange: 'PAPER_SIMULATOR',
    mode: 'PAPER',
    direction: 'LONG',
    strategyName: 'Nexus Multi-Agent Trend Confirmation v2.4',
    entryDate: '2026-09-06T09:15:00Z',
    entryPrice: 62450.00,
    exitDate: '2026-09-06T18:40:00Z',
    exitPrice: 64200.00,
    quantity: 0.85,
    notionalValue: 53082.50,
    stopLoss: 61400.00,
    takeProfit: 64200.00,
    grossPnL: 1487.50,
    fees: 31.85,
    slippage: 12.50,
    netPnL: 1443.15,
    netPnLPercent: 2.72,
    riskAmount: 892.50,
    riskPercent: 0.90,
    riskRewardRatio: 1.67,
    durationMinutes: 565,
    exitReason: 'TAKE_PROFIT',
    supervisorConfidence: 82,
    marketRegime: 'BULL_TREND',
    analysisSessionId: 'AN-20260906-0041',
    agentVotes: [
      { agentId: 'agent-technical', signal: 'BULLISH', confidence: 85 },
      { agentId: 'agent-market-structure', signal: 'BULLISH', confidence: 80 },
      { agentId: 'agent-quant', signal: 'BULLISH', confidence: 75 },
      { agentId: 'agent-news', signal: 'NEUTRAL', confidence: 60 },
      { agentId: 'agent-sentiment', signal: 'BULLISH', confidence: 72 },
      { agentId: 'agent-onchain', signal: 'BULLISH', confidence: 79 },
      { agentId: 'agent-macro', signal: 'BULLISH', confidence: 68 }
    ],
    originalThesis: 'Breakout above 4H descending channel accompanied by bullish volume divergence and spot ETF inflows.',
    postTradeReview: {
      reviewedAt: '2026-09-06T19:00:00Z',
      thesisAccuracy: 'CORRECT',
      whatWorked: [
        'Accurate identification of the 4H range flip at $62,400',
        'Stop placement safely below consolidation low gave sufficient breathing room',
        'Take profit level hit smoothly with minimal adverse excursion'
      ],
      whatFailed: [
        'Slightly conservative TP2 could have captured additional upside to $64,800'
      ],
      agentErrors: [
        'News Agent lagged by 15 minutes before acknowledging institutional spot volume'
      ],
      lessonProposal: 'When on-chain outflows match market structure breakouts, widen trailing stop distance by 0.3 ATR.'
    }
  },
  {
    id: 'TR-20260905-081',
    accountId: 'PAPER-ACC-01',
    asset: 'ETH/USDT',
    exchange: 'PAPER_SIMULATOR',
    mode: 'PAPER',
    direction: 'SHORT',
    strategyName: 'Statistical Mean Reversion & Liquidity Sweep v1.2',
    entryDate: '2026-09-05T14:10:00Z',
    entryPrice: 3510.00,
    exitDate: '2026-09-05T16:25:00Z',
    exitPrice: 3435.00,
    quantity: 8.5,
    notionalValue: 29835.00,
    stopLoss: 3560.00,
    takeProfit: 3435.00,
    grossPnL: 637.50,
    fees: 17.90,
    slippage: 6.20,
    netPnL: 613.40,
    netPnLPercent: 2.06,
    riskAmount: 425.00,
    riskPercent: 0.43,
    riskRewardRatio: 1.50,
    durationMinutes: 135,
    exitReason: 'TAKE_PROFIT',
    supervisorConfidence: 77,
    marketRegime: 'RANGE',
    analysisSessionId: 'AN-20260905-0032',
    agentVotes: [
      { agentId: 'agent-technical', signal: 'BEARISH', confidence: 78 },
      { agentId: 'agent-market-structure', signal: 'BEARISH', confidence: 76 },
      { agentId: 'agent-quant', signal: 'BEARISH', confidence: 74 },
      { agentId: 'agent-sentiment', signal: 'BEARISH', confidence: 70 }
    ],
    originalThesis: 'Swept local range high at $3,510 with double top and 15m bearish RSI divergence.',
    postTradeReview: {
      reviewedAt: '2026-09-05T17:00:00Z',
      thesisAccuracy: 'CORRECT',
      whatWorked: [
        'Fast execution at range boundary',
        'Clean reversion to value area midpoint'
      ],
      whatFailed: [],
      agentErrors: [],
      lessonProposal: 'Mean reversion setups in RANGE regime exhibit highest Sharpe when executed before US market open.'
    }
  },
  {
    id: 'TR-20260904-076',
    accountId: 'PAPER-ACC-01',
    asset: 'SOL/USDT',
    exchange: 'PAPER_SIMULATOR',
    mode: 'PAPER',
    direction: 'LONG',
    strategyName: 'Nexus Multi-Agent Trend Confirmation v2.4',
    entryDate: '2026-09-04T11:00:00Z',
    entryPrice: 148.20,
    exitDate: '2026-09-04T13:45:00Z',
    exitPrice: 144.50,
    quantity: 110.0,
    notionalValue: 16302.00,
    stopLoss: 144.50,
    takeProfit: 155.00,
    grossPnL: -407.00,
    fees: 9.78,
    slippage: 4.80,
    netPnL: -421.58,
    netPnLPercent: -2.59,
    riskAmount: 407.00,
    riskPercent: 0.42,
    riskRewardRatio: 1.84,
    durationMinutes: 165,
    exitReason: 'STOP_LOSS',
    supervisorConfidence: 74,
    marketRegime: 'HIGH_VOLATILITY',
    analysisSessionId: 'AN-20260904-0019',
    agentVotes: [
      { agentId: 'agent-technical', signal: 'BULLISH', confidence: 79 },
      { agentId: 'agent-market-structure', signal: 'BULLISH', confidence: 72 },
      { agentId: 'agent-quant', signal: 'NEUTRAL', confidence: 55 },
      { agentId: 'agent-risk', signal: 'BULLISH', confidence: 68 }
    ],
    originalThesis: 'Attempted long continuation on SOL following ecosystem conference announcements.',
    postTradeReview: {
      reviewedAt: '2026-09-04T14:30:00Z',
      thesisAccuracy: 'FAILED',
      whatWorked: [
        'Strict stop loss prevented deeper cascade down to $139'
      ],
      whatFailed: [
        'Failed to observe sudden BTC pullback dragging altcoin beta down'
      ],
      agentErrors: [
        'Quant Agent warned of high market correlation beta (0.88), but Supervisor discounted it'
      ],
      lessonProposal: 'Ensure altcoin long setups check BTC market structure regime before triggering execution.'
    }
  }
];

const initialPositions: PaperPosition[] = [
  {
    id: 'POS-BTC-20260907-01',
    asset: 'BTC/USDT',
    direction: 'LONG',
    entryPrice: 63800.00,
    currentPrice: 64850.00,
    quantity: 0.78,
    notionalValue: 50583.00,
    stopLoss: 62400.00,
    takeProfitLevels: [
      { level: 1, price: 65500.00, percentage: 33 },
      { level: 2, price: 66800.00, percentage: 33 },
      { level: 3, price: 68500.00, percentage: 34 }
    ],
    takeProfit: 66800.00,
    unrealizedPnL: 819.00,
    unrealizedPnLPercent: 1.64,
    allocatedCapital: 49764.00,
    riskAmount: 1092.00,
    riskPercent: 1.05,
    riskRewardRatio: 2.14,
    strategyId: 'strat-nexus-momentum',
    strategyName: 'Nexus Multi-Agent Trend Confirmation v2.4',
    supervisorConfidence: 84,
    openedAt: '2026-09-07T08:20:00Z',
    lastUpdated: new Date().toISOString(),
    analysisSessionId: 'AN-20260907-0012',
    distanceToStopPercent: 3.78,
    distanceToTargetPercent: 3.01
  },
  {
    id: 'POS-SOL-20260907-02',
    asset: 'SOL/USDT',
    direction: 'LONG',
    entryPrice: 147.50,
    currentPrice: 152.40,
    quantity: 120.0,
    notionalValue: 18288.00,
    stopLoss: 143.80,
    takeProfitLevels: [
      { level: 1, price: 155.00, percentage: 50 },
      { level: 2, price: 162.00, percentage: 50 }
    ],
    takeProfit: 158.50,
    unrealizedPnL: 588.00,
    unrealizedPnLPercent: 3.32,
    allocatedCapital: 17700.00,
    riskAmount: 444.00,
    riskPercent: 0.43,
    riskRewardRatio: 2.97,
    strategyId: 'strat-nexus-momentum',
    strategyName: 'Nexus Multi-Agent Trend Confirmation v2.4',
    supervisorConfidence: 86,
    openedAt: '2026-09-07T10:15:00Z',
    lastUpdated: new Date().toISOString(),
    analysisSessionId: 'AN-20260907-0018',
    distanceToStopPercent: 5.64,
    distanceToTargetPercent: 4.00
  }
];

const initialOrders: PaperOrder[] = [
  {
    id: 'ORD-20260907-001',
    asset: 'BTC/USDT',
    side: 'BUY',
    type: 'MARKET',
    price: 63800.00,
    quantity: 0.78,
    notional: 49764.00,
    status: 'FILLED',
    createdAt: '2026-09-07T08:19:58Z',
    filledAt: '2026-09-07T08:20:00Z',
    stopLoss: 62400.00,
    takeProfit: 66800.00,
    fees: 29.85,
    slippage: 12.40,
    analysisSessionId: 'AN-20260907-0012'
  },
  {
    id: 'ORD-20260907-002',
    asset: 'SOL/USDT',
    side: 'BUY',
    type: 'MARKET',
    price: 147.50,
    quantity: 120.0,
    notional: 17700.00,
    status: 'FILLED',
    createdAt: '2026-09-07T10:14:58Z',
    filledAt: '2026-09-07T10:15:00Z',
    stopLoss: 143.80,
    takeProfit: 158.50,
    fees: 10.62,
    slippage: 3.50,
    analysisSessionId: 'AN-20260907-0018'
  },
  {
    id: 'ORD-20260907-003',
    asset: 'ETH/USDT',
    side: 'BUY',
    type: 'LIMIT',
    price: 3380.00,
    quantity: 5.0,
    notional: 16900.00,
    status: 'OPEN',
    createdAt: '2026-09-07T12:00:00Z',
    stopLoss: 3310.00,
    takeProfit: 3520.00,
    fees: 0,
    slippage: 0,
    reason: 'Pullback limit order awaiting demand retest'
  }
];

const initialBacktest: BacktestResult = {
  id: 'BT-20260901-01',
  strategyId: 'strat-nexus-momentum',
  strategyName: 'Nexus Multi-Agent Trend Confirmation v2.4',
  asset: 'BTC/USDT',
  timeframe: '1h',
  startDate: '2026-03-01',
  endDate: '2026-09-01',
  initialCapital: 100000,
  finalEquity: 142850.50,
  totalReturnPercent: 42.85,
  netProfit: 42850.50,
  winRate: 65.2,
  lossRate: 34.8,
  profitFactor: 2.41,
  sharpeRatio: 2.15,
  sortinoRatio: 3.08,
  maxDrawdown: 5.8,
  averageWin: 1140.00,
  averageLoss: -480.00,
  bestTrade: 4250.00,
  worstTrade: -950.00,
  totalTrades: 72,
  averageTradeDuration: '14.2 hours',
  expectancy: 595.14,
  equityCurve: [
    { time: '2026-03-01', equity: 100000, drawdown: 0 },
    { time: '2026-04-01', equity: 106400, drawdown: 1.2 },
    { time: '2026-05-01', equity: 112800, drawdown: 2.4 },
    { time: '2026-06-01', equity: 120500, drawdown: 1.8 },
    { time: '2026-07-01', equity: 128900, drawdown: 4.2 },
    { time: '2026-08-01', equity: 136200, drawdown: 2.1 },
    { time: '2026-09-01', equity: 142850, drawdown: 0.8 }
  ],
  monthlyReturns: [
    { month: 'Mar 2026', returnPercent: 6.4 },
    { month: 'Apr 2026', returnPercent: 6.0 },
    { month: 'May 2026', returnPercent: 6.8 },
    { month: 'Jun 2026', returnPercent: 7.0 },
    { month: 'Jul 2026', returnPercent: 5.6 },
    { month: 'Aug 2026', returnPercent: 4.9 }
  ],
  trades: [
    { id: 'bt-1', date: '2026-08-28', type: 'LONG', entryPrice: 59200, exitPrice: 61800, pnl: 2600, pnlPercent: 4.39, exitReason: 'TAKE_PROFIT' },
    { id: 'bt-2', date: '2026-08-25', type: 'LONG', entryPrice: 60100, exitPrice: 59400, pnl: -700, pnlPercent: -1.16, exitReason: 'STOP_LOSS' },
    { id: 'bt-3', date: '2026-08-21', type: 'SHORT', entryPrice: 61400, exitPrice: 59800, pnl: 1600, pnlPercent: 2.61, exitReason: 'TAKE_PROFIT' },
    { id: 'bt-4', date: '2026-08-18', type: 'LONG', entryPrice: 58900, exitPrice: 61200, pnl: 2300, pnlPercent: 3.90, exitReason: 'TAKE_PROFIT' }
  ]
};

const initialEvents: SystemEvent[] = [
  {
    id: 'EVT-001',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: 'SCANNER',
    severity: 'INFO',
    source: 'Market Scanner',
    asset: 'BTC/USDT',
    message: 'Scanner detected abnormal 1H volume spike +280% on BTC/USDT'
  },
  {
    id: 'EVT-002',
    timestamp: new Date(Date.now() - 3600000 * 3.8).toISOString(),
    type: 'SUPERVISOR',
    severity: 'INFO',
    source: 'Supervisor Agent',
    asset: 'BTC/USDT',
    message: 'Analysis session AN-20260907-0012 instantiated. Delegating to 7 specialist agents.'
  },
  {
    id: 'EVT-003',
    timestamp: new Date(Date.now() - 3600000 * 3.6).toISOString(),
    type: 'AGENT',
    severity: 'SUCCESS',
    source: 'Technical Agent',
    asset: 'BTC/USDT',
    message: 'Technical Agent generated BULLISH signal (Confidence 85%). EMA golden cross confirmed.'
  },
  {
    id: 'EVT-004',
    timestamp: new Date(Date.now() - 3600000 * 3.4).toISOString(),
    type: 'RISK',
    severity: 'SUCCESS',
    source: 'Deterministic Risk Engine',
    asset: 'BTC/USDT',
    message: 'Deterministic Risk Engine APPROVED candidate trade. Risk: 1.05%, R:R: 2.14.'
  },
  {
    id: 'EVT-005',
    timestamp: new Date(Date.now() - 3600000 * 3.3).toISOString(),
    type: 'ORDER',
    severity: 'SUCCESS',
    source: 'Paper Execution Engine',
    asset: 'BTC/USDT',
    message: 'Paper Market Order ORD-20260907-001 FILLED: 0.78 BTC @ $63,800.00'
  },
  {
    id: 'EVT-006',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    type: 'TRADE',
    severity: 'INFO',
    source: 'Live Position Monitor',
    asset: 'BTC/USDT',
    message: 'BTC/USDT open position in profit: +$819.00 (+1.64%). Approaching TP1 level.'
  }
];

const initialSettings: UserSettings = {
  initialPaperBalance: 100000,
  currentCashBalance: 32536.00,
  riskSettings: {
    riskPerTradePercent: 1.0,
    maxDailyLossPercent: 3.0,
    maxPortfolioDrawdownPercent: 10.0,
    maxOpenPositions: 5,
    minimumRiskReward: 1.5,
    maxAssetExposurePercent: 20.0,
    maxConsecutiveLosses: 3,
    tradingFeePercent: 0.06,
    simulatedSlippagePercent: 0.05,
    isLiveTradingLocked: true
  },
  agentWeights: {
    technical: 25,
    marketStructure: 20,
    quant: 15,
    news: 10,
    sentiment: 10,
    onChain: 10,
    macro: 10
  },
  models: {
    supervisorModel: 'gemini-3.8-flash',
    analyticalModel: 'gemini-3.8-flash',
    fastModel: 'gemini-3.8-flash'
  },
  aiBudgetUsd: 50.00,
  aiBudgetUsedUsd: 0.84,
  scannerIntervalSeconds: 8,
  scannerActive: true,
  agentsActive: true,
  systemPaused: false,
  theme: 'dark',
  language: 'ar',
  dataMode: 'LIVE',
  shadowMode: true,
  autoPaperTrading: false,
  aiBudgetDailyUsd: 25.00,
  aiBudgetUsedTodayUsd: 0.12,
  maxAnalysesPerHour: 20,
  maxParallelAgents: 4
};

const initialSessions: AnalysisSession[] = [
  {
    id: 'AN-20260907-0012',
    asset: 'BTC/USDT',
    startTime: '2026-09-07T08:18:00Z',
    completedAt: '2026-09-07T08:19:55Z',
    status: 'COMPLETED',
    triggerEvent: 'Volume expansion + Break of 4H resistance ($63,800)',
    marketSnapshot: {
      price: 63800.00,
      change24h: 3.10,
      volume24h: 2750000000,
      trend: 'BULLISH',
      marketRegime: 'BREAKOUT',
      indicators: {
        rsi: 63.4,
        adx: 28.5,
        atr: 1120.0
      }
    },
    disagreementsDetected: false,
    agentReports: [
      {
        agentId: 'agent-technical',
        agentName: 'Technical Analysis Agent',
        asset: 'BTC/USDT',
        timestamp: '2026-09-07T08:18:30Z',
        timeframe: '1h/4h',
        signal: 'BULLISH',
        confidence: 85,
        evidence: [
          'RSI at 63.4 entering strong momentum zone without divergence',
          'EMA 20 > EMA 50 > EMA 200 stack confirmed on 1H and 4H charts',
          'VWAP holding strongly above session open with positive slope'
        ],
        risks: ['ATR elevated at 1,120 suggesting wider stop required'],
        dataSources: ['1H OHLCV', '4H OHLCV', 'Binance Live Ticker'],
        dataFreshness: 'LIVE',
        summary: 'Decisive bullish moving average alignment with positive momentum accumulation.'
      },
      {
        agentId: 'agent-market-structure',
        agentName: 'Market Structure Agent',
        asset: 'BTC/USDT',
        timestamp: '2026-09-07T08:18:45Z',
        timeframe: '4h',
        signal: 'BULLISH',
        confidence: 82,
        evidence: [
          'Break of Structure (BOS) above swing high $63,600 confirmed on 4H close',
          'Demand zone established between $62,400 - $62,900',
          'Clean liquidity void above up to $66,800 resistance'
        ],
        risks: ['Potential liquidity sweep pullback into demand block before continuation'],
        dataSources: ['Order Flow Cluster', '4H Swing Map'],
        dataFreshness: 'LIVE',
        summary: 'BOS confirmed with clean institutional demand block established beneath price.'
      },
      {
        agentId: 'agent-quant',
        agentName: 'Quantitative Agent',
        asset: 'BTC/USDT',
        timestamp: '2026-09-07T08:19:00Z',
        timeframe: 'Multi',
        signal: 'BULLISH',
        confidence: 78,
        evidence: [
          'Rolling 30-day Sharpe ratio expanded to 2.14',
          'Monte Carlo 24h probability: 68% Up, 22% Range, 10% Down',
          'Volatility skew favored positive tail distribution'
        ],
        risks: ['Intraday kurtosis shows modest tail risk'],
        dataSources: ['Historical Return Series', 'GARCH Volatility Model'],
        dataFreshness: 'LIVE',
        summary: 'Positive expected value with 68% probability of upward continuation.'
      },
      {
        agentId: 'agent-sentiment',
        agentName: 'Sentiment Agent',
        asset: 'BTC/USDT',
        timestamp: '2026-09-07T08:19:15Z',
        timeframe: 'Realtime',
        signal: 'BULLISH',
        confidence: 76,
        evidence: [
          'Perpetual funding rate healthy at +0.008% (not overheated)',
          'Long/Short ratio balanced at 1.12',
          'Fear & Greed index at 64 (Greed, but not extreme mania)'
        ],
        risks: ['Open interest creeping up towards weekly highs'],
        dataSources: ['Coinglass Derivatives Feed', 'Fear & Greed Index'],
        dataFreshness: 'LIVE',
        summary: 'Derivatives positioning remains healthy with no imminent long liquidation cascade danger.'
      },
      {
        agentId: 'agent-risk',
        agentName: 'Risk Manager Agent',
        asset: 'BTC/USDT',
        timestamp: '2026-09-07T08:19:35Z',
        timeframe: 'Portfolio',
        signal: 'BULLISH',
        confidence: 88,
        evidence: [
          'Stop distance of $1,400 aligns with 1.25x ATR',
          'Proposed risk: 1.05% of account ($1,092)',
          'Portfolio correlation currently clean with minimal altcoin exposure'
        ],
        risks: ['Daily loss threshold must not exceed $3,000 if stopped out'],
        dataSources: ['Portfolio Risk Matrix'],
        dataFreshness: 'LIVE',
        summary: 'Recommendation: APPROVED. Risk/Reward ratio of 2.14 exceeds minimum requirement.'
      }
    ],
    candidateTrade: {
      asset: 'BTC/USDT',
      direction: 'LONG',
      confidence: 84,
      marketRegime: 'BREAKOUT',
      currentPrice: 63800.00,
      entryLow: 63700.00,
      entryHigh: 63900.00,
      suggestedEntry: 63800.00,
      stopLoss: 62400.00,
      takeProfits: [
        { level: 1, price: 65500.00, percentage: 33 },
        { level: 2, price: 66800.00, percentage: 33 },
        { level: 3, price: 68500.00, percentage: 34 }
      ],
      riskRewardRatio: 2.14,
      timeHorizon: '12-36 hours',
      supportingReasons: [
        'Confirmed Break of Structure on 4H above $63,600',
        'Multi-timeframe EMA alignment (20/50/200)',
        'Derivatives funding rate uncrowded at +0.008%',
        '68% quantitative upside probability model'
      ],
      opposingReasons: [
        'High ATR means wider stop loss and reduced leverage sizing',
        'DXY testing local support levels'
      ],
      agentVotes: [
        { agentId: 'agent-technical', agentName: 'Technical Analysis', signal: 'BULLISH', weight: 25, confidence: 85 },
        { agentId: 'agent-market-structure', agentName: 'Market Structure', signal: 'BULLISH', weight: 20, confidence: 82 },
        { agentId: 'agent-quant', agentName: 'Quantitative', signal: 'BULLISH', weight: 15, confidence: 78 },
        { agentId: 'agent-sentiment', agentName: 'Sentiment', signal: 'BULLISH', weight: 10, confidence: 76 }
      ],
      supervisorSummary: 'Strong consensus across Technical, Structure, and Quant agents. Favorable 2.14 R:R above clean breakout point.',
      dataTimestamp: '2026-09-07T08:19:50Z'
    },
    riskDecision: {
      asset: 'BTC/USDT',
      approved: true,
      status: 'APPROVED',
      reasons: ['Risk/Reward 2.14 >= 1.50', 'Risk per trade 1.05% <= 1.00% (+ tolerance)', 'Daily loss within limits', 'Open positions count 2 < 5'],
      failedRules: [],
      suggestedPositionSizeUsd: 49764.00,
      suggestedQuantity: 0.78,
      calculatedRiskUsd: 1092.00,
      riskPercentage: 1.05,
      riskRewardRatio: 2.14,
      accountEquity: 104500.00,
      timestamp: '2026-09-07T08:19:55Z',
      ruleChecks: [
        { rule: 'Risk Per Trade', passed: true, value: '1.05%', threshold: '<= 1.0%' },
        { rule: 'Minimum Risk/Reward', passed: true, value: '2.14', threshold: '>= 1.50' },
        { rule: 'Max Open Positions', passed: true, value: '2', threshold: '<= 5' },
        { rule: 'Max Daily Loss Limit', passed: true, value: '$0.00', threshold: '<= $3,000' },
        { rule: 'Max Asset Exposure', passed: true, value: '47.6%', threshold: '<= 50.0%' }
      ]
    },
    tradeExecuted: true,
    orderId: 'ORD-20260907-001'
  }
];

class DatabaseService {
  private data: NexusDatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): NexusDatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          settings: parsed.settings || initialSettings,
          agents: parsed.agents || defaultAgents,
          tickers: parsed.tickers || initialTickers,
          positions: parsed.positions || initialPositions,
          orders: parsed.orders || initialOrders,
          tradeLedger: parsed.tradeLedger || initialTrades,
          analysisSessions: parsed.analysisSessions || initialSessions,
          strategies: parsed.strategies || initialStrategies,
          backtests: parsed.backtests || [initialBacktest],
          systemEvents: parsed.systemEvents || initialEvents,
          equityHistory: parsed.equityHistory || [
            { timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), equity: 100000, pnl: 0 },
            { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), equity: 101850, pnl: 1850 },
            { timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), equity: 102430, pnl: 580 },
            { timestamp: new Date().toISOString(), equity: 104840, pnl: 2410 }
          ],
          agentRuns: parsed.agentRuns || [],
          marketSnapshots: parsed.marketSnapshots || []
        };
      }
    } catch (err) {
      console.error('[DB] Failed to load DB file, initializing fresh state:', err);
    }

    const fresh: NexusDatabaseSchema = {
      settings: initialSettings,
      agents: defaultAgents,
      tickers: initialTickers,
      positions: initialPositions,
      orders: initialOrders,
      tradeLedger: initialTrades,
      analysisSessions: initialSessions,
      strategies: initialStrategies,
      backtests: [initialBacktest],
      systemEvents: initialEvents,
      equityHistory: [
        { timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), equity: 100000, pnl: 0 },
        { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), equity: 101850, pnl: 1850 },
        { timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), equity: 102430, pnl: 580 },
        { timestamp: new Date().toISOString(), equity: 104840, pnl: 2410 }
      ],
      agentRuns: [],
      marketSnapshots: []
    };
    this.saveData(fresh);
    return fresh;
  }

  private saveData(dataToSave: NexusDatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to write database to disk:', err);
    }
  }

  public getDB(): NexusDatabaseSchema {
    return this.data;
  }

  public save() {
    this.saveData(this.data);
  }

  public addAgentRun(run: AgentRunRecord): AgentRunRecord {
    this.data.agentRuns.unshift(run);
    if (this.data.agentRuns.length > 1000) {
      this.data.agentRuns = this.data.agentRuns.slice(0, 1000);
    }
    this.save();
    return run;
  }

  public updateAgentRun(id: string, updates: Partial<AgentRunRecord>): AgentRunRecord | null {
    const run = this.data.agentRuns.find(r => r.id === id);
    if (run) {
      Object.assign(run, updates);
      this.save();
      return run;
    }
    return null;
  }

  public getAgentRuns(sessionId?: string): AgentRunRecord[] {
    if (sessionId) {
      return this.data.agentRuns.filter(r => r.analysisSessionId === sessionId);
    }
    return this.data.agentRuns;
  }

  public addMarketSnapshot(snapshot: MarketSnapshotRecord): MarketSnapshotRecord {
    this.data.marketSnapshots.unshift(snapshot);
    if (this.data.marketSnapshots.length > 500) {
      this.data.marketSnapshots = this.data.marketSnapshots.slice(0, 500);
    }
    this.save();
    return snapshot;
  }

  public getMarketSnapshot(id: string): MarketSnapshotRecord | null {
    return this.data.marketSnapshots.find(s => s.id === id) || null;
  }

  public addEvent(event: Omit<SystemEvent, 'id' | 'timestamp'>) {
    const fullEvent: SystemEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.data.systemEvents.unshift(fullEvent);
    if (this.data.systemEvents.length > 500) {
      this.data.systemEvents = this.data.systemEvents.slice(0, 500);
    }
    this.save();
    return fullEvent;
  }
}

export const db = new DatabaseService();
