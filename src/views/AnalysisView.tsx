import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowRight, 
  ArrowUpRight, 
  Bot, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Layers, 
  Minus, 
  Play, 
  Radar, 
  ShieldAlert, 
  ShieldCheck, 
  XCircle 
} from 'lucide-react';
import { AnalysisSession, SignalDirection } from '../types/index.js';
import { useNexus } from '../context/NexusContext.js';

export const AnalysisView: React.FC = () => {
  const { 
    analysisSessions, 
    selectedSession, 
    setSelectedSession, 
    triggerScan,
    tickers 
  } = useNexus();

  const [assetFilter, setAssetFilter] = useState<string>('ALL');

  const filteredSessions = analysisSessions.filter(s => 
    assetFilter === 'ALL' ? true : s.asset === assetFilter
  );

  const currentSession: AnalysisSession | undefined = selectedSession || filteredSessions[0];

  const getSignalBadge = (signal: SignalDirection, confidence: number) => {
    switch (signal) {
      case 'BULLISH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ArrowUpRight className="w-3.5 h-3.5" />
            BULLISH ({confidence}%)
          </span>
        );
      case 'BEARISH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ArrowDownRight className="w-3.5 h-3.5" />
            BEARISH ({confidence}%)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-slate-300">
            <Minus className="w-3.5 h-3.5" />
            NEUTRAL ({confidence}%)
          </span>
        );
    }
  };

  return (
    <div className="p-4 max-w-[1700px] mx-auto space-y-4">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            MULTI-AGENT ANALYSIS SESSIONS & AUDIT LOGS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full forensic pipeline tracing agent disagreements, consensus voting, supervisor synthesis, and deterministic risk checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Asset filter */}
          <select
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
          >
            <option value="ALL">All Assets</option>
            {tickers.map(t => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>

          <button
            onClick={() => triggerScan()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40 text-xs font-bold font-mono transition"
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Trigger New Analysis</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Session Browser List */}
        <div className="space-y-2 lg:col-span-1 bg-slate-900/40 p-3 rounded-xl border border-slate-800 max-h-[85vh] overflow-y-auto">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold px-1 mb-1">
            Historical Sessions ({filteredSessions.length})
          </div>

          {filteredSessions.map((s) => {
            const isSelected = currentSession?.id === s.id;
            const cand = s.candidateTrade;
            const isLong = cand?.direction === 'LONG';
            const isShort = cand?.direction === 'SHORT';

            return (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s)}
                className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1.5 ${
                  isSelected 
                    ? 'bg-slate-800/90 border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.15)]' 
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">{s.asset}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className={`font-bold ${isLong ? 'text-emerald-400' : isShort ? 'text-rose-400' : 'text-slate-400'}`}>
                    {cand?.direction || 'NO_TRADE'} ({cand?.confidence ?? 0}%)
                  </span>

                  {s.riskDecision?.approved ? (
                    <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> PASS
                    </span>
                  ) : (
                    <span className="text-rose-400 text-[10px] flex items-center gap-0.5">
                      <ShieldAlert className="w-3 h-3" /> VETO
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 truncate">
                  {s.triggerEvent}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 3 Columns: Selected Session Full Audit */}
        {currentSession ? (
          <div className="lg:col-span-3 space-y-4">
            {/* Session Header Card */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 font-mono">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{currentSession.asset}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-300">
                      ID: {currentSession.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs uppercase">
                      Regime: {currentSession.marketSnapshot.marketRegime}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Trigger: <span className="text-slate-200">{currentSession.triggerEvent}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Execution Status</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 justify-end mt-0.5">
                    {currentSession.tradeExecuted ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> PAPER EXECUTED
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> NO TRADE EXECUTED
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual Pipeline Bar */}
              <div className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800">
                <div className="flex items-center gap-1 text-slate-400">
                  <Radar className="w-3.5 h-3.5 text-sky-400" />
                  <span>Trigger</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <div className="flex items-center gap-1 text-slate-400">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Supervisor</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <div className="flex items-center gap-1 text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>6 Specialized Agents</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <div className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deterministic Risk Engine</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <div className="flex items-center gap-1 text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Paper Execution</span>
                </div>
              </div>

              {/* Conflict Review Warning if Disagreements Detected */}
              {currentSession.disagreementsDetected && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold uppercase tracking-wider text-amber-400">
                      Conflict Review Protocol Triggered
                    </strong>
                    {currentSession.conflictReviewSummary || 'Agents expressed contradictory signals with high individual confidence. Supervisor reduced size or mandated NO_TRADE to safeguard capital.'}
                  </div>
                </div>
              )}
            </div>

            {/* Candidate Trade & Risk Engine Double Card */}
            {currentSession.candidateTrade && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                {/* Candidate Trade Blueprint */}
                <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase text-slate-400 font-bold">
                      Supervisor Candidate Trade
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      currentSession.candidateTrade.direction === 'LONG' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : currentSession.candidateTrade.direction === 'SHORT'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {currentSession.candidateTrade.direction} ({currentSession.candidateTrade.confidence}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Entry Range</span>
                      <span className="text-white font-bold">
                        ${currentSession.candidateTrade.entryLow.toLocaleString()} - ${currentSession.candidateTrade.entryHigh.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Stop Loss</span>
                      <span className="text-rose-400 font-bold">
                        ${currentSession.candidateTrade.stopLoss.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Targets (TP 1 / 2 / 3)</span>
                      <span className="text-emerald-400 font-bold">
                        ${currentSession.candidateTrade.takeProfits[0]?.price.toLocaleString()} / ${currentSession.candidateTrade.takeProfits[1]?.price.toLocaleString()} / ${currentSession.candidateTrade.takeProfits[2]?.price.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Risk : Reward (R:R)</span>
                      <span className="text-indigo-400 font-bold">
                        {currentSession.candidateTrade.riskRewardRatio}x
                      </span>
                    </div>
                  </div>

                  {/* Supporting vs Opposing Thesis */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">
                        WHY THIS TRADE? (Supporting Evidence)
                      </div>
                      <ul className="space-y-1 text-slate-300">
                        {currentSession.candidateTrade.supportingReasons.map((r, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-rose-400 mb-1">
                        WHY COULD THIS TRADE FAIL? (Identified Vulnerabilities)
                      </div>
                      <ul className="space-y-1 text-slate-300">
                        {currentSession.candidateTrade.opposingReasons.map((r, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-400">⚠</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Deterministic Risk Engine Audit */}
                <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase text-slate-400 font-bold">
                      Deterministic Risk Engine Audit
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      currentSession.riskDecision?.approved 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {currentSession.riskDecision?.status || 'VETOED'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    {currentSession.riskDecision?.reasons[0] || 'Awaiting risk evaluation.'}
                  </div>

                  {/* Rule Checklist */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">
                      Hard Risk Constraint Checklist:
                    </div>
                    {currentSession.riskDecision?.ruleChecks.map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-800/50">
                        <span className="text-slate-300">{rule.rule}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">{rule.threshold}</span>
                          {rule.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Individual Specialized Agent Reports */}
            <div className="space-y-3">
              <div className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                Specialized Agent Reports ({currentSession.agentReports.length})
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentSession.agentReports.map((report) => (
                  <div 
                    key={report.agentId}
                    className="bg-slate-900/60 rounded-xl border border-slate-800 p-3.5 space-y-2.5 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{report.agentName}</span>
                      {getSignalBadge(report.signal, report.confidence)}
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed font-sans">
                      {report.summary}
                    </p>

                    <div className="space-y-1 pt-1 border-t border-slate-800/60 text-[11px]">
                      <div className="text-slate-400 font-semibold uppercase text-[10px]">Evidence:</div>
                      {report.evidence.map((ev, i) => (
                        <div key={i} className="text-slate-300 flex items-start gap-1">
                          <span className="text-indigo-400">•</span>
                          <span>{ev}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                      <span>Sources: {report.dataSources.join(', ')}</span>
                      <span className="text-emerald-400">{report.dataFreshness}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 py-16 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
            Select an analysis session from the left list to review detailed agent reports and risk proofs.
          </div>
        )}
      </div>
    </div>
  );
};
