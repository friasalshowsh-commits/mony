-- NEXUS TRADING AI - PRODUCTION DATABASE SCHEMA (PostgreSQL / Supabase)
-- Phase 2 Architecture Blueprint

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER SETTINGS & CONFIGURATION
CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
    initial_paper_balance NUMERIC(16, 2) NOT NULL DEFAULT 100000.00,
    current_cash_balance NUMERIC(16, 2) NOT NULL DEFAULT 100000.00,
    risk_settings JSONB NOT NULL DEFAULT '{
        "riskPerTradePercent": 1.0,
        "maxDailyLossPercent": 3.0,
        "maxPortfolioDrawdownPercent": 10.0,
        "maxOpenPositions": 5,
        "minimumRiskReward": 1.5,
        "maxAssetExposurePercent": 20.0,
        "maxConsecutiveLosses": 3,
        "tradingFeePercent": 0.06,
        "simulatedSlippagePercent": 0.05,
        "isLiveTradingLocked": true
    }',
    agent_weights JSONB NOT NULL DEFAULT '{
        "technical": 25,
        "marketStructure": 20,
        "quant": 15,
        "news": 10,
        "sentiment": 10,
        "onChain": 10,
        "macro": 10
    }',
    models JSONB NOT NULL DEFAULT '{
        "supervisorModel": "gemini-2.5-flash",
        "analyticalModel": "gemini-2.5-flash",
        "fastModel": "gemini-2.5-flash"
    }',
    ai_budget_usd NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    ai_budget_used_usd NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    scanner_interval_seconds INT NOT NULL DEFAULT 3,
    scanner_active BOOLEAN NOT NULL DEFAULT true,
    agents_active BOOLEAN NOT NULL DEFAULT true,
    system_paused BOOLEAN NOT NULL DEFAULT false,
    theme VARCHAR(16) NOT NULL DEFAULT 'dark',
    language VARCHAR(8) NOT NULL DEFAULT 'ar',
    data_mode VARCHAR(16) NOT NULL DEFAULT 'LIVE',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PORTFOLIO EQUITY SNAPSHOTS
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    equity NUMERIC(16, 2) NOT NULL,
    cash_balance NUMERIC(16, 2) NOT NULL,
    allocated_capital NUMERIC(16, 2) NOT NULL,
    unrealized_pnl NUMERIC(16, 2) NOT NULL,
    realized_pnl NUMERIC(16, 2) NOT NULL,
    daily_pnl NUMERIC(16, 2) NOT NULL,
    open_positions_count INT NOT NULL,
    open_risk_usd NUMERIC(16, 2) NOT NULL
);

-- 3. MARKET SNAPSHOTS (Stored before any AI Analysis Session)
CREATE TABLE IF NOT EXISTS market_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(32) NOT NULL,
    price NUMERIC(16, 4) NOT NULL,
    market_timestamp BIGINT NOT NULL,
    timeframe VARCHAR(16) NOT NULL,
    source VARCHAR(32) NOT NULL DEFAULT 'BINANCE',
    mode VARCHAR(16) NOT NULL DEFAULT 'LIVE',
    indicators JSONB NOT NULL DEFAULT '{}',
    candle_references JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_symbol ON market_snapshots(symbol, created_at DESC);

-- 4. PAPER POSITIONS (Active Positions Desk)
CREATE TABLE IF NOT EXISTS paper_positions (
    id VARCHAR(64) PRIMARY KEY,
    asset VARCHAR(32) NOT NULL,
    direction VARCHAR(16) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    entry_price NUMERIC(16, 4) NOT NULL,
    current_price NUMERIC(16, 4) NOT NULL,
    quantity NUMERIC(16, 6) NOT NULL,
    notional_value NUMERIC(16, 2) NOT NULL,
    stop_loss NUMERIC(16, 4) NOT NULL,
    take_profit NUMERIC(16, 4) NOT NULL,
    take_profit_levels JSONB NOT NULL DEFAULT '[]',
    unrealized_pnl NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    unrealized_pnl_percent NUMERIC(8, 4) NOT NULL DEFAULT 0.0000,
    allocated_capital NUMERIC(16, 2) NOT NULL,
    risk_amount NUMERIC(16, 2) NOT NULL,
    risk_percent NUMERIC(8, 4) NOT NULL,
    risk_reward_ratio NUMERIC(8, 2) NOT NULL,
    strategy_id VARCHAR(64),
    strategy_name VARCHAR(128),
    supervisor_confidence NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    analysis_session_id VARCHAR(64),
    market_data_source VARCHAR(32) NOT NULL DEFAULT 'BINANCE',
    market_data_mode VARCHAR(16) NOT NULL DEFAULT 'LIVE',
    execution_mode VARCHAR(16) NOT NULL DEFAULT 'PAPER',
    trade_type VARCHAR(32) NOT NULL DEFAULT 'LIVE_MARKET_PAPER'
);
CREATE INDEX IF NOT EXISTS idx_paper_positions_asset ON paper_positions(asset);

-- 5. PAPER ORDERS (Blotter)
CREATE TABLE IF NOT EXISTS paper_orders (
    id VARCHAR(64) PRIMARY KEY,
    asset VARCHAR(32) NOT NULL,
    side VARCHAR(16) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    type VARCHAR(16) NOT NULL CHECK (type IN ('MARKET', 'LIMIT')),
    price NUMERIC(16, 4) NOT NULL,
    quantity NUMERIC(16, 6) NOT NULL,
    notional NUMERIC(16, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    filled_at TIMESTAMPTZ,
    stop_loss NUMERIC(16, 4),
    take_profit NUMERIC(16, 4),
    fees NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    slippage NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    reason TEXT,
    analysis_session_id VARCHAR(64)
);

-- 6. CLOSED TRADES LEDGER
CREATE TABLE IF NOT EXISTS trades_ledger (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL DEFAULT 'default_paper',
    asset VARCHAR(32) NOT NULL,
    exchange VARCHAR(32) NOT NULL DEFAULT 'BINANCE',
    mode VARCHAR(16) NOT NULL DEFAULT 'PAPER',
    direction VARCHAR(16) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    strategy_name VARCHAR(128) NOT NULL,
    entry_date TIMESTAMPTZ NOT NULL,
    entry_price NUMERIC(16, 4) NOT NULL,
    exit_date TIMESTAMPTZ NOT NULL,
    exit_price NUMERIC(16, 4) NOT NULL,
    quantity NUMERIC(16, 6) NOT NULL,
    notional_value NUMERIC(16, 2) NOT NULL,
    stop_loss NUMERIC(16, 4) NOT NULL,
    take_profit NUMERIC(16, 4) NOT NULL,
    gross_pnl NUMERIC(16, 2) NOT NULL,
    fees NUMERIC(12, 4) NOT NULL,
    slippage NUMERIC(12, 4) NOT NULL,
    net_pnl NUMERIC(16, 2) NOT NULL,
    net_pnl_percent NUMERIC(8, 4) NOT NULL,
    risk_amount NUMERIC(16, 2) NOT NULL,
    risk_percent NUMERIC(8, 4) NOT NULL,
    risk_reward_ratio NUMERIC(8, 2) NOT NULL,
    duration_minutes INT NOT NULL,
    exit_reason VARCHAR(64) NOT NULL,
    supervisor_confidence NUMERIC(6, 2) NOT NULL,
    market_regime VARCHAR(32) NOT NULL,
    analysis_session_id VARCHAR(64),
    agent_votes JSONB NOT NULL DEFAULT '[]',
    original_thesis TEXT,
    post_trade_review JSONB,
    market_data_source VARCHAR(32) NOT NULL DEFAULT 'BINANCE',
    market_data_mode VARCHAR(16) NOT NULL DEFAULT 'LIVE',
    trade_type VARCHAR(32) NOT NULL DEFAULT 'LIVE_MARKET_PAPER'
);
CREATE INDEX IF NOT EXISTS idx_trades_ledger_asset ON trades_ledger(asset, exit_date DESC);

-- 7. AI ANALYSIS SESSIONS
CREATE TABLE IF NOT EXISTS analysis_sessions (
    id VARCHAR(64) PRIMARY KEY,
    asset VARCHAR(32) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'RUNNING',
    trigger_event TEXT NOT NULL,
    market_snapshot JSONB NOT NULL,
    agent_reports JSONB NOT NULL DEFAULT '[]',
    candidate_trade JSONB,
    risk_decision JSONB,
    trade_executed BOOLEAN NOT NULL DEFAULT false,
    order_id VARCHAR(64),
    disagreements_detected BOOLEAN NOT NULL DEFAULT false,
    conflict_review_summary TEXT
);

-- 8. SYSTEM EVENTS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS system_events (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type VARCHAR(32) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'INFO',
    source VARCHAR(64) NOT NULL,
    asset VARCHAR(32),
    message TEXT NOT NULL,
    metadata JSONB
);
CREATE INDEX IF NOT EXISTS idx_system_events_time ON system_events(timestamp DESC);
