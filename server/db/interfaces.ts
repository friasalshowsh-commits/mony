import { 
  AnalysisSession, 
  PaperOrder, 
  PaperPosition, 
  PortfolioSummary, 
  SystemEvent, 
  TradeRecord, 
  UserSettings 
} from '../../src/types/index.js';

export interface MarketSnapshotRecord {
  id: string;
  symbol: string;
  price: number;
  timestamp: number;
  timeframe: string;
  source: string;
  mode: 'LIVE' | 'DEMO';
  indicators: Record<string, any>;
  candleReferences?: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  createdAt: string;
}

export interface IPositionRepository {
  getAll(): Promise<PaperPosition[]>;
  getById(id: string): Promise<PaperPosition | null>;
  getByAsset(asset: string): Promise<PaperPosition | null>;
  save(position: PaperPosition): Promise<PaperPosition>;
  delete(id: string): Promise<boolean>;
  deleteAll(): Promise<number>;
}

export interface IOrderRepository {
  getAll(limit?: number): Promise<PaperOrder[]>;
  getById(id: string): Promise<PaperOrder | null>;
  save(order: PaperOrder): Promise<PaperOrder>;
  updateStatus(id: string, status: PaperOrder['status'], filledAt?: string): Promise<PaperOrder | null>;
}

export interface ITradeRepository {
  getAll(limit?: number): Promise<TradeRecord[]>;
  getById(id: string): Promise<TradeRecord | null>;
  save(trade: TradeRecord): Promise<TradeRecord>;
  updateReview(id: string, review: TradeRecord['postTradeReview']): Promise<TradeRecord | null>;
}

export interface ISessionRepository {
  getAll(limit?: number): Promise<AnalysisSession[]>;
  getById(id: string): Promise<AnalysisSession | null>;
  save(session: AnalysisSession): Promise<AnalysisSession>;
  updateStatus(id: string, status: AnalysisSession['status'], completedAt?: string): Promise<AnalysisSession | null>;
}

export interface ISnapshotRepository {
  save(snapshot: MarketSnapshotRecord): Promise<MarketSnapshotRecord>;
  getBySymbol(symbol: string, limit?: number): Promise<MarketSnapshotRecord[]>;
  getLatest(symbol: string): Promise<MarketSnapshotRecord | null>;
}

export interface ISettingsRepository {
  getSettings(): Promise<UserSettings>;
  updateSettings(settings: Partial<UserSettings>): Promise<UserSettings>;
  getPortfolio(): Promise<PortfolioSummary>;
  updatePortfolio(portfolio: Partial<PortfolioSummary>): Promise<PortfolioSummary>;
}

export interface IEventRepository {
  log(event: Omit<SystemEvent, 'id' | 'timestamp'>): Promise<SystemEvent>;
  getRecent(limit?: number): Promise<SystemEvent[]>;
}
