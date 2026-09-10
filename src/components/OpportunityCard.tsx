import React from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  ExternalLink, 
  Minus, 
  ShieldAlert, 
  ShieldCheck, 
  XCircle 
} from 'lucide-react';
import { CandidateTrade, RiskDecision } from '../types/index.js';
import { useNexus } from '../context/NexusContext.js';

interface OpportunityCardProps {
  candidate: CandidateTrade;
  riskDecision?: RiskDecision;
  sessionId: string;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ 
  candidate, 
  riskDecision, 
  sessionId 
}) => {
  const { setSelectedSession, setActiveView, analysisSessions } = useNexus();

  const isLong = candidate.direction === 'LONG';
  const isShort = candidate.direction === 'SHORT';
  const isApproved = riskDecision?.approved ?? false;

  const handleInspect = () => {
    const session = analysisSessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setActiveView('analysis');
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition flex flex-col justify-between gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-white">
              {candidate.asset}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
              isLong 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : isShort 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {isLong && <ArrowUpRight className="w-3.5 h-3.5" />}
              {isShort && <ArrowDownRight className="w-3.5 h-3.5" />}
              {!isLong && !isShort && <Minus className="w-3.5 h-3.5" />}
              {candidate.direction}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 uppercase">
              {candidate.marketRegime}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            Current: ${candidate.currentPrice.toLocaleString()} | Horizon: {candidate.timeHorizon}
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="text-right font-mono">
          <div className="text-[10px] uppercase text-slate-400">AI Confidence</div>
          <div className="text-sm font-bold text-indigo-400">
            {candidate.confidence}%
          </div>
        </div>
      </div>

      {/* Numerical Setup Bounds */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 font-mono text-xs">
        <div>
          <div className="text-[10px] text-slate-400">Entry Zone</div>
          <div className="font-semibold text-slate-200">
            ${candidate.entryLow.toLocaleString()} - ${candidate.entryHigh.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">Stop Loss</div>
          <div className="font-semibold text-rose-400">
            ${candidate.stopLoss.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">Target (R:R)</div>
          <div className="font-semibold text-emerald-400">
            ${candidate.takeProfits[1]?.price.toLocaleString() || candidate.takeProfits[0]?.price.toLocaleString()} ({candidate.riskRewardRatio}x)
          </div>
        </div>
      </div>

      {/* Supporting Thesis Preview */}
      <div className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
        {candidate.supervisorSummary}
      </div>

      {/* Footer: Risk Engine Verdict & Inspect CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5 font-mono">
          {isApproved ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">RISK ENGINE: APPROVED</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-rose-400 font-semibold">RISK ENGINE: {riskDecision?.status || 'VETOED'}</span>
            </>
          )}
        </div>

        <button
          onClick={handleInspect}
          className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium transition"
        >
          <span>Audit Session</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
