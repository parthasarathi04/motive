import React from 'react';
import { MotiveProvider, useMotive } from './contexts/MotiveContext';
import { RecommendationSection } from './components/RecommendationSection';
import { GoalSection } from './components/GoalSection';
import { CommitmentsSection } from './components/CommitmentsSection';
import { CalendarSection } from './components/CalendarSection';
import { SettingsSection } from './components/SettingsSection';
import { AISidebar } from './components/AISidebar';
import { TimelineSection } from './components/TimelineSection';
import { LandingPage } from './components/LandingPage';
import { BusinessEngine } from './utils/BusinessEngine';
import { 
  Compass, 
  Target, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  LineChart, 
  User, 
  Plus, 
  ArrowUpRight, 
  HelpCircle,
  Trophy,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  TrendingUp,
  Clock,
  Home,
  Mail,
  Settings,
  ChevronRight,
  ChevronDown,
  Brain,
  Briefcase,
  Zap,
  Bell,
  Search,
  ArrowRight,
  Sparkle,
  Layers,
  BarChart3,
  CalendarCheck2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Sun,
  Moon,
  Laptop,
  Cloud,
  CloudOff,
  RefreshCw,
  X
} from 'lucide-react';
import { LogIn, Trash2 } from 'lucide-react';

const RadialProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 22;
  const strokeWidth = 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-14 w-14 flex items-center justify-center shrink-0">
      <svg className="absolute -rotate-90 w-14 h-14">
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="stroke-slate-100 dark:stroke-zinc-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="stroke-emerald-600 dark:stroke-emerald-500 transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <span className="text-[11px] font-bold text-slate-900 dark:text-zinc-50">{percentage}%</span>
    </div>
  );
};

const ProductivityTrendChart: React.FC = () => {
  const data = [
    { day: 'Mon', value: 3 },
    { day: 'Tue', value: 5 },
    { day: 'Wed', value: 4 },
    { day: 'Thu', value: 7 },
    { day: 'Fri', value: 6 },
    { day: 'Sat', value: 8 },
    { day: 'Sun', value: 11 },
  ];

  const width = 280;
  const height = 90;
  const padding = 12;
  
  const maxVal = 12;
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - (d.value / maxVal) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full h-24">
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          <line x1="0" y1={height - padding} x2={width} y2={height - padding} className="stroke-slate-100 dark:stroke-zinc-850" strokeWidth={1} />
          
          <path d={areaD} fill="url(#chartGradient)" />

          <path
            d={pathD}
            fill="none"
            className="stroke-emerald-600 dark:stroke-emerald-500"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3.5}
              className="fill-emerald-600 dark:fill-emerald-500 stroke-white dark:stroke-[#131415] cursor-pointer"
              strokeWidth={1.5}
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-between w-full px-1 text-[10px] font-mono font-medium text-slate-400 dark:text-zinc-500 mt-2">
        {data.map((d, i) => (
          <span key={i}>{d.day}</span>
        ))}
      </div>
    </div>
  );
};

const getLogoFontClass = (font?: string) => {
  switch (font) {
    case 'protest-gorilla': return 'font-protest-gorilla';
    case 'emblema-one': return 'font-emblema-one';
    case 'keania-one': return 'font-keania-one';
    case 'kenia': return 'font-kenia';
    default: return 'font-plaster';
  }
};

const Sidebar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    goals, 
    commitments, 
    userProfile, 
    clearAllData, 
    isMobileSidebarOpen, 
    setIsMobileSidebarOpen, 
    isSidebarCollapsed, 
    setIsSidebarCollapsed, 
    signOutUser, 
    isSandbox,
    isSyncing,
    syncGoogleCalendar,
    syncEmail,
    settings,
    updateSettings,
    signInWithGoogle,
    isAiSidebarOpen,
    setIsAiSidebarOpen
  } = useMotive();

  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [notificationsRead, setNotificationsRead] = React.useState(false);

  const totalGoals = goals.length;
  const pendingCommitments = commitments.filter(c => c.status !== 'COMPLETED').length;

  interface MenuItem {
    id: 'dashboard' | 'goals' | 'calendar' | 'commitments';
    label: string;
    icon: React.ReactNode;
    badge?: number;
    disabled?: boolean;
  }

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Workspace', icon: <Home className="h-[15px] w-[15px]" /> },
    { id: 'calendar', label: 'Timeline', icon: <CalendarIcon className="h-[15px] w-[15px]" /> },
    { id: 'goals', label: 'Goals', icon: <Target className="h-[15px] w-[15px]" />, badge: totalGoals > 0 ? totalGoals : undefined },
    { id: 'commitments', label: 'Commitments', icon: <CheckSquare className="h-[15px] w-[15px]" />, badge: pendingCommitments > 0 ? pendingCommitments : undefined },
  ];

  const staticItems = [
    { label: 'Habits', icon: <Flame className="h-[16px] w-[16px]" /> },
    { label: 'Analytics', icon: <BarChart3 className="h-[16px] w-[16px]" /> },
  ];

  const handleManualSync = async () => {
    if (isSyncing) return;
    await Promise.all([syncGoogleCalendar(), syncEmail()]);
  };

  const currentTheme = settings?.theme || 'SYSTEM';

  const selectTheme = (theme: 'LIGHT' | 'DARK' | 'SYSTEM') => {
    updateSettings({ theme });
  };

  const activeNotifications = React.useMemo(() => {
    const list: { id: string; title: string; desc: string; type: 'info' | 'success' | 'warning' }[] = [];

    // 1. Calendar/Sync status
    if (settings?.calendarSync) {
      const todayComms = commitments.filter(c => {
        if (!c.startTime) return false;
        return new Date(c.startTime).toDateString() === new Date().toDateString();
      });
      list.push({
        id: 'workspace-sync',
        title: 'Workspace Calendar Synced',
        desc: `Your calendar is active and connected. You have ${todayComms.length} timeline commitments scheduled for today.`,
        type: 'success'
      });
    }

    // 2. Schedule conflicts (Overlapping events)
    const conflicts = BusinessEngine.detectConflicts(commitments);
    if (conflicts.length > 0) {
      list.push({
        id: 'timeline-conflict',
        title: 'Timeline Conflicts Detected',
        desc: `Motive found ${conflicts.length} overlapping timeline ${conflicts.length === 1 ? 'block' : 'blocks'}. Overlapping events are now displayed side-by-side; ask Mo to reschedule to resolve permanently.`,
        type: 'warning'
      });
    }

    // 3. Overdue commitments
    const now = new Date();
    const overdueComms = commitments.filter(c => {
      if (c.status === 'COMPLETED' || c.status === 'CANCELLED') return false;
      const date = c.scheduledStart ? new Date(c.scheduledStart) : (c.startTime ? new Date(c.startTime) : null);
      return date && date < now && date.toDateString() !== now.toDateString();
    });

    if (overdueComms.length > 0) {
      list.push({
        id: 'overdue-commitments',
        title: 'Overdue Action Items Found',
        desc: `You have ${overdueComms.length} uncompleted ${overdueComms.length === 1 ? 'task' : 'tasks'} past the scheduled deadline. Update their schedules to preserve execution velocity.`,
        type: 'warning'
      });
    }

    // 4. High risk goals
    const highRiskGoals = goals.filter(g => {
      const risk = BusinessEngine.calculateGoalRisk(g, commitments, []);
      return risk === 'HIGH' || risk === 'MEDIUM';
    });

    if (highRiskGoals.length > 0) {
      const firstGoal = highRiskGoals[0];
      list.push({
        id: `goal-risk-${firstGoal.id}`,
        title: `Goal Velocity At Risk: ${firstGoal.title}`,
        desc: `This objective is flagged with low momentum. Schedule active focus blocks this week to secure milestones.`,
        type: 'warning'
      });
    }

    // 5. Completion velocity celebration
    const pastWeekComms = commitments.filter(c => {
      if (c.status !== 'COMPLETED') return false;
      const date = c.updatedAt ? new Date(c.updatedAt) : null;
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date && date >= oneWeekAgo;
    });

    if (pastWeekComms.length >= 3) {
      list.push({
        id: 'completion-streak',
        title: 'Excellent Completion Velocity',
        desc: `You completed ${pastWeekComms.length} commitments this past week! Your execution velocity is exceptionally high.`,
        type: 'success'
      });
    }

    // Fallback info notification
    if (list.length === 0) {
      list.push({
        id: 'motive-intelligence',
        title: 'AI Execution Engine Calibrated',
        desc: 'Workspace schedules optimized and balanced. Track commitments and milestones to let Mo analyze your performance trends.',
        type: 'info'
      });
    }

    return list;
  }, [commitments, goals, settings]);

  const notificationCount = notificationsRead ? 0 : activeNotifications.length;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-[2px] z-40 lg:hidden transition-all duration-300"
        />
      )}

      <aside className={`border-r border-slate-100 dark:border-zinc-900 bg-white dark:bg-[#090a0b] flex flex-col h-screen fixed left-0 top-0 select-none p-4 pt-6 justify-between z-40 transition-all duration-300 ease-in-out ${
        isMobileSidebarOpen 
          ? 'w-[260px] translate-x-0' 
          : `${isSidebarCollapsed ? 'lg:w-[76px]' : 'lg:w-[260px]'} w-[260px] -translate-x-full lg:translate-x-0`
      }`}>
        <div className="space-y-6">
          {/* Brand / Title section */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center lg:px-0' : 'justify-between px-1'} select-none relative group/brand`}>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
                <span className={`${getLogoFontClass(settings?.logoFont)} text-xs text-white font-bold leading-none`}>
                  m
                </span>
              </div>
              {!isSidebarCollapsed && (
                <div className="animate-in fade-in duration-150">
                  <h1 className={`text-[17px] font-black text-slate-950 dark:text-white tracking-wider leading-none ${getLogoFontClass(settings?.logoFont)} lowercase`}>
                    motive
                  </h1>
                  <p className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold tracking-wider font-mono mt-0.5 uppercase">
                    Mo — AI Execution Companion
                  </p>
                </div>
              )}
            </div>

            {/* Collapse/Expand Buttons */}
            {!isSidebarCollapsed ? (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="opacity-0 group-hover/brand:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-md transition-all duration-150 cursor-pointer hidden lg:block"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="absolute inset-0 opacity-0 group-hover/brand:opacity-100 flex items-center justify-center bg-white/90 dark:bg-[#090a0b]/90 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-all duration-150 cursor-pointer hidden lg:flex"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation list */}
          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-lg text-[12.5px] font-medium transition-all cursor-pointer ${
                    isSidebarCollapsed 
                      ? 'justify-center py-2 px-0' 
                      : 'justify-between px-3 py-2'
                  } ${
                    isActive 
                      ? 'bg-slate-100 text-slate-950 dark:bg-zinc-900 dark:text-zinc-50' 
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center relative' : 'gap-3'}`}>
                    <div className={`${isActive ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-400 dark:text-zinc-500'} shrink-0`}>
                      {item.icon}
                    </div>
                    {!isSidebarCollapsed && <span className="animate-in fade-in duration-150">{item.label}</span>}
                    
                    {/* Collapsed active dot badge */}
                    {isSidebarCollapsed && item.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full border border-white dark:border-[#090a0b] bg-emerald-500" />
                    )}
                  </div>
                  {!isSidebarCollapsed && item.badge !== undefined && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-100 dark:bg-zinc-900 text-slate-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Separator */}
            <div className="h-px bg-slate-100 dark:bg-zinc-900 my-3.5 mx-1" />

            {staticItems.map((item, idx) => (
              <div
                key={idx}
                title={isSidebarCollapsed ? `${item.label} (Soon)` : undefined}
                className={`w-full flex items-center rounded-lg text-[12.5px] font-medium text-slate-400 dark:text-zinc-500 cursor-not-allowed group relative ${
                  isSidebarCollapsed ? 'justify-center py-2 px-0' : 'justify-between px-3 py-2'
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className="text-slate-300 dark:text-zinc-800 shrink-0">
                    {item.icon}
                  </div>
                  {!isSidebarCollapsed && <span className="animate-in fade-in duration-150">{item.label}</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="opacity-0 group-hover:opacity-100 absolute right-3 bg-slate-950 text-white text-[8px] px-1.5 py-0.5 rounded transition-all font-mono font-normal">Soon</span>
                )}
              </div>
            ))}

            {/* Interactive Settings and Notifications */}
            <div className="h-px bg-slate-100 dark:bg-zinc-900 my-3.5 mx-1" />

            {/* Notifications Button */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className={`group w-full flex items-center rounded-lg text-[12.5px] font-medium transition-all cursor-pointer relative ${
                isSidebarCollapsed ? 'justify-center py-2 px-0' : 'justify-between px-3 py-2'
              } text-slate-500 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-900/60`}
              title={isSidebarCollapsed ? `Notifications (${notificationCount})` : undefined}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <Bell className="h-[16px] w-[16px] text-slate-400 group-hover:text-slate-950 dark:group-hover:text-zinc-50 transition-colors" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
                {!isSidebarCollapsed && <span>Notifications</span>}
              </div>
              {!isSidebarCollapsed && notificationCount > 0 && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => {
                setActiveView('settings');
                setIsMobileSidebarOpen(false);
              }}
              className={`group w-full flex items-center rounded-lg text-[12.5px] font-medium transition-all cursor-pointer ${
                isSidebarCollapsed ? 'justify-center py-2 px-0' : 'justify-between px-3 py-2'
              } ${
                activeView === 'settings'
                  ? 'bg-slate-100 text-slate-950 dark:bg-zinc-900 dark:text-zinc-50'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-900/60'
              }`}
              title={isSidebarCollapsed ? 'Settings' : undefined}
            >
              <div className="flex items-center gap-3">
                <Settings className={`h-[16px] w-[16px] transition-colors shrink-0 ${activeView === 'settings' ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-400 group-hover:text-slate-950 dark:group-hover:text-zinc-50'}`} />
                {!isSidebarCollapsed && <span>Settings</span>}
              </div>
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          {/* Mo Companion Sleek Icon-only button above bottom profile */}
          <div className="flex justify-center">
            <button
              onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer select-none relative ${
                isAiSidebarOpen
                  ? 'bg-indigo-600/15 dark:bg-indigo-500/15 border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-[#111213] border border-slate-200/50 dark:border-zinc-850/50 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 shadow-xs'
              }`}
              title="Mo"
            >
              <Sparkles className={`h-5 w-5 ${isAiSidebarOpen ? 'animate-pulse text-indigo-500' : 'text-slate-400 transition-colors'}`} />
              {/* Dot indicator */}
              {!isAiSidebarOpen && (
                <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                </span>
              )}
            </button>
          </div>

          {/* Profile container */}
          <div className={`border-t border-slate-100 dark:border-zinc-900 pt-3.5 flex items-center ${isSidebarCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between px-1'}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
              <img 
                src={userProfile?.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} 
                alt={userProfile?.name || "Guest Pilot"}
                className="h-8 w-8 rounded-full border border-slate-100 dark:border-zinc-900 object-cover shrink-0"
                referrerPolicy="no-referrer"
                title={isSidebarCollapsed ? userProfile?.name : undefined}
              />
              {!isSidebarCollapsed && (
                <div className="text-left animate-in fade-in duration-150">
                  <p className="text-[11.5px] font-bold text-slate-800 dark:text-zinc-200 leading-tight truncate max-w-[130px]">
                    {userProfile?.name || "Guest Pilot"}
                  </p>
                </div>
              )}
            </div>
            <button 
              onClick={signOutUser}
              className="p-1.5 rounded-lg border border-slate-100 dark:border-zinc-900 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer shrink-0"
              title={isSandbox ? "Reset Sandbox" : "Sign Out"}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>



      {/* Modern Premium Notifications Right Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 bg-slate-950/20 dark:bg-black/40 backdrop-blur-[2px] z-50 flex justify-end">
          {/* Backdrop Overlay */}
          <div 
            className="absolute inset-0" 
            onClick={() => setIsNotificationsOpen(false)} 
          />
          
          <div className="bg-white dark:bg-[#0c0d0e] border-l border-slate-150 dark:border-zinc-800 w-full max-w-sm h-full shadow-2xl p-6 flex flex-col justify-between relative z-10 animate-in slide-in-from-right duration-250 text-left">
            <div>
              <button 
                onClick={() => setIsNotificationsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-3 mt-4">
                <div className="space-y-0.5">
                  <h3 className="text-[14px] font-bold text-slate-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-emerald-500 animate-pulse" />
                    Execution Inbox
                  </h3>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-medium font-sans">Real-time alerts and assistant suggestions.</p>
                </div>
                {notificationCount > 0 && (
                  <button
                    onClick={() => setNotificationsRead(true)}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-3 mt-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
                {notificationCount > 0 ? (
                  activeNotifications.map((n) => (
                    <div 
                      key={n.id}
                      className="p-3.5 bg-slate-50/75 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-900/80 rounded-xl space-y-1 relative hover:border-slate-200 dark:hover:border-zinc-800 transition-all"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <h4 className="text-[11.5px] font-bold text-slate-800 dark:text-zinc-200 font-sans">{n.title}</h4>
                      </div>
                      <p className="text-[10.5px] text-slate-450 dark:text-zinc-500 font-medium leading-relaxed pl-3 font-sans">
                        {n.desc}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-slate-400 dark:text-zinc-500 flex flex-col items-center justify-center">
                    <Bell className="h-8 w-8 text-slate-200 dark:text-zinc-850 mb-2.5" />
                    <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">All caught up!</p>
                    <p className="text-[10px] text-slate-450 dark:text-zinc-500 mt-0.5 font-sans">No unread notifications in this channel.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-900">
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="w-full py-2.5 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-850 border border-slate-150 dark:border-zinc-850 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer font-sans"
              >
                Close Inbox
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DashboardView: React.FC = () => {
  const { goals, commitments, recommendations, relationships, setActiveView, plannerResult } = useMotive();

  const activeGoalsList = goals.filter(g => g.status === 'ACTIVE' || g.status === 'PLANNING');
  const activeGoalsCount = activeGoalsList.length;

  let onTrackGoalsCount = 0;
  let atRiskGoalsCount = 0;
  activeGoalsList.forEach(g => {
    const risk = BusinessEngine.calculateGoalRisk(g, commitments, relationships);
    if (risk === 'LOW') {
      onTrackGoalsCount++;
    } else {
      atRiskGoalsCount++;
    }
  });

  const completedComms = commitments.filter(c => c.status === 'COMPLETED').length;
  const totalComms = commitments.length;
  const activeRec = recommendations.find(r => r.status === 'ACTIVE');

  const needingAttention = activeGoalsList.filter(g => {
    const risk = BusinessEngine.calculateGoalRisk(g, commitments, relationships);
    return risk === 'HIGH' || risk === 'MEDIUM';
  }).length;

  const nextActionTime = activeRec ? activeRec.estimatedMinutes : 20;

  // Real-time metrics
  const todayStr = new Date().toDateString();
  const todayTasks = commitments.filter(c => {
    if (!c.startTime) return false;
    return new Date(c.startTime).toDateString() === todayStr;
  });

  const completedTasksToday = todayTasks.filter(c => c.status === 'COMPLETED').length;
  const pendingTasksToday = todayTasks.length - completedTasksToday;
  const meetingsCountToday = todayTasks.filter(c => c.type === 'EVENT' || c.type === 'APPOINTMENT').length;
  const focusCountToday = todayTasks.filter(c => c.type === 'FOCUS_BLOCK').length;
  const leftToday = todayTasks.filter(c => c.status !== 'COMPLETED' && c.status !== 'CANCELLED').length;

  const percentageToday = todayTasks.length > 0 
    ? Math.round((completedTasksToday / todayTasks.length) * 100)
    : 0;

  const progressText = todayTasks.length > 0 
    ? (percentageToday === 100 
        ? "Amazing work! Finished everything today." 
        : percentageToday > 0 
          ? "You're doing great! Keep going." 
          : "No actions completed yet. Let's make progress!")
    : "No tasks scheduled for today.";

  // Calculate success probability dynamically based on actual goals progress from Planner Result
  const successProbability = plannerResult.executionMomentum;

  // Determine dynamic focus time today
  const totalFocusMinutes = todayTasks
    .filter(c => c.type === 'FOCUS_BLOCK' && c.status === 'COMPLETED')
    .reduce((sum, c) => sum + c.estimatedDuration, 0);
  const focusHours = (totalFocusMinutes / 60).toFixed(1);

  // Dynamic schedules based on real today's commitments
  const realSchedules = todayTasks
    .filter(c => c.startTime && c.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())
    .map(c => {
      const timeStr = new Date(c.startTime!).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      let colorKey = 'grey';
      if (c.type === 'FOCUS_BLOCK') {
        colorKey = 'green';
      } else if (c.origin === 'CALENDAR') {
        colorKey = 'blue';
      } else if (c.type === 'EVENT') {
        colorKey = 'purple';
      } else if (c.constraint === 'FIXED') {
        colorKey = 'red';
      }

      return {
        time: timeStr,
        title: c.title,
        details: c.description || `${c.estimatedDuration} min • ${c.type.toLowerCase().replace('_', ' ')}`,
        color: colorKey
      };
    });

  // Dynamic priorities based on actual commitments (prioritize High impact / locked / next action)
  const realPriorities = commitments
    .filter(c => c.status !== 'COMPLETED' && c.status !== 'CANCELLED')
    .slice(0, 4)
    .map(c => {
      // find which goal it belongs to
      const rel = relationships.find(r => r.commitmentId === c.id);
      const goal = rel ? goals.find(g => g.id === rel.goalId) : null;
      
      return {
        id: c.id,
        title: c.title,
        goalTitle: goal ? goal.title : undefined,
        duration: c.estimatedDuration,
        energy: c.energyRequired || 'MEDIUM',
        impact: c.estimatedImpact || 'MEDIUM',
        constraint: c.constraint, // 'FIXED' or 'FLEXIBLE'
        origin: c.origin, // 'USER', 'AI', 'CALENDAR'
        color: c.type === 'FOCUS_BLOCK' ? 'amber' : c.type === 'EVENT' ? 'emerald' : 'indigo'
      };
    });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start animate-in fade-in duration-200">
      
      {/* Middle Center Main Column */}
      <div className="xl:col-span-8 space-y-4">
        
        {/* Quick Score Metrics bar (4 column layout matching the mock) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#131415] border border-slate-150/70 dark:border-zinc-900 p-4 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-500/20 dark:hover:border-emerald-500/10 duration-200">
            <p className="text-[10px] font-mono tracking-wider font-bold text-slate-400 dark:text-zinc-500 uppercase">Execution Momentum</p>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-bold text-slate-950 dark:text-neutral-50">
                {successProbability}%
              </span>
              {successProbability > 0 && (
                <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 px-2 py-0.5 rounded shadow-xs">↑ 12%</span>
              )}
            </div>
            {/* Tiny SVG sparkline trend indicator */}
            <div className="h-6 w-full mt-2">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M 0 18 Q 20 8, 40 14 T 80 5 T 100 2" fill="none" className="stroke-emerald-700 dark:stroke-emerald-500" strokeWidth={1.5} />
              </svg>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131415] border border-slate-150/70 dark:border-zinc-900 p-4 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-500/20 dark:hover:border-emerald-500/10 duration-200">
            <p className="text-[10px] font-mono tracking-wider font-bold text-slate-400 dark:text-zinc-500 uppercase">Active Goals</p>
            <div className="flex items-baseline mt-1.5">
              <span className="text-2xl font-bold text-slate-950 dark:text-neutral-50">{activeGoalsCount}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 font-mono">
              <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                {onTrackGoalsCount} on track
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {atRiskGoalsCount} at risk
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131415] border border-slate-150/70 dark:border-zinc-900 p-4 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-500/20 dark:hover:border-emerald-500/10 duration-200">
            <p className="text-[10px] font-mono tracking-wider font-bold text-slate-400 dark:text-zinc-500 uppercase">Tasks Today</p>
            <div className="flex items-baseline mt-1.5">
              <span className="text-2xl font-bold text-slate-950 dark:text-neutral-50">
                {todayTasks.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 font-mono">
              <span className="flex items-center gap-1 text-indigo-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {pendingTasksToday} pending
              </span>
              <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                {completedTasksToday} completed
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131415] border border-slate-150/70 dark:border-zinc-900 p-4 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-500/20 dark:hover:border-emerald-500/10 duration-200">
            <p className="text-[10px] font-mono tracking-wider font-bold text-slate-400 dark:text-zinc-500 uppercase">Focus Time</p>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-bold text-slate-950 dark:text-neutral-50">{focusHours} hrs</span>
              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 px-2 py-0.5 rounded shadow-xs">↑ 8%</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 font-mono mt-4 leading-none">
              vs yesterday performance
            </p>
          </div>
        </div>

        {/* Premium AI Executive Briefing Board */}
        <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] border border-emerald-500/10 dark:border-emerald-500/5 p-4 rounded-2xl flex items-start gap-3.5 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/2 blur-2xl rounded-full" />
          <div className="h-8.5 w-8.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-650 dark:text-emerald-400 shrink-0 border border-emerald-200/50 dark:border-emerald-500/20">
            <Sparkles className="h-[15px] w-[15px]" />
          </div>
          <div className="space-y-1 z-10">
            <h4 className="text-[13px] font-bold text-slate-950 dark:text-neutral-50 font-sans tracking-tight">Good Morning, Partha.</h4>
            <p className="text-[11.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              Today contains <span className="text-emerald-600 dark:text-emerald-400 font-bold">• 7 commitments</span>, <span className="text-emerald-600 dark:text-emerald-400 font-bold">• 2 high-impact tasks</span>, and <span className="text-emerald-600 dark:text-emerald-400 font-bold">• 1 scheduling conflict</span>. AI predicts an excellent execution day.
            </p>
          </div>
        </div>

        {/* Today's Priority Plan section matching the mockup */}
        <div className="bg-white dark:bg-[#131415] border border-slate-150/70 dark:border-zinc-900 rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-zinc-900/60">
            <h2 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">
              Today's Priority Plan
            </h2>
            <button 
              onClick={() => setActiveView('commitments')}
              className="flex items-center gap-1.5 text-xs text-neutral-800 dark:text-neutral-200 font-semibold bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 cursor-pointer shadow-xs transition-all duration-200"
            >
              <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Replan with AI
            </button>
          </div>

          {realPriorities.length > 0 ? (
            <div className="space-y-3">
              {realPriorities.map((task, index) => (
                <div 
                  key={index}
                  className="p-3.5 rounded-xl bg-slate-50/40 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-850/60 hover:border-emerald-500/20 dark:hover:border-emerald-500/15 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border mt-0.5 ${
                      task.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-400' :
                      task.color === 'amber' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-400' :
                      'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/5 dark:text-indigo-400'
                    }`}>
                      {task.origin === 'CALENDAR' ? <CalendarIcon className="h-3.5 w-3.5" /> :
                       task.origin === 'AI' ? <Sparkles className="h-3.5 w-3.5" /> :
                       <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h4 className="text-[13px] font-bold text-slate-800 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                        {task.goalTitle && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[9.5px]">
                            Goal: {task.goalTitle}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10.5px]">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          {task.duration} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges/Controls */}
                  <div className="flex flex-wrap items-center gap-1.5 md:justify-end shrink-0 pl-11 md:pl-0">
                    {/* Energy tag */}
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      task.energy === 'HIGH' ? 'bg-red-500/5 border-red-500/15 text-red-600 dark:text-red-400' :
                      task.energy === 'MEDIUM' ? 'bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400' :
                      'bg-blue-500/5 border-blue-500/15 text-blue-600 dark:text-blue-400'
                    }`}>
                      <Zap className="h-2.5 w-2.5 shrink-0" />
                      {task.energy} Energy
                    </span>

                    {/* Impact Tag */}
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      task.impact === 'HIGH' ? 'bg-rose-500/5 border-rose-500/15 text-rose-600 dark:text-rose-400' :
                      task.impact === 'MEDIUM' ? 'bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400' :
                      'bg-blue-500/5 border-blue-500/15 text-blue-600 dark:text-blue-400'
                    }`}>
                      <TrendingUp className="h-2.5 w-2.5 shrink-0" />
                      {task.impact} Impact
                    </span>

                    {/* Constraint Badge */}
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      task.constraint === 'FIXED' 
                        ? 'bg-purple-500/5 border-purple-500/15 text-purple-600 dark:text-purple-400' 
                        : 'bg-slate-500/5 border-slate-500/15 text-slate-600 dark:text-zinc-400'
                    }`}>
                      {task.constraint === 'FIXED' ? 'Fixed' : 'Flexible'}
                    </span>

                    {/* Source Origin badge */}
                    <span className="text-[9px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-transparent">
                      {task.origin === 'CALENDAR' ? 'Google' : task.origin === 'AI' ? 'AI' : 'Manual'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500 bg-slate-50/10 dark:bg-zinc-900/10">
              <CheckSquare className="h-5 w-5 text-slate-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">No priority actions scheduled</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 mb-3">
                Create a directional goal to let the AI sequence your commitments.
              </p>
              <button
                onClick={() => setActiveView('goals')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all shadow-xs"
              >
                Create First Goal
              </button>
            </div>
          )}

          {realPriorities.length > 0 && (
            <div className="pt-1 text-center">
              <button
                onClick={() => setActiveView('commitments')}
                className="text-xs font-bold text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                View all tasks
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Goals Overview & Recommendations block grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GoalSection minimal />
          <RecommendationSection />
        </div>
      </div>

      {/* Right Sidebar Column (Sticky and beautiful matching layout exactly) */}
      <div className="xl:col-span-4 space-y-3.5 lg:sticky lg:top-7">
        
        {/* Card 1: Your Day at a Glance */}
        <div className="bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 p-3 rounded-xl space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
            Your Day at a Glance
          </h3>
          <div className="flex items-center gap-3">
            <RadialProgress percentage={percentageToday} />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-tight">
                {percentageToday === 100 ? "All Accomplished" : percentageToday > 0 ? "On Track" : "Awaiting Actions"}
              </h4>
              <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal font-medium">
                {progressText}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-2 text-center text-[10px] font-medium border-t border-slate-100 dark:border-zinc-850/80">
            <div className="py-2 bg-slate-50/60 dark:bg-zinc-900/40 rounded-lg flex items-center justify-center gap-1 text-slate-500 dark:text-zinc-400">
              <span className="font-extrabold text-slate-800 dark:text-zinc-200">{meetingsCountToday}</span>
              <span>Meetings</span>
            </div>
            <div className="py-2 bg-slate-50/60 dark:bg-zinc-900/40 rounded-lg flex items-center justify-center gap-1 text-slate-500 dark:text-zinc-400">
              <span className="font-extrabold text-slate-800 dark:text-zinc-200">{focusCountToday}</span>
              <span>Focus</span>
            </div>
            <div className="py-2 bg-slate-50/60 dark:bg-zinc-900/40 rounded-lg flex items-center justify-center gap-1 text-slate-500 dark:text-zinc-400">
              <span className="font-extrabold text-slate-800 dark:text-zinc-200">{leftToday}</span>
              <span>Left</span>
            </div>
          </div>
        </div>

        {/* Card 2: Upcoming Timeline */}
        <div className="bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 p-3 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-0.5">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
              Upcoming Timeline
            </h3>
            <button 
              onClick={() => setActiveView('calendar')}
              className="text-[9.5px] font-bold text-slate-500 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400 font-mono cursor-pointer uppercase tracking-wider transition-colors"
            >
              View Calendar
            </button>
          </div>

          {realSchedules.length > 0 ? (
            <div className="space-y-0.5 relative">
              {realSchedules.map((sched, idx) => (
                <div key={idx} className="grid grid-cols-[16px_64px_1fr] gap-x-2.5 items-stretch group text-left">
                  
                  {/* Column 1: Line & Dot */}
                  <div className="relative flex justify-center shrink-0">
                    {/* Dashed line centered precisely behind the dot */}
                    <div className={`absolute left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-slate-200 dark:border-zinc-800 z-0 ${
                      idx === 0 ? 'top-[15px] bottom-0' :
                      idx === realSchedules.length - 1 ? 'top-0 h-[15px]' :
                      'top-0 bottom-0'
                    }`} />
                    
                    {/* Status indicator dot */}
                    <span className={`absolute left-1/2 -translate-x-1/2 top-[10px] h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-[#131415] z-10 transition-all duration-300 group-hover:scale-110 ${
                      sched.color === 'green' ? 'bg-emerald-500 dark:bg-emerald-400' :
                      sched.color === 'blue' ? 'bg-blue-500 dark:bg-blue-400' :
                      sched.color === 'purple' ? 'bg-purple-500 dark:bg-purple-400' :
                      sched.color === 'red' ? 'bg-red-500 dark:bg-red-400' :
                      'bg-slate-400 dark:bg-zinc-600'
                    }`} />
                  </div>

                  {/* Column 2: Time */}
                  <div className="pt-[10px]">
                    <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-tight leading-none block">
                      {sched.time}
                    </span>
                  </div>

                  {/* Column 3: Event Details */}
                  <div className="pt-[7px] pb-3.5 px-1.5 rounded-lg hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-all duration-200 flex-1 min-w-0">
                    <h5 className="text-[12px] font-semibold text-slate-800 dark:text-zinc-200 tracking-tight leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {sched.title}
                    </h5>
                    <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-medium font-sans mt-0.5 truncate leading-none">
                      {sched.details}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500 bg-slate-50/10 dark:bg-zinc-900/10">
              <CalendarIcon className="h-6 w-6 text-slate-400 dark:text-zinc-500 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">No events today</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-relaxed max-w-[180px]">
                Define task timelines in the planner to populate this schedule.
              </p>
            </div>
          )}

          {realSchedules.length > 0 && (
            <div className="pt-2 text-center border-t border-slate-100 dark:border-zinc-850/80">
              <button 
                onClick={() => setActiveView('calendar')}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400 transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                See full timeline
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Card 3: Insights */}
        <div className="bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 p-3 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">
                Insights
              </h3>
              <p className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 dark:text-zinc-500">
                Productivity Trend
              </p>
            </div>
            <select className="text-[10px] font-semibold text-slate-800 dark:text-zinc-200 border border-slate-200/60 dark:border-zinc-800 rounded-lg px-2.5 py-1 bg-white dark:bg-zinc-950 shadow-xs cursor-pointer focus:outline-none focus:border-neutral-800 dark:focus:border-zinc-500">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>

          <div className="pt-1">
            <ProductivityTrendChart />
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800 rounded-lg p-2 text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400 text-center font-medium font-mono">
            Top Completion Time: <strong className="text-slate-800 dark:text-zinc-200">7:00 PM - 10:00 PM</strong> <span className="text-emerald-700 dark:text-emerald-400">[82% tasks]</span>
          </div>
        </div>

      </div>
    </div>
  );
};


const InsightsView: React.FC = () => {
  const { weeklyReview } = useMotive();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {weeklyReview ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wins Card */}
            <div className="bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-zinc-800/85 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
                <Trophy className="h-4.5 w-4.5" />
                Key Execution Wins
              </h3>
              <ul className="space-y-3">
                {weeklyReview.wins.map((win: string, i: number) => (
                  <li key={i} className="flex gap-2.5 text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed font-semibold">
                    <span className="text-emerald-500 font-mono mt-0.5">&bull;</span>
                    {win}
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-zinc-800/85 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-indigo-500 dark:text-indigo-400 uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5" />
                Opportunities to Calibrate
              </h3>
              <ul className="space-y-3">
                {weeklyReview.missedOpportunities.map((op: string, i: number) => (
                  <li key={i} className="flex gap-2.5 text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
                    <span className="text-indigo-500 font-mono mt-0.5">&bull;</span>
                    {op}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Biggest Risks */}
          <div className="bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-zinc-800/85 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-start">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-rose-500">Immediate Risk Assessment</h4>
              <p className="text-xs text-neutral-600 dark:text-zinc-300 leading-relaxed font-medium">
                {weeklyReview.biggestRisk}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-neutral-400 font-mono text-xs">
          Calculating weekly performance vectors...
        </div>
      )}
    </div>
  );
};

const MainWorkspace: React.FC = () => {
  const { 
    activeView, 
    isSidebarCollapsed, 
    setIsMobileSidebarOpen 
  } = useMotive();

  // Define titles and subtitles based on the activeView
  const getViewHeader = () => {
    switch (activeView) {
      case 'dashboard':
        return {
          title: "Motive Workspace",
          subtitle: "Your intelligent execution workspace. Manage goals, calendar timelines, and high-impact commitments."
        };
      case 'goals':
        return {
          title: "Directional Goals",
          subtitle: "Establish high-momentum objectives and align them with structured action plans."
        };
      case 'calendar':
        return {
          title: "Timeline & Schedule",
          subtitle: "Your integrated calendar containing multi-source synchronized events and focus blocks."
        };
      case 'commitments':
        return {
          title: "Commitments",
          subtitle: "Execute daily sequences calibrated to optimize velocity and execution health."
        };
      case 'insights':
        return {
          title: "Mo — AI Execution Companion",
          subtitle: "Formulate strategies, query execution health, and optimize schedules directly with Mo."
        };
      case 'settings':
        return {
          title: "System Preferences",
          subtitle: "Configure theme selections, synchronize multiple accounts, and manage local storage."
        };
      default:
        return {
          title: "Motive Workspace",
          subtitle: "Mo AI Execution Companion."
        };
    }
  };

  const { title, subtitle } = getViewHeader();

  return (
    <main className={`flex-1 ${isSidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[260px]'} min-h-screen transition-all duration-300 bg-[#faf9f6] dark:bg-[#0c0d0e]`}>
      <div className="max-w-[1280px] mx-auto px-5 py-5 pb-12 space-y-6">
        
        {/* Premium Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-900/60">
          <div className="flex items-start gap-3 min-w-0">
            {/* Hamburger mobile menu button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="space-y-1 min-w-0">
              <h2 className="text-[20px] font-bold text-slate-900 dark:text-zinc-50 tracking-tight font-sans">
                {title}
              </h2>
              <p className="text-[12px] text-slate-455 dark:text-zinc-500 font-medium leading-relaxed font-sans truncate max-w-[280px] xs:max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
                {subtitle}
              </p>
            </div>
          </div>
        </header>

        {/* Content Views */}
        <div className="animate-in fade-in duration-200">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'goals' && <GoalSection />}
          {activeView === 'calendar' && <CalendarSection />}
          {activeView === 'commitments' && <CommitmentsSection />}
          {activeView === 'insights' && <InsightsView />}
          {activeView === 'settings' && <SettingsSection />}
        </div>
      </div>
    </main>
  );
};

function AppContent() {
  const { userProfile, authLoading, settings, resolvedTheme } = useMotive();
  
  const [minLoadingComplete, setMinLoadingComplete] = React.useState(false);
  const [currentFontIndex, setCurrentFontIndex] = React.useState(0);

  // Fonts list to cycle through: Plaster, Protest Gorilla, Emblema One, Keania One, Kenia
  const fonts = [
    'font-plaster',
    'font-protest-gorilla',
    'font-emblema-one',
    'font-keania-one',
    'font-kenia'
  ];

  // Enforce a minimum load duration of 3500ms to allow smooth aesthetic load transition
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Cycle through brand logo fonts every 300ms on the loading screen
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFontIndex((prev) => (prev + 1) % fonts.length);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const isActuallyLoading = authLoading || !minLoadingComplete;

  if (isActuallyLoading) {
    const activeFontClass = fonts[currentFontIndex];
    return (
      <div className={`min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-[#f8f7f4] dark:bg-[#070809] text-slate-950 dark:text-zinc-50 transition-colors duration-300 ${resolvedTheme === 'DARK' ? 'dark' : ''}`}>
        
        {/* Ambient Premium Patterned & Immersive Multi-Orb Background */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          {/* Subtle elegant structural grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.02)_1px,transparent_1px)] [background-size:40px_40px]" />
          
          {/* Fine dot matrix background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.07)_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04)_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-80" />
          
          {/* Beautiful glowing mesh gradients (Highly visible and textured) */}
          <div className="absolute top-[20%] left-[25%] w-[350px] h-[350px] rounded-full bg-emerald-500/12 dark:bg-emerald-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[20%] right-[25%] w-[400px] h-[400px] rounded-full bg-indigo-500/12 dark:bg-indigo-500/8 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
          <div className="absolute top-[60%] left-[45%] w-[250px] h-[250px] rounded-full bg-teal-500/10 dark:bg-teal-500/6 blur-[90px] animate-pulse" style={{ animationDuration: '10s' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-7 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Custom Dynamic Morphing Logo Container */}
          <div className="relative flex items-center justify-center w-[340px] h-[340px]">
            {/* Spinning background premium halo */}
            <div className="absolute inset-0 h-32 w-32 bg-emerald-500/20 dark:bg-emerald-500/15 blur-2xl rounded-full animate-pulse self-center justify-self-center" />
            
            {/* Premium Designer Polar Grid Blueprint Rings aligned perfectly centered behind the logo */}
            <div className="absolute w-[280px] h-[280px] rounded-full border border-slate-200/50 dark:border-zinc-800/40 flex items-center justify-center pointer-events-none select-none z-0">
              <div className="w-[180px] h-[180px] rounded-full border border-dashed border-slate-200/60 dark:border-zinc-800/50 flex items-center justify-center">
                <div className="w-[100px] h-[100px] rounded-full border border-slate-200/70 dark:border-zinc-800/65" />
              </div>
            </div>
            
            {/* Concentric crosshair ticks aligned perfectly centered behind the logo */}
            <div className="absolute w-[340px] h-[340px] pointer-events-none opacity-50 dark:opacity-25 z-0">
              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-emerald-500/20" />
              <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-emerald-500/20" />
            </div>

            {/* Glossy spinning ring surrounding the brand mark */}
            <div className="absolute h-24 w-24 rounded-[26px] border border-emerald-500/25 dark:border-emerald-500/20 bg-white/20 dark:bg-zinc-900/10 backdrop-blur-[2px] animate-spin" style={{ animationDuration: '24s' }} />
            
            {/* Brand Mark with dynamic font class */}
            <div className="h-16 w-16 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 relative z-10 transition-all duration-300">
              <span className={`text-3xl text-white font-bold leading-none select-none transition-all duration-200 ${activeFontClass}`}>
                m
              </span>
            </div>
          </div>

          <div className="space-y-2 text-center relative -mt-4">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
              Motive Core Engine
            </p>
            <p className="text-[9.5px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 animate-pulse">
              Calibrating Mo
            </p>
          </div>
          
          {/* Sleek, minimal loading progress bar */}
          <div className="w-28 h-[2.5px] bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-loading-progress" />
          </div>

        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <LandingPage />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased text-neutral-900 dark:text-neutral-100 bg-white dark:bg-zinc-950 transition-all duration-300 ${resolvedTheme === 'DARK' ? 'dark' : ''}`}>
      <div className="flex flex-1 relative">
        <Sidebar />
        <MainWorkspace />
        <AISidebar />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MotiveProvider>
      <AppContent />
    </MotiveProvider>
  );
}
