import React, { useState } from 'react';
import { BarChart3, Play, TrendingUp } from 'lucide-react';
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';
import { BacktestResult } from '../types/index.js';
import { useNexus } from '../context/NexusContext.js';

export const BacktestView: React.FC = () => {
  const { strategies, tickers, backtests, runBacktest } = useNexus();

  const [selectedStratId, setSelectedStratId] = useState<string>(strategies[0]?.id || 'strat-nexus-momentum');
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC/USDT');
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [feesPercent, setFeesPercent] = useState<number>(0.06);
  const [slippagePercent, setSlippagePercent] = useState<number>(0.05);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const activeResult: BacktestResult | undefined = backtests[0];

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    try {
      await runBacktest({
        strategyId: selectedStratId,
        asset: selectedAsset,
        timeframe,
        initialCapital,
        feesPercent,
        slippagePercent
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-4 max-w-[1700px] mx-auto space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-sky-400" />
          QUANTITATIVE BACKTESTING ENGINE & MONTE CARLO SIMULATOR
        </h1>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Realistic trade execution without look-ahead bias, accounting for exchange fees, spreads, and execution slippage.
        </p>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleRun} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
        <div>
          <label className="text-[10px] uppercase text-slate-400 block mb-1">Strategy</label>
          <select
            value={selectedStratId}
            onChange={(e) => setSelectedStratId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none"
          >
            {strategies.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase text-slate-400 block mb-1">Asset</label>
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none"
          >
            {tickers.map(t => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase text-slate-400 block mb-1">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none"
          >
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase text-slate-400 block mb-1">Starting Capital ($)</label>
          <input
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(parseFloat(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase text-slate-400 block mb-1">Fee Rate (%)</label>
          <input
            type="number"
            step="0.01"
            value={feesPercent}
            onChange={(e) => setFeesPercent(parseFloat(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase text-slate-400 block mb-1">Slippage (%)</label>
          <input
            type="number"
            step="0.01"
            value={slippagePercent}
            onChange={(e) => setSlippagePercent(parseFloat(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isRunning}
            className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold transition flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Simulation'}</span>
          </button>
        </div>
      </form>

      {/* Backtest Results Display */}
      {activeResult && (
        <div className="space-y-4">
          {/* Key Metric Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block">Total Return</span>
              <span className={`text-base font-bold block mt-0.5 ${activeResult.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeResult.totalReturnPercent >= 0 ? '+' : ''}{activeResult.totalReturnPercent}%
              </span>
              <span className="text-[10px] text-slate-400">Net: ${activeResult.netProfit.toLocaleString()}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block">Win Rate</span>
              <span className="text-base font-bold text-emerald-400 block mt-0.5">
                {activeResult.winRate}%
              </span>
              <span className="text-[10px] text-slate-400">{activeResult.totalTrades} Total Trades</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block">Profit Factor</span>
              <span className="text-base font-bold text-sky-400 block mt-0.5">
                {activeResult.profitFactor}x
              </span>
              <span className="text-[10px] text-slate-400">Gross W/L Ratio</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block">Sharpe / Sortino</span>
              <span className="text-base font-bold text-purple-400 block mt-0.5">
                {activeResult.sharpeRatio} / {activeResult.sortinoRatio}
              </span>
              <span className="text-[10px] text-slate-400">Risk Adjusted Return</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block">Max Drawdown</span>
              <span className="text-base font-bold text-amber-400 block mt-0.5">
                {activeResult.maxDrawdown}%
              </span>
              <span className="text-[10px] text-slate-400">Peak-to-Trough</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block">Trade Expectancy</span>
              <span className="text-base font-bold text-white block mt-0.5">
                ${activeResult.expectancy.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">Avg Win: ${activeResult.averageWin.toLocaleString()}</span>
            </div>
          </div>

          {/* Visual Equity Curve */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white uppercase text-xs">
                Simulated Equity Curve ($)
              </span>
              <span className="text-[10px] text-slate-400">
                Strategy: {activeResult.strategyName} on {activeResult.asset} ({activeResult.timeframe})
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeResult.equityCurve} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} minTickGap={20} />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Equity']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.15} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade Audit Log */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
            <span className="font-bold text-white uppercase text-xs block mb-3">
              Backtest Trades Sequence Sample ({activeResult.trades.length} recorded)
            </span>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Entry Price</th>
                    <th className="py-2 px-3">Exit Price</th>
                    <th className="py-2 px-3">Net PnL ($)</th>
                    <th className="py-2 px-3">Return (%)</th>
                    <th className="py-2 px-3">Exit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeResult.trades.map((tr) => {
                    const isWin = tr.pnl >= 0;
                    return (
                      <tr key={tr.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 text-slate-300">{tr.date}</td>
                        <td className="py-2 px-3 font-bold text-white">{tr.type}</td>
                        <td className="py-2 px-3 text-slate-300">${tr.entryPrice.toLocaleString()}</td>
                        <td className="py-2 px-3 text-slate-300">${tr.exitPrice.toLocaleString()}</td>
                        <td className={`py-2 px-3 font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWin ? '+' : ''}${tr.pnl.toLocaleString()}
                        </td>
                        <td className={`py-2 px-3 ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWin ? '+' : ''}{tr.pnlPercent}%
                        </td>
                        <td className="py-2 px-3 text-slate-400">{tr.exitReason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
