import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  Layers, 
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  X 
} from 'lucide-react';
import { PositionsTable } from '../components/PositionsTable.js';
import { useNexus } from '../context/NexusContext.js';

export const PaperTradingView: React.FC = () => {
  const { positions, orders, portfolio, closeAllPositions } = useNexus();
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [confirmFlatten, setConfirmFlatten] = useState<boolean>(false);

  const filteredOrders = orders.filter(o => 
    orderFilter === 'ALL' ? true : o.status === orderFilter
  );

  const handleFlattenAll = async () => {
    await closeAllPositions();
    setConfirmFlatten(false);
  };

  return (
    <div className="p-4 max-w-[1700px] mx-auto space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            PAPER TRADING DESK & REAL-TIME BLOTTER
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Zero-risk simulated capital execution strictly enforced by the Deterministic Risk Engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {positions.length > 0 && (
            confirmFlatten ? (
              <div className="flex items-center gap-2 bg-rose-950/80 p-1.5 rounded-lg border border-rose-800">
                <span className="text-rose-300 font-bold text-xs">Confirm Flatten All?</span>
                <button
                  onClick={handleFlattenAll}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold transition"
                >
                  Yes, Close All
                </button>
                <button
                  onClick={() => setConfirmFlatten(false)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmFlatten(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-bold transition"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Emergency Flatten All</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Accounting Snapshot Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] uppercase text-slate-400">Total Equity</div>
          <div className="text-base font-bold text-white mt-0.5">
            ${(portfolio?.equity ?? 100000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] uppercase text-slate-400">Cash Balance</div>
          <div className="text-base font-semibold text-slate-200 mt-0.5">
            ${(portfolio?.cashBalance ?? 100000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] uppercase text-slate-400">Allocated Capital</div>
          <div className="text-base font-semibold text-slate-300 mt-0.5">
            ${(portfolio?.allocatedCapital ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] uppercase text-slate-400">Unrealized PnL</div>
          <div className={`text-base font-bold mt-0.5 ${(portfolio?.unrealizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(portfolio?.unrealizedPnL ?? 0) >= 0 ? '+' : ''}${(portfolio?.unrealizedPnL ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] uppercase text-slate-400">Realized PnL</div>
          <div className={`text-base font-bold mt-0.5 ${(portfolio?.realizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(portfolio?.realizedPnL ?? 0) >= 0 ? '+' : ''}${(portfolio?.realizedPnL ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] uppercase text-slate-400">Fees Paid</div>
          <div className="text-base font-semibold text-amber-300 mt-0.5">
            ${(portfolio?.totalFeesPaid ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] uppercase text-slate-400">Slippage Incurred</div>
          <div className="text-base font-semibold text-slate-300 mt-0.5">
            ${(portfolio?.totalSlippageUsd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Open Positions Section */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-xs uppercase tracking-wider">
            Open Paper Positions ({positions.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Real-time ticks evaluate trailing stops and 3 take-profit tiers autonomously.
          </span>
        </div>

        <PositionsTable positions={positions} showActions={true} />
      </div>

      {/* Orders Blotter */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider">
              Order Blotter & Execution Flow
            </span>
            <div className="flex items-center gap-1">
              {['ALL', 'FILLED', 'OPEN', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilter(st)}
                  className={`px-2 py-0.5 rounded text-[10px] transition ${
                    orderFilter === st ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2 px-3">Order ID</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Asset</th>
                <th className="py-2 px-3">Side</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Quantity</th>
                <th className="py-2 px-3">Price</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.map((ord) => {
                const isLong = ord.direction === 'LONG';
                return (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 text-slate-400">{ord.id}</td>
                    <td className="py-2 px-3 text-slate-300">
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 font-bold text-white">{ord.asset}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {ord.direction}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">{ord.type}</td>
                    <td className="py-2 px-3 text-slate-300">{ord.quantity}</td>
                    <td className="py-2 px-3 text-slate-200 font-semibold">
                      ${ord.price.toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ord.status === 'FILLED' ? 'bg-emerald-500/20 text-emerald-400' :
                        ord.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-sky-500/20 text-sky-400'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 truncate max-w-xs" title={ord.rejectionReason || 'Pre-trade risk criteria approved.'}>
                      {ord.rejectionReason ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {ord.rejectionReason}
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Validated (1.0% Risk Limit)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
