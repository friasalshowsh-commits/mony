import React from 'react';
import { 
  Activity, 
  AlertCircle, 
  Bot, 
  CheckCircle2, 
  Clock, 
  Coins, 
  Cpu, 
  DollarSign, 
  ExternalLink, 
  Play, 
  Sliders, 
  Zap 
} from 'lucide-react';
import { AgentProfile, AgentStatus } from '../types/index.js';
import { useNexus } from '../context/NexusContext.js';

export const AgentsView: React.FC = () => {
  const { agents, settings, triggerScan, selectedAsset } = useNexus();

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'ANALYZING':
      case 'SEARCHING':
      case 'CALLING_TOOL':
      case 'REVIEWING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            {status}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            READY
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/20 text-rose-400">
            <AlertCircle className="w-3 h-3" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-800">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            IDLE
          </span>
        );
    }
  };

  const totalTokens = agents.reduce((sum, a) => sum + a.tokensUsed, 0);
  const totalCost = agents.reduce((sum, a) => sum + a.estimatedCostUsd, 0);
  const totalTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);

  return (
    <div className="p-4 max-w-[1700px] mx-auto space-y-4">
      {/* Top Banner & Budget */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800 font-mono text-xs">
        <div>
          <div className="text-slate-400 text-[10px] uppercase">Active Autonomous Swarm</div>
          <div className="text-lg font-bold text-white flex items-center gap-2 mt-1">
            <Bot className="w-5 h-5 text-emerald-400" />
            {agents.length} Specialized Agents
          </div>
        </div>

        <div>
          <div className="text-slate-400 text-[10px] uppercase">Total Tasks Executed</div>
          <div className="text-lg font-bold text-sky-400 mt-1">
            {totalTasks} Tasks Completed
          </div>
        </div>

        <div>
          <div className="text-slate-400 text-[10px] uppercase">Token Consumption</div>
          <div className="text-lg font-bold text-purple-400 mt-1">
            {(totalTokens / 1000).toFixed(1)}k Tokens
          </div>
        </div>

        <div>
          <div className="text-slate-400 text-[10px] uppercase">AI Budget Burn</div>
          <div className="text-lg font-bold text-amber-400 mt-1">
            ${totalCost.toFixed(4)} / ${(settings?.aiBudgetUsd ?? 50).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Agents Swarm Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition"
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{agent.name}</h3>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">{agent.role}</div>
                </div>
                {getStatusBadge(agent.status)}
              </div>

              {/* Current Task */}
              <div className="mt-3 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 font-mono text-xs">
                <div className="text-[10px] text-slate-400 uppercase">Current Task</div>
                <div className="text-slate-200 mt-0.5 truncate">
                  {agent.currentTask || 'Monitoring market data channels'}
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 font-mono text-center text-xs">
              <div>
                <div className="text-[9px] text-slate-400 uppercase">Avg Latency</div>
                <div className="font-bold text-white mt-0.5">{agent.avgLatencyMs}ms</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 uppercase">Confidence</div>
                <div className="font-bold text-indigo-400 mt-0.5">{agent.avgConfidence}%</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 uppercase">Cost Burn</div>
                <div className="font-bold text-amber-400 mt-0.5">${agent.estimatedCostUsd.toFixed(4)}</div>
              </div>
            </div>

            {/* Model & Dispatch */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
              <span>Model: <strong className="text-slate-300">{agent.model}</strong></span>
              <button
                onClick={() => triggerScan(selectedAsset)}
                className="text-sky-400 hover:text-sky-300 transition flex items-center gap-1"
              >
                <span>Dispatch</span>
                <Play className="w-3 h-3 fill-current" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
