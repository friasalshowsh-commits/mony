import React, { useState } from 'react';
import { 
  ArrowRight, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  FlaskConical, 
  Plus, 
  ShieldCheck, 
  Sliders, 
  Trash2 
} from 'lucide-react';
import { StrategyStatus, TradingStrategy } from '../types/index.js';
import { useNexus } from '../context/NexusContext.js';

export const StrategyLabView: React.FC = () => {
  const { strategies, createStrategy, updateStrategyStatus, setActiveView } = useNexus();
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newStratName, setNewStratName] = useState<string>('');
  const [newStratDesc, setNewStratDesc] = useState<string>('');
  const [newStratRisk, setNewStratRisk] = useState<number>(1.0);
  const [newStratRR, setNewStratRR] = useState<number>(2.0);

  const statusColors: Record<StrategyStatus, string> = {
    DRAFT: 'bg-slate-800 text-slate-400',
    BACKTESTING: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    OUT_OF_SAMPLE: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    PAPER: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    APPROVED: 'bg-emerald-500 text-slate-950 font-bold',
    ARCHIVED: 'bg-slate-900 text-slate-500 line-through'
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStratName.trim()) return;

    await createStrategy({
      name: newStratName,
      description: newStratDesc || 'Algorithmic multi-timeframe strategy',
      riskPerTrade: newStratRisk,
      minRiskReward: newStratRR
    });

    setNewStratName('');
    setNewStratDesc('');
    setShowCreateModal(false);
  };

  const advanceLifecycle = (strat: TradingStrategy) => {
    const sequence: StrategyStatus[] = ['DRAFT', 'BACKTESTING', 'OUT_OF_SAMPLE', 'PAPER', 'APPROVED'];
    const currentIndex = sequence.indexOf(strat.status);
    if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
      const nextStatus = sequence[currentIndex + 1];
      updateStrategyStatus(strat.id, nextStatus);
    }
  };

  return (
    <div className="p-4 max-w-[1700px] mx-auto space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
            STRATEGY RESEARCH & PROMOTION WORKBENCH
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Strict lifecycle progression: DRAFT → BACKTESTING → OUT-OF-SAMPLE → PAPER TRADING → HUMAN APPROVED.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold transition"
        >
          <Plus className="w-4 h-4" />
          <span>Propose New Strategy</span>
        </button>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map((strat) => (
          <div 
            key={strat.id}
            className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-bold text-white">{strat.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    ID: {strat.id} | Ver: {strat.version}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${statusColors[strat.status]}`}>
                  {strat.status}
                </span>
              </div>

              <p className="text-slate-300 font-sans text-xs leading-relaxed mb-3">
                {strat.description}
              </p>

              <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Target Assets:</span>
                  <span className="text-slate-200">{strat.assets.join(', ')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Timeframes:</span>
                  <span className="text-slate-200">{strat.timeframes.join(', ')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Indicators:</span>
                  <span className="text-indigo-400">{strat.indicators.join(' + ')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Max Risk / Min R:R:</span>
                  <span className="text-emerald-400">{strat.riskSettings.maxRiskPerTradePercent}% / {strat.riskSettings.minRiskReward}x</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setActiveView('backtesting')}
                className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition text-xs"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Run Backtest</span>
              </button>

              {strat.status !== 'APPROVED' && strat.status !== 'ARCHIVED' && (
                <button
                  onClick={() => advanceLifecycle(strat)}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition text-xs font-bold"
                  title="Promote strategy to next lifecycle validation stage"
                >
                  <span>Promote Stage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Strategy Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1420] border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-indigo-400" />
              Propose New Algorithmic Strategy
            </h2>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Strategy Name</label>
                <input
                  type="text"
                  required
                  value={newStratName}
                  onChange={(e) => setNewStratName(e.target.value)}
                  placeholder="e.g. Mean Reverting Volume Oscillator"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Thesis Description</label>
                <textarea
                  rows={3}
                  value={newStratDesc}
                  onChange={(e) => setNewStratDesc(e.target.value)}
                  placeholder="Describe the mathematical or order flow edge..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Risk per Trade (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="2.0"
                    value={newStratRisk}
                    onChange={(e) => setNewStratRisk(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Minimum R:R Ratio</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={newStratRR}
                    onChange={(e) => setNewStratRR(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs"
                >
                  Create Strategy (DRAFT)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
