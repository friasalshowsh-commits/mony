import React from 'react';
import { 
  Activity, 
  AlertCircle, 
  ArrowDownRight, 
  ArrowUpRight, 
  Bot, 
  Cpu, 
  DollarSign, 
  Layers, 
  Radio, 
  TrendingUp, 
  Zap 
} from 'lucide-react';
import { AgentControlWidget } from '../components/AgentControlWidget.js';
import { OpportunityCard } from '../components/OpportunityCard.js';
import { PositionsTable } from '../components/PositionsTable.js';
import { TradingChart } from '../components/TradingChart.js';
import { useNexus } from '../context/NexusContext.js';

export const DashboardView: React.FC = () => {
  const { 
    tickers, 
    positions, 
    analysisSessions, 
    portfolio, 
    tradeLedger, 
    selectedAsset, 
    setSelectedAsset,
    triggerScan,
    setActiveView 
  } = useNexus();

  const selectedTicker = tickers.find(t => t.symbol === selectedAsset) || tickers[0];
  const activePosition = positions.find(p => p.asset === selectedAsset);

  // Latest candidate opportunities from recent sessions
  const recentOpportunities = analysisSessions
    .filter(s => s.candidateTrade && (s.candidateTrade.direction === 'LONG' || s.candidateTrade.direction === 'SHORT'))
    .slice(0, 3);

  // Mock candle generation if needed for chart
  const basePrice = selectedTicker?.price || 64850;
  const now = Date.now();
  const sampleCandles = Array.from({ length: 40 }).map((_, i) => {
    const timestamp = now - (40 - i) * 3600000;
    const p = basePrice * (0.97 + (i / 40) * 0.03 + (Math.sin(i / 2) * 0.008));
    return {
      timestamp,
      time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: parseFloat((p * 0.998).toFixed(2)),
      high: parseFloat((p * 1.004).toFixed(2)),
      low: parseFloat((p * 0.996).toFixed(2)),
      close: parseFloat(p.toFixed(2)),
      volume: 12000 + Math.floor(Math.random() * 8000)
    };
  });

  return (
    <div className="p-4 space-y-4 max-w-[1700px] mx-auto">
      {/* Top Market Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {tickers.map((t) => {
          const isSelected = t.symbol === selectedAsset;
          const isUp = t.change24h >= 0;
          return (
            <button
              key={t.symbol}
              onClick={() => setSelectedAsset(t.symbol)}
              className={`p-2.5 rounded-xl border text-left transition select-none ${
                isSelected 
                  ? 'bg-slate-800/90 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white">{t.symbol}</span>
                <span className={`text-[10px] font-mono font-semibold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {isUp ? '+' : ''}{t.change24h}%
                </span>
              </div>
              <div className="font-mono text-sm font-semibold text-slate-200 mt-1">
                ${t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                <span className="uppercase">{t.marketRegime}</span>
                <span className="text-indigo-400 font-semibold">AI: {t.aiScore}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left 2/3 and Right 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Live Chart & Open Positions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live Market Chart */}
          <TradingChart 
            symbol={selectedAsset} 
            candles={sampleCandles} 
            position={activePosition} 
          />

          {/* Active AI Opportunities Section */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  Active Multi-Agent Opportunities
                </span>
              </div>
              <button
                onClick={() => triggerScan(selectedAsset)}
                className="text-xs text-sky-400 hover:text-sky-300 font-mono transition"
              >
                + Analyze {selectedAsset}
              </button>
            </div>

            {recentOpportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentOpportunities.map((s) => (
                  <OpportunityCard
                    key={s.id}
                    candidate={s.candidateTrade!}
                    riskDecision={s.riskDecision}
                    sessionId={s.id}
                  />
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-lg">
                No active candidate opportunities pending. Click "Scan Market" to dispatch the agent swarm.
              </div>
            )}
          </div>

          {/* Live Open Paper Positions */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  Open Paper Positions ({positions.length})
                </span>
              </div>
              <button
                onClick={() => setActiveView('paper-trading')}
                className="text-xs text-sky-400 hover:text-sky-300 font-mono transition"
              >
                Paper Board →
              </button>
            </div>

            <PositionsTable positions={positions} />
          </div>
        </div>

        {/* Right Column: Agent Swarm Observability & Operational Feed */}
        <div className="space-y-4">
          {/* Quick Portfolio Health Card */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 font-mono text-xs">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Portfolio Accounting Snapshot
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span>Cash Balance</span>
                <span className="font-bold text-white">
                  ${(portfolio?.cashBalance ?? 100000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Allocated Capital</span>
                <span className="text-slate-300">
                  ${(portfolio?.allocatedCapital ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Unrealized PnL</span>
                <span className={`font-bold ${(portfolio?.unrealizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(portfolio?.unrealizedPnL ?? 0) >= 0 ? '+' : ''}${(portfolio?.unrealizedPnL ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Realized PnL (Closed)</span>
                <span className={`font-bold ${(portfolio?.realizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(portfolio?.realizedPnL ?? 0) >= 0 ? '+' : ''}${(portfolio?.realizedPnL ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-px bg-slate-800 my-1" />
              <div className="flex justify-between items-center text-slate-300">
                <span>Max Drawdown Peak</span>
                <span className="text-amber-400 font-semibold">
                  {(portfolio?.maxDrawdownPercent ?? 0).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Total Win Rate</span>
                <span className="text-emerald-400 font-semibold">
                  {(portfolio?.winRate ?? 0).toFixed(1)}% ({portfolio?.winningTradesCount ?? 0}W / {portfolio?.losingTradesCount ?? 0}L)
                </span>
              </div>
            </div>
          </div>

          {/* Live Agent Control Widget */}
          <AgentControlWidget />
        </div>
      </div>

      {/* Bottom: Recent Completed Trades Ledger */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Recent Trade Ledger & AI Review Audits
            </span>
          </div>
          <button
            onClick={() => setActiveView('journal')}
            className="text-xs text-sky-400 hover:text-sky-300 font-mono transition"
          >
            Full Trade Journal →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2 px-3">Trade ID</th>
                <th className="py-2 px-3">Asset</th>
                <th className="py-2 px-3">Side</th>
                <th className="py-2 px-3">Entry</th>
                <th className="py-2 px-3">Exit</th>
                <th className="py-2 px-3">Net PnL</th>
                <th className="py-2 px-3">Reason</th>
                <th className="py-2 px-3">Agent 10 Review Lesson</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tradeLedger.slice(0, 5).map((t) => {
                const isWin = t.netPnL >= 0;
                return (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 text-slate-400 font-semibold">{t.id}</td>
                    <td className="py-2 px-3 font-bold text-white">{t.asset}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">${t.entryPrice.toLocaleString()}</td>
                    <td className="py-2 px-3 text-slate-300">${t.exitPrice.toLocaleString()}</td>
                    <td className={`py-2 px-3 font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isWin ? '+' : ''}${t.netPnL.toLocaleString()} ({isWin ? '+' : ''}{t.netPnLPercent.toFixed(2)}%)
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">
                        {t.exitReason}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 truncate max-w-xs" title={t.postTradeReview?.lessonProposal}>
                      {t.postTradeReview?.lessonProposal || 'Standard risk adherence'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
