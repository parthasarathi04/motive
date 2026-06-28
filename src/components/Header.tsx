import React from 'react';
import { useMotive } from '../contexts/MotiveContext';
import { RefreshCw, Cloud, CloudOff, LogOut, Moon, Sun, Laptop, Bell, Plus, Menu, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    isSyncing, 
    syncGoogleCalendar, 
    syncGmail, 
    settings, 
    updateSettings, 
    clearAllData, 
    setActiveView, 
    isMobileSidebarOpen, 
    setIsMobileSidebarOpen,
    activeView,
    isAiSidebarOpen,
    setIsAiSidebarOpen,
    isSidebarCollapsed
  } = useMotive();

  const handleManualSync = async () => {
    if (isSyncing) return;
    await Promise.all([syncGoogleCalendar(), syncGmail()]);
  };

  const isCloud = localStorage.getItem('motive_use_cloud') === 'true';

  const toggleCloudMode = () => {
    if (isCloud) {
      localStorage.removeItem('motive_use_cloud');
    } else {
      localStorage.setItem('motive_use_cloud', 'true');
    }
    window.location.reload();
  };

  const currentTheme = settings?.theme || 'LIGHT';

  const cycleTheme = () => {
    const next: Record<string, 'LIGHT' | 'DARK' | 'SYSTEM'> = {
      DARK: 'LIGHT',
      LIGHT: 'SYSTEM',
      SYSTEM: 'DARK'
    };
    updateSettings({ theme: next[currentTheme] });
  };

  // Dynamic header details based on view
  const getHeaderDetails = () => {
    switch (activeView) {
      case 'goals':
        return {
          title: "Active Directional Goals",
          sub: "AI sequence modeling & dependency mapping"
        };
      case 'calendar':
        return {
          title: "Timeline Planner",
          sub: "Daily schedules, focus blocks, and routines"
        };
      case 'commitments':
        return {
          title: "Focus & Execution Workspace",
          sub: "Prioritize, execute, and accomplish objectives"
        };
      case 'insights':
        return {
          title: "AI Retro: Execution Health",
          sub: "Performance vectors and dynamic calibration feedback"
        };
      case 'dashboard':
      default: {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        return {
          title: `${greeting}, Partha! 👋`,
          sub: "Here's what's happening with your plans today."
        };
      }
    }
  };

  const { title: headerTitle, sub: headerSub } = getHeaderDetails();

  return (
    <header className={`h-14 border-b border-slate-100 dark:border-zinc-900 bg-white/80 dark:bg-[#0c0d0e]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 ${isSidebarCollapsed ? 'lg:pl-[96px]' : 'lg:pl-[280px]'} transition-all duration-300`}>
      
      {/* Dynamic Header left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-1.5 rounded-lg border border-slate-100 dark:border-zinc-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-900 lg:hidden cursor-pointer flex-shrink-0"
          aria-label="Toggle Menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex flex-col text-left">
          <h1 className="text-[13.5px] sm:text-[14.5px] font-bold text-slate-900 dark:text-zinc-50 tracking-tight leading-none">
            {headerTitle}
          </h1>
          <p className="text-[9.5px] text-slate-450 dark:text-zinc-500 font-bold font-mono uppercase tracking-wider mt-1 hidden md:block">
            {headerSub}
          </p>
        </div>
      </div>

      {/* Spacer for mobile search/alignment */}
      <div className="md:hidden flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* AI Chief of Staff Toggle Button */}
        <button
          onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            isAiSidebarOpen
              ? 'bg-indigo-600 text-white border-indigo-750 dark:bg-indigo-500 dark:border-indigo-600 shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-900 text-indigo-600 hover:text-indigo-750 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
          }`}
          title="Toggle AI Chief of Staff"
        >
          <Sparkles className={`h-3.5 w-3.5 ${isAiSidebarOpen ? 'fill-current/20 text-white' : 'text-indigo-500 animate-pulse'}`} />
          <span className="hidden sm:inline">Ask AI</span>
        </button>

        {/* Storage State Switcher */}
        <button
          onClick={toggleCloudMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            isCloud 
              ? 'bg-emerald-600/10 text-emerald-800 border-emerald-600/15 dark:text-emerald-400 dark:border-emerald-500/10'
              : 'bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 border-slate-100 dark:border-zinc-900'
          }`}
          title={isCloud ? "Cloud Synced via Firebase" : "Offline / Demo Sandbox Mode"}
        >
          {isCloud ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
          <span className="font-mono text-[8px] tracking-wider uppercase font-bold hidden sm:inline">
            {isCloud ? 'Firebase' : 'Sandbox'}
          </span>
        </button>

        {/* Sync Status Button */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`p-1.5 rounded-lg border border-slate-100 dark:border-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer ${isSyncing ? 'animate-spin opacity-50' : ''}`}
          title="Sync GMail & Google Calendar"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>

        {/* Theme Cycler */}
        <button
          onClick={cycleTheme}
          className="p-1.5 rounded-lg border border-slate-100 dark:border-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
          title={`Cycle theme: Current ${currentTheme}`}
        >
          {currentTheme === 'DARK' && <Moon className="h-3.5 w-3.5 text-emerald-500" />}
          {currentTheme === 'LIGHT' && <Sun className="h-3.5 w-3.5 text-amber-500" />}
          {currentTheme === 'SYSTEM' && <Laptop className="h-3.5 w-3.5" />}
        </button>

        {/* Notification Bell Badge */}
        <button 
          className="relative p-1.5 rounded-lg border border-slate-100 dark:border-zinc-900 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>

      </div>
    </header>
  );
};
export default Header;
