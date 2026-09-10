import React from 'react';
import { 
  Activity, 
  BarChart3, 
  BookOpen, 
  Bot, 
  Cpu, 
  FlaskConical, 
  History, 
  Layers, 
  LayoutDashboard, 
  Lock, 
  Radio, 
  Settings, 
  ShieldCheck, 
  SlidersHorizontal, 
  TrendingUp 
} from 'lucide-react';
import { useNexus } from '../context/NexusContext.js';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, positions, analysisSessions, settings } = useNexus();

  const isArabic = settings?.language === 'ar';
  const openPositionsCount = positions.length;
  const runningSessionsCount = analysisSessions.filter(s => s.status === 'RUNNING').length;

  const navItems: NavItem[] = [
    { 
      id: 'dashboard', 
      label: isArabic ? 'مركز القيادة والمراقبة' : 'Command Center', 
      icon: LayoutDashboard 
    },
    { 
      id: 'markets', 
      label: isArabic ? 'الأسواق والماسح اللحظي' : 'Markets & Screener', 
      icon: TrendingUp 
    },
    { 
      id: 'analysis', 
      label: isArabic ? 'جلسات تحليل الذكاء الاصطناعي' : 'AI Analysis Sessions', 
      icon: Cpu,
      badge: runningSessionsCount > 0 ? `${runningSessionsCount} ${isArabic ? 'نشط' : 'Active'}` : undefined
    },
    { 
      id: 'agents', 
      label: isArabic ? 'غرفة تحكم الوكلاء (10)' : 'Agent Control Room', 
      icon: Bot, 
      badge: '10' 
    },
    { 
      id: 'paper-trading', 
      label: isArabic ? 'منصة التداول التجريبي' : 'Paper Trading Board', 
      icon: Layers,
      badge: openPositionsCount > 0 ? openPositionsCount : undefined
    },
    { 
      id: 'strategies', 
      label: isArabic ? 'مختبر الاستراتيجيات' : 'Strategy Lab', 
      icon: FlaskConical 
    },
    { 
      id: 'backtesting', 
      label: isArabic ? 'محرك الاختبار الرجعي' : 'Backtesting Engine', 
      icon: BarChart3 
    },
    { 
      id: 'journal', 
      label: isArabic ? 'سجل الصفقات والتدوين' : 'Trade Journal', 
      icon: BookOpen 
    },
    { 
      id: 'performance', 
      label: isArabic ? 'تحليلات الأداء والربحية' : 'Performance Analytics', 
      icon: Activity 
    },
    { 
      id: 'alerts', 
      label: isArabic ? 'صحة النظام والتدقيق' : 'System Health & Audit', 
      icon: ShieldCheck 
    },
    { 
      id: 'settings', 
      label: isArabic ? 'إعدادات المنصة والمخاطر' : 'Desk Settings', 
      icon: Settings 
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0d111a] flex flex-col justify-between shrink-0 select-none">
      <div className="py-3 px-2 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          {isArabic ? 'منصة العمليات التداولية' : 'OPERATIONAL DESK'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Safety & Real-Trading Lock Notice */}
      <div className="p-3 m-2 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>{isArabic ? 'حماية التداول الفعلي مفعّلة' : 'REAL TRADING LOCKED'}</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isArabic 
            ? 'بيئة التداول الورقي التجريبي نشطة بأمان. مفاتيح التداول الفعلي مقفلة لحماية رأس المال وفق القواعد الصارمة.'
            : 'Simulated paper trading sandbox strictly enabled. Real exchange execution keys locked by deterministic protocol.'}
        </p>
      </div>
    </aside>
  );
};
