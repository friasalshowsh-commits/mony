import React, { useState } from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  BarChart2, 
  Bot, 
  Layers, 
  Radar, 
  SlidersHorizontal, 
  TrendingUp 
} from 'lucide-react';
import { TradingChart } from '../components/TradingChart.js';
import { useNexus } from '../context/NexusContext.js';

export const MarketsView: React.FC = () => {
  const { tickers, selectedAsset, setSelectedAsset, triggerScan } = useNexus();
  const [activeTab, setActiveTab] = useState<'screener' | 'depth' | 'indicators'>('screener');

  const selectedTicker = tickers.find(t => t.symbol === selectedAsset) || tickers[0];

  // Mock sample candles for the selected ticker
  const basePrice = selectedTicker?.price || 64000;
  const now = Date.now();
  const sampleCandles = Array.from({ length: 45 }).map((_, i) => {
    const timestamp = now - (45 - i) * 3600000;
    const p = basePrice * (0.96 + (i / 45) * 0.04 + (Math.sin(i / 3) * 0.007));
    return {
      timestamp,
      time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: parseFloat((p * 0.998).toFixed(2)),
      high: parseFloat((p * 1.003).toFixed(2)),
      low: parseFloat((p * 0.997).toFixed(2)),
      close: parseFloat(p.toFixed(2)),
      volume: 15000 + Math.floor(Math.random() * 6000)
    };
  });

  // Simulated orderbook depth
  const bids = [
    { price: basePrice * 0.999, size: 2.45, total: 2.45 },
    { price: basePrice * 0.998, size: 4.12, total: 6.57 },
    { price: basePrice * 0.997, size: 8.89, total: 15.46 },
    { price: basePrice * 0.996, size: 12.30, total: 27.76 },
    { price: basePrice * 0.995, size: 18.50, total: 46.26 },
  ];

  const asks = [
    { price: basePrice * 1.001, size: 3.10, total: 3.10 },
    { price: basePrice * 1.002, size: 5.60, total: 8.70 },
    { price: basePrice * 1.003, size: 7.90, total: 16.60 },
    { price: basePrice * 1.004, size: 11.20, total: 27.80 },
    { price: basePrice * 1.005, size: 16.40, total: 44.20 },
  ];

  return (
    <div className="p-4 max-w-[1700px] mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            LIVE MARKET INTELLIGENCE & MULTI-ASSET SCREENER
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Realtime spot/perpetual ticker pricing, order flow sweeps, and quantitative indicator matrices.
          </p>
        </div>

        <button
          onClick={() => triggerScan(selectedAsset)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40 text-xs font-bold font-mono transition"
        >
          <Radar className="w-3.5 h-3.5" />
          <span>Analyze {selectedAsset}</span>
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Chart & Sub-panels */}
        <div className="lg:col-span-2 space-y-4">
          <TradingChart symbol={selectedAsset} candles={sampleCandles} />

          {/* Sub-panel Tabs */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 font-mono text-xs">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
              <button
                onClick={() => setActiveTab('screener')}
                className={`px-3 py-1 rounded text-xs transition ${activeTab === 'screener' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Market Screener Table
              </button>
              <button
                onClick={() => setActiveTab('depth')}
                className={`px-3 py-1 rounded text-xs transition ${activeTab === 'depth' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Order Book Depth
              </button>
              <button
                onClick={() => setActiveTab('indicators')}
                className={`px-3 py-1 rounded text-xs transition ${activeTab === 'indicators' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Technical Indicator Matrix
              </button>
            </div>

            {activeTab === 'screener' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="py-2 px-3">Asset</th>
                      <th className="py-2 px-3">Price</th>
                      <th className="py-2 px-3">24h Change</th>
                      <th className="py-2 px-3">24h High / Low</th>
                      <th className="py-2 px-3">Volume</th>
                      <th className="py-2 px-3">Regime</th>
                      <th className="py-2 px-3">AI Score</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tickers.map((t) => {
                      const isUp = t.change24h >= 0;
                      const isSelected = t.symbol === selectedAsset;
                      return (
                        <tr
                          key={t.symbol}
                          onClick={() => setSelectedAsset(t.symbol)}
                          className={`hover:bg-slate-800/40 transition cursor-pointer ${isSelected ? 'bg-slate-800/30' : ''}`}
                        >
                          <td className="py-2.5 px-3 font-bold text-white">{t.symbol}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-200">
                            ${t.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-2.5 px-3 font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isUp ? '+' : ''}{t.change24h}%
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            ${t.high24h.toLocaleString()} / ${t.low24h.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            ${(t.volume24h / 1e6).toFixed(1)}M
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] uppercase text-slate-300">
                              {t.marketRegime}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-indigo-400 font-bold">
                            {t.aiScore}/100
                          </td>
                          <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => triggerScan(t.symbol)}
                              className="px-2 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 text-[11px] font-medium transition"
                            >
                              Analyze
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'depth' && (
              <div className="grid grid-cols-2 gap-4">
                {/* Bids */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">
                    Bids (Buy Orders)
                  </div>
                  <div className="space-y-1">
                    {bids.map((b, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-800/40">
                        <span className="text-emerald-400">${b.price.toFixed(2)}</span>
                        <span className="text-slate-300">{b.size}</span>
                        <span className="text-slate-400">{b.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asks */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-rose-400 mb-1">
                    Asks (Sell Orders)
                  </div>
                  <div className="space-y-1">
                    {asks.map((a, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-800/40">
                        <span className="text-rose-400">${a.price.toFixed(2)}</span>
                        <span className="text-slate-300">{a.size}</span>
                        <span className="text-slate-400">{a.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'indicators' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">RSI (14)</span>
                  <span className="text-base font-bold text-emerald-400">58.4</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Mild Bullish Momentum</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">MACD Trend</span>
                  <span className="text-base font-bold text-indigo-400">BULLISH</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Histogram +42.5</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">EMA Alignment</span>
                  <span className="text-base font-bold text-emerald-400">STRONG_BULL</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">20 &gt; 50 &gt; 200 EMA</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">ATR Volatility</span>
                  <span className="text-base font-bold text-amber-400">$640</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Dynamic Stop Multiplier 1.4x</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Asset Details & Quick Stats */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 font-mono text-xs space-y-3">
            <div className="text-[10px] uppercase text-slate-400 font-bold">
              {selectedTicker.symbol} Quantitative Profile
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Market Regime:</span>
                <span className="font-bold text-white uppercase">{selectedTicker.marketRegime}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Momentum Trend:</span>
                <span className="font-bold text-emerald-400">{selectedTicker.trend}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>AI Confidence Score:</span>
                <span className="font-bold text-indigo-400">{selectedTicker.aiScore} / 100</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>24h Range:</span>
                <span className="text-white">${selectedTicker.low24h.toLocaleString()} - ${selectedTicker.high24h.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Funding Rate:</span>
                <span className="text-emerald-400">+0.0084% (8h)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Open Interest:</span>
                <span className="text-white">$14.2B</span>
              </div>
            </div>

            <button
              onClick={() => triggerScan(selectedTicker.symbol)}
              className="w-full py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Dispatch Full Multi-Agent Swarm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
