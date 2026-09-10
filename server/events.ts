import { EventEmitter } from 'events';
import { 
  MarketDataMode, 
  MarketDataStatus, 
  MarketTicker, 
  PaperOrder, 
  PaperPosition, 
  PortfolioSummary, 
  TradeRecord 
} from '../src/types/index.js';

export type NexusEventType = 
  | 'MARKET_PRICE_UPDATED'
  | 'MARKET_CONNECTED'
  | 'MARKET_DISCONNECTED'
  | 'MARKET_RECONNECTED'
  | 'SCANNER_SIGNAL_FOUND'
  | 'ORDER_CREATED'
  | 'POSITION_OPENED'
  | 'POSITION_UPDATED'
  | 'POSITION_CLOSED'
  | 'PNL_UPDATED'
  | 'PORTFOLIO_UPDATED'
  | 'SYSTEM_ERROR'
  | 'DATA_MODE_CHANGED'
  | 'FRESHNESS_CHANGED';

export interface NexusEventPayloads {
  MARKET_PRICE_UPDATED: { ticker: MarketTicker; mode: MarketDataMode };
  MARKET_CONNECTED: { source: string; mode: MarketDataMode; timestamp: number };
  MARKET_DISCONNECTED: { source: string; mode: MarketDataMode; reason?: string; timestamp: number };
  MARKET_RECONNECTED: { source: string; mode: MarketDataMode; timestamp: number };
  SCANNER_SIGNAL_FOUND: { signal: any; symbol: string };
  ORDER_CREATED: { order: PaperOrder };
  POSITION_OPENED: { position: PaperPosition };
  POSITION_UPDATED: { position: PaperPosition };
  POSITION_CLOSED: { position: PaperPosition; trade: TradeRecord };
  PNL_UPDATED: { symbol: string; currentPrice: number; unrealizedPnL: number };
  PORTFOLIO_UPDATED: { portfolio: PortfolioSummary };
  SYSTEM_ERROR: { source: string; error: string; details?: any };
  DATA_MODE_CHANGED: { mode: MarketDataMode };
  FRESHNESS_CHANGED: { symbol: string; status: MarketDataStatus; freshnessMs: number };
}

class NexusEventBus extends EventEmitter {
  emitEvent<K extends NexusEventType>(type: K, payload: NexusEventPayloads[K]) {
    this.emit(type, payload);
    this.emit('*', { type, payload, timestamp: Date.now() });
  }

  onEvent<K extends NexusEventType>(type: K, handler: (payload: NexusEventPayloads[K]) => void) {
    this.on(type, handler);
    return () => this.off(type, handler);
  }

  onAny(handler: (event: { type: NexusEventType; payload: any; timestamp: number }) => void) {
    this.on('*', handler);
    return () => this.off('*', handler);
  }
}

export const eventBus = new NexusEventBus();
