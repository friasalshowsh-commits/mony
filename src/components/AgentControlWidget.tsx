import React from 'react';
import { 
  AlertCircle, 
  Bot, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  ExternalLink, 
  Radio, 
  Zap 
} from 'lucide-react';
import { AgentStatus } from '../types/index.js';
import { useNexus } from '../context/NexusContext.js';

export const AgentControlWidget: React.FC = () => {
  const { agents, systemEvents, setActiveView } = useNexus();

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'ANALYZING':
      case 'SEARCHING':
      case 'CALLING_TOOL':
      case 'REVIEWING':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            {status}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-2.5 h-2.5" />
            READY
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-400">
            <AlertCircle className="w-2.5 h-2.5" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            IDLE
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Mini Agent Swarm Grid */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Agent Swarm Status (10)
            </span>
          </div>
          <button
            onClick={() => setActiveView('agents')}
            className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5 transition"
          >
            <span>Control Room</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {agents.slice(0, 6).map((agent) => (
            <div 
              key={agent.id}
              className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {agent.name.replace(' Agent', '')}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  {agent.currentTask || agent.role.split(',')[0]}
                </div>
              </div>
              <div className="shrink-0">
                {getStatusBadge(agent.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Operational Activity Stream */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Live Operations Feed
            </span>
          </div>
          <button
            onClick={() => setActiveView('alerts')}
            className="text-[11px] text-sky-400 hover:text-sky-300 transition"
          >
            Full Log
          </button>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto font-mono text-[11px] pr-1">
          {systemEvents.slice(0, 7).map((evt) => {
            const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div 
                key={evt.id}
                className="flex items-start gap-2 py-1 border-b border-slate-800/40 text-slate-300"
              >
                <span className="text-slate-400 shrink-0">{timeStr}</span>
                <span className={`px-1 rounded text-[9px] font-bold uppercase shrink-0 ${
                  evt.severity === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                  evt.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                  evt.severity === 'ERROR' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {evt.source.split(' ')[0]}
                </span>
                <span className="truncate flex-1 text-slate-300">{evt.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
