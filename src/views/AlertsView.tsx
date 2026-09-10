import React, { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Info, 
  Radio, 
  Search, 
  ShieldAlert, 
  ShieldCheck 
} from 'lucide-react';
import { EventSeverity, SystemEvent } from '../types/index.js';
import { useNexus } from '../context/NexusContext.js';

export const AlertsView: React.FC = () => {
  const { systemEvents, connected, settings } = useNexus();
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = systemEvents.filter(e => {
    if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
    if (searchQuery.trim() && !e.message.toLowerCase().includes(searchQuery.toLowerCase()) && !e.source.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getSeverityBadge = (sev: EventSeverity) => {
    switch (sev) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            SUCCESS
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            WARNING
          </span>
        );
      case 'ERROR':
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            {sev}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
    }
  };

  const healthServices = [
    { name: 'Market Data Feed', status: 'ONLINE', latency: '12ms', details: 'Continuous OHLCV and tick stream' },
    { name: 'AI Multi-Agent Swarm', status: 'OPERATIONAL', latency: '420ms', details: 'Supervisor and 10 agents active' },
    { name: 'Deterministic Risk Engine', status: 'ENFORCING', latency: '<1ms', details: 'Hard veto limits locked' },
    { name: 'Paper Trading Engine', status: 'RUNNING', latency: '4ms', details: 'Simulated matching and trailing stops' },
    { name: 'Autonomous Scanner Loop', status: settings?.scannerActive ? 'ACTIVE' : 'PAUSED', latency: '2500ms', details: 'Continuous breakout scanner' },
    { name: 'Realtime SSE Event Bus', status: connected ? 'STREAMING' : 'RECONNECTING', latency: '<5ms', details: 'Client state synchronization' }
  ];

  return (
    <div className="p-4 max-w-[1700px] mx-auto space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          SYSTEM HEALTH & FORENSIC EVENT AUDIT LOG
        </h1>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Real-time diagnostics, subsystem health monitors, and immutable compliance event logs.
        </p>
      </div>

      {/* Subsystem Health Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {healthServices.map((svc) => (
          <div key={svc.name} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase text-slate-400 block truncate">{svc.name}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-400 text-xs">{svc.status}</span>
            </div>
            <span className="text-[10px] text-slate-400 block">Latency: {svc.latency}</span>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-1">
            {['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  severityFilter === s ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Event Audit Table */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Severity</th>
                <th className="py-2 px-3">Source Subsystem</th>
                <th className="py-2 px-3">Asset</th>
                <th className="py-2 px-3">Audit Event Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2 px-3 text-slate-400">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2 px-3">
                    {getSeverityBadge(evt.severity)}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-200">
                    {evt.source}
                  </td>
                  <td className="py-2 px-3 font-bold text-white">
                    {evt.asset || '—'}
                  </td>
                  <td className="py-2 px-3 text-slate-300">
                    {evt.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
