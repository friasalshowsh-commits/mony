import React, { useState } from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  GraduationCap, 
  ShieldAlert, 
  ShieldCheck, 
  X, 
  XCircle 
} from 'lucide-react';
import { TradeRecord } from '../types/index.js';
import { useNexus } from '../context/NexusContext.js';

export const TradeJournalView: React.FC = () => {
  const { tradeLedger, selectedTrade, setSelectedTrade } = useNexus();
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  const filteredTrades = tradeLedger.filter(t => {
    if (filterOutcome === 'WIN') return t.netPnL >= 0;
    if (filterOutcome === 'LOSS') return t.netPnL < 0;
    return true;
  });

  const activeTrade: TradeRecord | undefined = selectedTrade || filteredTrades[0];

  return (
    <div className="p-4 max-w-[1700px] mx-auto space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            PERMANENT TRADE JOURNAL & AI POST-MORTEM AUDIT
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Immutable trade ledger capturing thesis vs reality, execution slippage, and Agent 10 post-trade review lessons.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'WIN', 'LOSS'] as const).map((o) => (
            <button
              key={o}
              onClick={() => setFilterOutcome(o)}
              className={`px-3 py-1 rounded-lg text-xs transition ${
                filterOutcome === o ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {o === 'ALL' ? 'All Trades' : o === 'WIN' ? 'Winners' : 'Losses'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Trade List */}
        <div className="lg:col-span-1 bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-2 max-h-[85vh] overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1 mb-1">
            Closed Trades Ledger ({filteredTrades.length})
          </div>

          {filteredTrades.map((tr) => {
            const isSelected = activeTrade?.id === tr.id;
            const isWin = tr.netPnL >= 0;

            return (
              <button
                key={tr.id}
                onClick={() => setSelectedTrade(tr)}
                className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1.5 ${
                  isSelected 
                    ? 'bg-slate-800/90 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.15)]' 
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{tr.asset}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(tr.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    tr.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {tr.direction}
                  </span>

                  <span className={`font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isWin ? '+' : ''}${tr.netPnL.toLocaleString()} ({isWin ? '+' : ''}{tr.netPnLPercent.toFixed(2)}%)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Exit: {tr.exitReason}</span>
                  <span className="text-purple-400">Review Available</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 3 Columns: 360-Degree Trade Review */}
        {activeTrade ? (
          <div className="lg:col-span-3 space-y-4">
            {/* Header Scorecard */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{activeTrade.asset}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      activeTrade.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {activeTrade.direction}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-300">
                      ID: {activeTrade.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Strategy: <span className="text-slate-200">{activeTrade.strategyName}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Net Realized PnL</div>
                  <div className={`text-lg font-bold ${activeTrade.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {activeTrade.netPnL >= 0 ? '+' : ''}${activeTrade.netPnL.toLocaleString()} ({activeTrade.netPnL >= 0 ? '+' : ''}{activeTrade.netPnLPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

              {/* Numerical Execution Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Entry / Exit Price</span>
                  <span className="text-white font-semibold">
                    ${activeTrade.entryPrice.toLocaleString()} → ${activeTrade.exitPrice.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Trade Duration</span>
                  <span className="text-white font-semibold">{activeTrade.durationMinutes} minutes</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Fees & Slippage</span>
                  <span className="text-amber-300 font-semibold">
                    -${activeTrade.fees.toFixed(2)} / -${activeTrade.slippage.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Initial Risk Allocated</span>
                  <span className="text-white font-semibold">
                    ${activeTrade.riskAmount.toLocaleString()} ({activeTrade.riskPercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Agent 10: Post-Trade AI Post-Mortem Card */}
            {activeTrade.postTradeReview ? (
              <div className="bg-slate-900/80 rounded-xl border border-purple-500/40 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4" />
                    <span>Agent 10: Trade Review Agent Post-Mortem</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    activeTrade.postTradeReview.thesisAccuracy === 'CORRECT' ? 'bg-emerald-500/20 text-emerald-400' :
                    activeTrade.postTradeReview.thesisAccuracy === 'PARTIALLY_CORRECT' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    Thesis: {activeTrade.postTradeReview.thesisAccuracy}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">
                      WHAT WORKED ACCORDING TO PLAN
                    </div>
                    <ul className="space-y-1 text-slate-300 font-sans leading-relaxed">
                      {activeTrade.postTradeReview.whatWorked.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-emerald-400">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-rose-400 mb-1">
                      WHAT FAILED / UNFORESEEN FACTORS
                    </div>
                    <ul className="space-y-1 text-slate-300 font-sans leading-relaxed">
                      {activeTrade.postTradeReview.whatFailed.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-rose-400">✗</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {activeTrade.postTradeReview.agentErrors && activeTrade.postTradeReview.agentErrors.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                    <div className="text-[10px] uppercase font-bold text-amber-400 mb-1">
                      Agent Miscalibrations Flagged:
                    </div>
                    <ul className="space-y-1 text-slate-300 font-sans">
                      {activeTrade.postTradeReview.agentErrors.map((err, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs">
                  <div className="text-[10px] uppercase font-bold text-purple-300 mb-1">
                    STRATEGIC LESSON & RULE ADJUSTMENT PROPOSAL
                  </div>
                  <p className="text-slate-200 font-sans leading-relaxed">
                    {activeTrade.postTradeReview.lessonProposal}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Post-trade post-mortem analysis pending for this trade.
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-3 py-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            Select a trade from the left ledger to audit the trade thesis, execution parameters, and AI review post-mortem.
          </div>
        )}
      </div>
    </div>
  );
};
