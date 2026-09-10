import React from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Clock, 
  ExternalLink, 
  ShieldAlert, 
  X 
} from 'lucide-react';
import { PaperPosition } from '../types/index.js';
import { useNexus } from '../context/NexusContext.js';

interface PositionsTableProps {
  positions: PaperPosition[];
  showActions?: boolean;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({ 
  positions, 
  showActions = true 
}) => {
  const { closePosition, setSelectedAsset, setActiveView } = useNexus();

  if (positions.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
        No active open paper positions. Autonomous scanner and supervisor monitor markets continuously.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
      <table className="w-full text-left border-collapse text-xs font-mono">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider">
            <th className="py-2.5 px-3">Asset</th>
            <th className="py-2.5 px-3">Side</th>
            <th className="py-2.5 px-3">Entry Price</th>
            <th className="py-2.5 px-3">Current Price</th>
            <th className="py-2.5 px-3">Size (Notional)</th>
            <th className="py-2.5 px-3">Stop Loss</th>
            <th className="py-2.5 px-3">Take Profit</th>
            <th className="py-2.5 px-3">Unrealized PnL</th>
            <th className="py-2.5 px-3">Open Risk</th>
            {showActions && <th className="py-2.5 px-3 text-right">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {positions.map((pos) => {
            const isProfit = pos.unrealizedPnL >= 0;
            const isLong = pos.direction === 'LONG';

            return (
              <tr 
                key={pos.id} 
                className="hover:bg-slate-800/40 transition group cursor-pointer"
                onClick={() => {
                  setSelectedAsset(pos.asset);
                }}
              >
                <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                  <span>{pos.asset}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({pos.strategyName.split(' ')[0]})
                  </span>
                </td>

                <td className="py-2.5 px-3">
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isLong 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {isLong ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {pos.direction}
                  </span>
                </td>

                <td className="py-2.5 px-3 text-slate-300">
                  ${pos.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

                <td className="py-2.5 px-3 font-semibold text-white">
                  ${pos.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

                <td className="py-2.5 px-3 text-slate-300">
                  {pos.quantity} units
                  <span className="text-[10px] text-slate-400 block">
                    (${pos.notionalValue.toLocaleString()})
                  </span>
                </td>

                <td className="py-2.5 px-3 text-rose-400">
                  ${pos.stopLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-[10px] text-slate-400 block">
                    (-{pos.distanceToStopPercent.toFixed(1)}%)
                  </span>
                </td>

                <td className="py-2.5 px-3 text-emerald-400">
                  ${pos.takeProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-[10px] text-slate-400 block">
                    (+{pos.distanceToTargetPercent.toFixed(1)}%)
                  </span>
                </td>

                <td className={`py-2.5 px-3 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isProfit ? '+' : ''}${pos.unrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-[10px] ml-1 font-normal">
                    ({isProfit ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%)
                  </span>
                </td>

                <td className="py-2.5 px-3 text-amber-300">
                  ${pos.riskAmount.toLocaleString()}
                  <span className="text-[10px] text-slate-400 block">
                    {pos.riskPercent}% equity
                  </span>
                </td>

                {showActions && (
                  <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => closePosition(pos.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 text-[11px] font-medium transition flex items-center gap-1 ml-auto"
                      title="Close position at current market price"
                    >
                      <X className="w-3 h-3" />
                      <span>Close</span>
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
