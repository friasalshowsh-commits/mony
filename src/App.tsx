import React from 'react';
import { AssistantDrawer } from './components/AssistantDrawer.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { NexusProvider, useNexus } from './context/NexusContext.js';
import { AgentsView } from './views/AgentsView.js';
import { AlertsView } from './views/AlertsView.js';
import { AnalysisView } from './views/AnalysisView.js';
import { BacktestView } from './views/BacktestView.js';
import { DashboardView } from './views/DashboardView.js';
import { MarketsView } from './views/MarketsView.js';
import { PaperTradingView } from './views/PaperTradingView.js';
import { PerformanceView } from './views/PerformanceView.js';
import { SettingsView } from './views/SettingsView.js';
import { StrategyLabView } from './views/StrategyLabView.js';
import { TradeJournalView } from './views/TradeJournalView.js';

const MainLayout: React.FC = () => {
  const { activeView, settings } = useNexus();
  const isArabic = settings?.language === 'ar';

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'markets':
        return <MarketsView />;
      case 'analysis':
        return <AnalysisView />;
      case 'agents':
        return <AgentsView />;
      case 'paper-trading':
        return <PaperTradingView />;
      case 'strategies':
        return <StrategyLabView />;
      case 'backtesting':
        return <BacktestView />;
      case 'journal':
        return <TradeJournalView />;
      case 'performance':
        return <PerformanceView />;
      case 'alerts':
        return <AlertsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div 
      className={`min-h-screen flex flex-col bg-[#080b11] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 ${
        isArabic ? 'rtl' : 'ltr'
      }`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#080b11]">
          {renderView()}
        </main>
      </div>
      <AssistantDrawer />
    </div>
  );
};

export default function App() {
  return (
    <NexusProvider>
      <MainLayout />
    </NexusProvider>
  );
}
