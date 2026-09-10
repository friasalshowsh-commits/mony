import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Bot, 
  CheckCircle2, 
  Globe, 
  Moon, 
  Pause, 
  Play, 
  Radar, 
  ShieldAlert, 
  Sun, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { useNexus } from '../context/NexusContext.js';

export const Header: React.FC = () => {
  const { 
    portfolio, 
    connected, 
    settings, 
    toggleSystemPause, 
    triggerScan, 
    setIsAssistantOpen, 
    isAssistantOpen, 
    updateSettings,
    switchDataMode
  } = useNexus();

  const isPaused = settings?.systemPaused ?? false;
  const isArabic = settings?.language === 'ar';
  const isDark = (settings?.theme ?? 'dark') === 'dark';
  const dataMode = settings?.dataMode || 'LIVE';
  const isLive = dataMode === 'LIVE';

  const todayPnL = portfolio?.dailyPnL ?? 0;
  const todayPnLPct = portfolio?.dailyPnLPercent ?? 0;
  const isProfit = todayPnL >= 0;

  return (
    <header className="border-b border-slate-800 bg-[#0d111a] px-4 py-2.5 select-none sticky top-0 z-30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & System Mode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              NX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base font-mono">
                  NEXUS TRADING AI
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isArabic ? 'تداول تجريبي آمن' : 'PAPER TRADING ● ACTIVE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isArabic ? 'منصة التداول الخوارزمي الموزع متعددة الوكلاء' : 'Autonomous Multi-Agent Quant & Execution Desk'}
              </p>
            </div>
          </div>

          {/* Realtime Stream Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300">
            {connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">{isArabic ? 'بث حي متصل' : 'STREAM LIVE'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-amber-400 font-medium">{isArabic ? 'جارٍ الاتصال...' : 'RECONNECTING...'}</span>
              </>
            )}
          </div>

          {/* Market Data Mode Switcher (LIVE Binance vs DEMO Simulation) */}
          <div className="flex items-center bg-slate-900 border border-slate-700/70 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => switchDataMode('LIVE')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 text-[11px] font-bold ${
                isLive 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isArabic ? 'بيانات السوق الحية عبر Binance WebSocket' : 'Live Binance WebSocket Market Feed'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-slate-950 animate-ping' : 'bg-slate-500'}`} />
              {isArabic ? 'بينانس مباشر' : 'BINANCE LIVE'}
            </button>
            <button
              onClick={() => switchDataMode('DEMO')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 text-[11px] font-bold ${
                !isLive 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isArabic ? 'وضع المحاكاة التجريبية للأسواق' : 'Simulated Market Feed'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${!isLive ? 'bg-slate-950' : 'bg-slate-500'}`} />
              {isArabic ? 'محاكاة DEMO' : 'SIMULATION'}
            </button>
          </div>
        </div>

        {/* Major KPI Tickers */}
        <div className="hidden lg:flex items-center gap-5 bg-slate-900/80 px-4 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              {isArabic ? 'قيمة المحفظة الإجمالية' : 'Portfolio Equity'}
            </div>
            <div className="text-sm font-bold text-white">
              ${(portfolio?.equity ?? 100000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              {isArabic ? 'أرباح اليوم PnL' : "Today's PnL"}
            </div>
            <div className={`text-sm font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfit ? '+' : ''}${todayPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] mx-1 font-normal opacity-80">
                ({isProfit ? '+' : ''}{todayPnLPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              {isArabic ? 'المخاطر المفتوحة' : 'Open Risk'}
            </div>
            <div className="text-sm font-semibold text-amber-300">
              ${(portfolio?.openRiskUsd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] mx-1 text-slate-400">
                ({(portfolio?.openRiskPercent ?? 0).toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              {isArabic ? 'الوكلاء النشطون' : 'Active Agents'}
            </div>
            <div className="text-sm font-bold text-sky-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              10 / 10
            </div>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Scan Trigger */}
          <button
            onClick={() => triggerScan()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition"
            title={isArabic ? 'مسح الأسواق وبدء تحليل الوكلاء الذاتيين' : 'Scan market and trigger autonomous multi-agent analysis'}
          >
            <Radar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isArabic ? 'مسح فوري' : 'Scan Market'}</span>
          </button>

          {/* Global Pause Control */}
          <button
            onClick={() => toggleSystemPause()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              isPaused 
                ? 'bg-rose-500 text-white border-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse' 
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
            title={isArabic ? 'إيقاف/استئناف تنفيذ صفقات النظام آلياً' : 'Pause all autonomous trading executions and new paper orders'}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isArabic ? 'النظام موقوف' : 'SYSTEM PAUSED'}</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isArabic ? 'إيقاف التنفيذ' : 'Pause Desk'}</span>
              </>
            )}
          </button>

          {/* Nexus AI Assistant Drawer Toggle */}
          <button
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isAssistantOpen 
                ? 'bg-purple-600 text-white border-purple-500' 
                : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{isArabic ? 'مساعد NEXUS' : 'NEXUS AI'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => updateSettings({ language: isArabic ? 'en' : 'ar' })}
            className="px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs font-mono border border-slate-700/60"
            title="Toggle Arabic / English language"
          >
            {isArabic ? 'EN' : 'عربي'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
