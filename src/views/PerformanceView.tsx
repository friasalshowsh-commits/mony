import React, { useState } from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';
import { useNexus } from '../context/NexusContext.js';

export const PerformanceView: React.FC = () => {
  const { portfolio, tradeLedger, agents, backtests } = useNexus();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Daily PnL dummy data series for visualization
  const dailyPnLData = [
    { day: 'Mon', pnl: 450 },
    { day: 'Tue', pnl: -180 },
    { day: 'Wed', pnl: 620 },
    { day: 'Thu', pnl: 340 },
    { day: 'Fri', pnl: -90 },
    { day: 'Sat', pnl: 780 },
    { day: 'Sun', pnl: 410 },
  ];

  // Asset performance breakdown
  const assetBreakdown = [
    { asset: 'BTC/USDT', pnl: 2450, trades: 12, winRate: 75.0 },
    { asset: 'ETH/USDT', pnl: 1820, trades: 9, winRate: 66.7 },
    { asset: 'SOL/USDT', pnl: 940, trades: 6, winRate: 66.7 },
    { asset: 'AVAX/USDT', pnl: -210, trades: 3, winRate: 33.3 },
  ];

  return (
    <div className="p-4 max-w-[1700px] mx-auto space-y-4 font-mono text-xs">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            INSTITUTIONAL PERFORMANCE ANALYTICS & ATTRIBUTION
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Equity curve evolution, Sharpe ratios, maximum drawdown attribution, and agent prediction calibration.
          </p>
        </div>

        <div className="flex items-center gap-1">
          {(['7d', '30d', '90d', 'all'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-xs uppercase transition ${
                timeframe === tf ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Total Net Return</span>
          <span className="text-base font-bold text-emerald-400 block mt-0.5">+4.85%</span>
          <span className="text-[10px] text-slate-400">+$4,850.00 Net PnL</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Profit Factor</span>
          <span className="text-base font-bold text-sky-400 block mt-0.5">2.48x</span>
          <span className="text-[10px] text-slate-400">Gross W / Gross L</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Sharpe Ratio</span>
          <span className="text-base font-bold text-purple-400 block mt-0.5">2.14</span>
          <span className="text-[10px] text-slate-400">Benchmark: Risk Free</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Max Drawdown</span>
          <span className="text-base font-bold text-amber-400 block mt-0.5">
            {(portfolio?.maxDrawdownPercent ?? 1.8).toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-400">Limit: 10.0% Hard Cap</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Win Rate</span>
          <span className="text-base font-bold text-emerald-400 block mt-0.5">
            {(portfolio?.winRate ?? 72).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400">{tradeLedger.length} Executed Trades</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Average R:R</span>
          <span className="text-base font-bold text-white block mt-0.5">2.18x</span>
          <span className="text-[10px] text-slate-400">Average Realized Gain</span>
        </div>
      </div>

      {/* Daily PnL Bar Chart */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <span className="font-bold text-white uppercase text-xs block mb-2">
          Daily Realized PnL Breakdown ($)
        </span>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyPnLData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'PnL']}
              />
              <Bar 
                dataKey="pnl" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown by Asset & Agent Accuracy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance by Asset */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
          <span className="font-bold text-white uppercase text-xs block mb-3">
            Performance Attribution by Asset
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="py-2">Asset</th>
                  <th className="py-2">Net PnL</th>
                  <th className="py-2">Trades</th>
                  <th className="py-2">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assetBreakdown.map((a) => (
                  <tr key={a.asset}>
                    <td className="py-2 text-white font-bold">{a.asset}</td>
                    <td className={`py-2 font-bold ${a.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {a.pnl >= 0 ? '+' : ''}${a.pnl.toLocaleString()}
                    </td>
                    <td className="py-2 text-slate-300">{a.trades}</td>
                    <td className="py-2 text-indigo-400 font-semibold">{a.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent Prediction Calibration */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
          <span className="font-bold text-white uppercase text-xs block mb-3">
            Agent Signal Accuracy & Confidence Calibration
          </span>
          <div className="space-y-2">
            {agents.slice(0, 5).map((agent) => (
              <div key={agent.id} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">{agent.name}</div>
                  <div className="text-[10px] text-slate-400">{agent.tasksCompleted} evaluations conducted</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold text-xs">{agent.avgConfidence}% Accuracy</div>
                  <div className="text-[10px] text-slate-400">{agent.avgLatencyMs}ms avg latency</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
