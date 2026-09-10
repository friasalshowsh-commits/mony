import React, { useState } from 'react';
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Line, 
  LineChart, 
  ReferenceLine, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';
import { OHLCVCandle, PaperPosition } from '../types/index.js';
import { useNexus } from '../context/NexusContext.js';

interface TradingChartProps {
  symbol: string;
  candles: OHLCVCandle[];
  position?: PaperPosition;
}

export const TradingChart: React.FC<TradingChartProps> = ({ symbol, candles, position }) => {
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [showIndicators, setShowIndicators] = useState<boolean>(true);

  if (!candles || candles.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500 text-xs">
        Loading live market chart data for {symbol}...
      </div>
    );
  }

  // Calculate moving average 20 on the fly for chart overlay
  const chartData = candles.map((c, i, arr) => {
    let ema20 = c.close;
    if (i >= 20) {
      const slice = arr.slice(i - 20, i);
      ema20 = slice.reduce((sum, item) => sum + item.close, 0) / 20;
    }
    // Calculate simple RSI proxy
    let rsi = 50;
    if (i >= 14) {
      const slice = arr.slice(i - 14, i);
      let up = 0;
      let down = 0;
      for (let j = 1; j < slice.length; j++) {
        const diff = slice[j].close - slice[j - 1].close;
        if (diff > 0) up += diff;
        else down += Math.abs(diff);
      }
      const rs = (up / 14) / ((down / 14) || 0.001);
      rsi = Math.round(100 - (100 / (1 + rs)));
    }

    return {
      time: c.time,
      price: c.close,
      high: c.high,
      low: c.low,
      open: c.open,
      volume: c.volume,
      ema20: parseFloat(ema20.toFixed(2)),
      rsi
    };
  });

  const minPrice = Math.min(...chartData.map(d => d.low)) * 0.998;
  const maxPrice = Math.max(...chartData.map(d => d.high)) * 1.002;
  const lastPrice = chartData[chartData.length - 1]?.price || 0;

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 flex flex-col gap-2 select-none">
      {/* Chart Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-bold text-white tracking-wide">
            {symbol}
          </span>
          <span className="font-mono text-sm font-semibold text-emerald-400">
            ${lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {position && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              position.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              ACTIVE {position.direction} ({position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toLocaleString()})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition ${
                timeframe === tf
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tf}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-800 mx-1" />
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition ${
              showIndicators ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/30' : 'text-slate-500'
            }`}
          >
            EMA / RSI
          </button>
        </div>
      </div>

      {/* Main Price Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} minTickGap={25} />
            <YAxis 
              domain={[minPrice, maxPrice]} 
              orientation="right" 
              stroke="#64748b" 
              tick={{ fontSize: 10 }}
              tickFormatter={(val) => `$${val.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Price']}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#38bdf8" 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false}
            />
            {showIndicators && (
              <Line 
                type="monotone" 
                dataKey="ema20" 
                stroke="#a855f7" 
                strokeWidth={1.5} 
                strokeDasharray="4 4" 
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Active Position Overlays */}
            {position && (
              <>
                <ReferenceLine 
                  y={position.entryPrice} 
                  stroke="#38bdf8" 
                  strokeWidth={1.5} 
                  label={{ value: `ENTRY $${position.entryPrice.toLocaleString()}`, fill: '#38bdf8', fontSize: 10, position: 'insideLeft' }} 
                />
                <ReferenceLine 
                  y={position.stopLoss} 
                  stroke="#f43f5e" 
                  strokeDasharray="3 3" 
                  strokeWidth={1.5} 
                  label={{ value: `STOP $${position.stopLoss.toLocaleString()}`, fill: '#f43f5e', fontSize: 10, position: 'insideLeft' }} 
                />
                <ReferenceLine 
                  y={position.takeProfit} 
                  stroke="#10b981" 
                  strokeDasharray="3 3" 
                  strokeWidth={1.5} 
                  label={{ value: `TP $${position.takeProfit.toLocaleString()}`, fill: '#10b981', fontSize: 10, position: 'insideLeft' }} 
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-Panel: RSI Indicator */}
      {showIndicators && (
        <div className="h-20 w-full border-t border-slate-800/80 pt-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 mb-0.5">
            <span>RSI (14): <strong className="text-slate-200">{chartData[chartData.length - 1]?.rsi}</strong></span>
            <span>Overbought: 70 | Oversold: 30</span>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData} margin={{ top: 2, right: 10, left: 10, bottom: 0 }}>
              <YAxis domain={[10, 90]} orientation="right" stroke="#475569" tick={{ fontSize: 9 }} />
              <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="2 2" strokeWidth={1} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="2 2" strokeWidth={1} />
              <ReferenceLine y={50} stroke="#475569" strokeDasharray="1 1" strokeWidth={0.5} />
              <Line 
                type="monotone" 
                dataKey="rsi" 
                stroke="#ec4899" 
                strokeWidth={1.5} 
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
