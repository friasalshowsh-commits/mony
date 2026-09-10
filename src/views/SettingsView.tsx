import React, { useState } from 'react';
import { 
  Bot, 
  Check, 
  DollarSign, 
  Lock, 
  Save, 
  Settings, 
  ShieldAlert, 
  ShieldCheck, 
  SlidersHorizontal 
} from 'lucide-react';
import { useNexus } from '../context/NexusContext.js';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useNexus();

  const [riskPerTrade, setRiskPerTrade] = useState<number>(settings?.riskSettings.maxRiskPerTradePercent ?? 1.0);
  const [maxDailyLoss, setMaxDailyLoss] = useState<number>(settings?.riskSettings.maxDailyLossPercent ?? 3.0);
  const [maxDrawdown, setMaxDrawdown] = useState<number>(settings?.riskSettings.maxDrawdownPercent ?? 10.0);
  const [maxOpenPositions, setMaxOpenPositions] = useState<number>(settings?.riskSettings.maxOpenPositions ?? 5);
  const [minRiskReward, setMinRiskReward] = useState<number>(settings?.riskSettings.minRiskReward ?? 1.5);
  const [maxAssetExposure, setMaxAssetExposure] = useState<number>(settings?.riskSettings.maxAssetExposurePercent ?? 20.0);

  // Agent weights
  const [techWeight, setTechWeight] = useState<number>(settings?.agentWeights.technical ?? 25);
  const [structureWeight, setStructureWeight] = useState<number>(settings?.agentWeights.marketStructure ?? 20);
  const [quantWeight, setQuantWeight] = useState<number>(settings?.agentWeights.quant ?? 15);
  const [newsWeight, setNewsWeight] = useState<number>(settings?.agentWeights.news ?? 10);
  const [sentimentWeight, setSentimentWeight] = useState<number>(settings?.agentWeights.sentiment ?? 10);
  const [onChainWeight, setOnChainWeight] = useState<number>(settings?.agentWeights.onChain ?? 10);
  const [macroWeight, setMacroWeight] = useState<number>(settings?.agentWeights.macro ?? 10);

  // AI & Paper Settings
  const [aiBudget, setAiBudget] = useState<number>(settings?.aiBudgetUsd ?? 50);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      riskSettings: {
        maxRiskPerTradePercent: riskPerTrade,
        maxDailyLossPercent: maxDailyLoss,
        maxDrawdownPercent: maxDrawdown,
        maxOpenPositions: maxOpenPositions,
        minRiskReward: minRiskReward,
        maxAssetExposurePercent: maxAssetExposure
      },
      agentWeights: {
        technical: techWeight,
        marketStructure: structureWeight,
        quant: quantWeight,
        news: newsWeight,
        sentiment: sentimentWeight,
        onChain: onChainWeight,
        macro: macroWeight
      },
      aiBudgetUsd: aiBudget
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const totalWeights = techWeight + structureWeight + quantWeight + newsWeight + sentimentWeight + onChainWeight + macroWeight;

  return (
    <div className="p-4 max-w-[1200px] mx-auto space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            DESK RISK & MULTI-AGENT GOVERNANCE SETTINGS
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Configure hard risk caps, agent decision weights, and AI runtime parameters.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold animate-fade-in">
            <Check className="w-4 h-4" />
            <span>Parameters Saved Successfully</span>
          </div>
        )}
      </div>

      {/* Security Real Trading Notice */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-white uppercase">Real Trading Keys Disabled</h3>
          <p className="text-slate-400 font-sans text-xs leading-relaxed mt-1">
            Nexus operates exclusively in simulated paper trading mode. Live order submission to exchange order books is blocked at the hardware & container ingress layer to protect user capital.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Deterministic Risk Engine Hard Caps */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Deterministic Risk Engine Hard Limits (Cannot be overridden by AI)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Max Risk Per Trade: <strong className="text-white">{riskPerTrade}%</strong>
              </label>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(parseFloat(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Recommended: 1.0% of portfolio equity</span>
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Max Daily Loss Limit: <strong className="text-white">{maxDailyLoss}%</strong>
              </label>
              <input
                type="range"
                min="1.0"
                max="6.0"
                step="0.5"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(parseFloat(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Triggers desk shutdown if breached</span>
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Max Portfolio Drawdown Cap: <strong className="text-white">{maxDrawdown}%</strong>
              </label>
              <input
                type="range"
                min="5.0"
                max="20.0"
                step="1.0"
                value={maxDrawdown}
                onChange={(e) => setMaxDrawdown(parseFloat(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Max peak-to-trough allowance</span>
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Max Concurrent Open Positions: <strong className="text-white">{maxOpenPositions}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={maxOpenPositions}
                onChange={(e) => setMaxOpenPositions(parseInt(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Prevents collateral over-commitment</span>
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Minimum Risk-to-Reward (R:R): <strong className="text-white">{minRiskReward}x</strong>
              </label>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={minRiskReward}
                onChange={(e) => setMinRiskReward(parseFloat(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Rejects trades below positive expectancy</span>
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Max Single Asset Exposure: <strong className="text-white">{maxAssetExposure}%</strong>
              </label>
              <input
                type="range"
                min="5.0"
                max="35.0"
                step="1.0"
                value={maxAssetExposure}
                onChange={(e) => setMaxAssetExposure(parseFloat(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Diversification guardrail</span>
            </div>
          </div>
        </div>

        {/* Multi-Agent Decision Weights */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase">
              <Bot className="w-4 h-4" />
              <span>Multi-Agent Consensus Weights</span>
            </div>
            <span className={`text-[10px] font-bold ${totalWeights === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              Total Weight: {totalWeights}% {totalWeights !== 100 && '(Normalizes proportionally)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Technical Agent: <strong className="text-white">{techWeight}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={techWeight}
                onChange={(e) => setTechWeight(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Market Structure: <strong className="text-white">{structureWeight}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={structureWeight}
                onChange={(e) => setStructureWeight(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Quantitative: <strong className="text-white">{quantWeight}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={quantWeight}
                onChange={(e) => setQuantWeight(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                News Intelligence: <strong className="text-white">{newsWeight}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={newsWeight}
                onChange={(e) => setNewsWeight(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Sentiment & OI: <strong className="text-white">{sentimentWeight}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={sentimentWeight}
                onChange={(e) => setSentimentWeight(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                On-Chain Flows: <strong className="text-white">{onChainWeight}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={onChainWeight}
                onChange={(e) => setOnChainWeight(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Macro & Rates: <strong className="text-white">{macroWeight}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={macroWeight}
                onChange={(e) => setMacroWeight(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* AI Budget */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
            <DollarSign className="w-4 h-4" />
            <span>AI Inference Daily Budget Cap ($)</span>
          </div>

          <div className="max-w-xs">
            <input
              type="number"
              min="5"
              max="500"
              value={aiBudget}
              onChange={(e) => setAiBudget(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-amber-500"
            />
            <span className="text-[10px] text-slate-400 block mt-1">Stops LLM calls if daily cost exceeds budget limit</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
          >
            <Save className="w-4 h-4" />
            <span>Apply Desk Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
