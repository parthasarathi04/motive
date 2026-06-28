import React from 'react';
import { MotiveProvider, useMotive } from './contexts/MotiveContext';
import { Header } from './components/Header';
import { RecommendationSection } from './components/RecommendationSection';
import { GoalSection } from './components/GoalSection';
import { CommitmentsSection } from './components/CommitmentsSection';
import { CalendarSection } from './components/CalendarSection';
import { AISidebar } from './components/AISidebar';
import { TimelineSection } from './components/TimelineSection';
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
  PanelLeftOpen
} from 'lucide-react';

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

const Sidebar: React.FC = () => {
  const { activeView, setActiveView, goals, commitments, userProfile, clearAllData, isMobileSidebarOpen, setIsMobileSidebarOpen, isSidebarCollapsed, setIsSidebarCollapsed } = useMotive();

  const totalGoals = goals.length;
  const pendingCommitments = commitments.filter(c => c.status !== 'COMPLETED').length;

  interface MenuItem {
    id: 'dashboard' | 'goals' | 'calendar' | 'commitments' | 'insights';
    label: string;
    icon: React.ReactNode;
    badge?: number;
    disabled?: boolean;
  }

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Home', icon: <Home className="h-[16px] w-[16px]" /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="h-[16px] w-[16px]" /> },
    { id: 'goals', label: 'Goals', icon: <Target className="h-[16px] w-[16px]" />, badge: totalGoals > 0 ? totalGoals : undefined },
    { id: 'commitments', label: 'Tasks', icon: <CheckSquare className="h-[16px] w-[16px]" />, badge: pendingCommitments > 0 ? pendingCommitments : undefined },
  ];

  const staticItems = [
    { label: 'Habits', icon: <Flame className="h-[16px] w-[16px]" /> },
    { label: 'Analytics', icon: <BarChart3 className="h-[16px] w-[16px]" /> },
    { label: 'Settings', icon: <Settings className="h-[16px] w-[16px]" /> },
  ];

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
                <span className="font-plaster text-xs text-white dark:text-zinc-950 font-bold leading-none">
                  m
                </span>
              </div>
              {!isSidebarCollapsed && (
                <div className="animate-in fade-in duration-150">
                  <h1 className="text-[17px] font-black text-slate-950 dark:text-white tracking-wider leading-none font-plaster lowercase">
                    motive
                  </h1>
                  <p className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold tracking-wider font-mono mt-0.5 uppercase">
                    Your AI Chief of Staff
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
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900/30'
                  }`}
                >
                  <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center relative' : 'gap-3'}`}>
                    <div className={`${isActive ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-400 dark:text-zinc-500'} shrink-0`}>
                      {item.icon}
                    </div>
                    {!isSidebarCollapsed && <span className="animate-in fade-in duration-150">{item.label}</span>}
                    
                    {/* Collapsed active dot badge */}
                    {isSidebarCollapsed && item.badge !== undefined && (
                      <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full border border-white dark:border-[#090a0b] ${
                        item.id === 'insights' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                    )}
                  </div>
                  {!isSidebarCollapsed && item.badge !== undefined && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-emerald-500 text-white' 
                        : item.id === 'insights'
                          ? 'bg-rose-500 text-white'
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
          </nav>
        </div>

        <div className="space-y-4">
          {/* Profile container */}
          <div className={`border-t border-slate-100 dark:border-zinc-900 pt-3.5 flex items-center ${isSidebarCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between px-1'}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
              <img 
                src={userProfile?.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} 
                alt={userProfile?.name || "Partha S."}
                className="h-8 w-8 rounded-full border border-slate-100 dark:border-zinc-900 object-cover shrink-0"
                referrerPolicy="no-referrer"
                title={isSidebarCollapsed ? userProfile?.name : undefined}
              />
              {!isSidebarCollapsed && (
                <div className="text-left animate-in fade-in duration-150">
                  <p className="text-[11.5px] font-bold text-slate-800 dark:text-zinc-200 leading-tight">
                    {userProfile?.name || "Partha S."}
                  </p>
                </div>
              )}
            </div>
            <button 
              onClick={clearAllData}
              className="p-1.5 rounded-lg border border-slate-100 dark:border-zinc-900 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer shrink-0"
              title="Sign Out (Reset Data)"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const DashboardView: React.FC = () => {
  const { goals, commitments, recommendations, setActiveView } = useMotive();

  const activeGoals = goals.filter(g => g.status === 'ACTIVE').length;
  const completedComms = commitments.filter(c => c.status === 'COMPLETED').length;
  const totalComms = commitments.length;
  const activeRec = recommendations.find(r => r.status === 'ACTIVE');

  const needingAttention = goals.filter(g => g.status === 'ACTIVE' && (g.risk === 'HIGH' || g.risk === 'MEDIUM')).length;
  const nextActionTime = activeRec ? activeRec.estimatedMinutes : 20;

  // Demo schedules matching the screenshot layout
  const timelineSchedules = [
    { time: '10:00 AM', title: 'Team Standup', details: '30 min • Google Meet', color: 'emerald' },
    { time: '12:30 PM', title: 'Visa Appointment', details: 'VFS Global Center', color: 'indigo' },
    { time: '04:00 PM', title: 'Focus Time', details: 'Deep Work Session • 90 min', color: 'emerald' },
    { time: '07:00 PM', title: 'Gym', details: 'Personal Habit', color: 'amber' },
  ];

  // Priority plan matching the screenshot priority tasks
  const priorityTasks = [
    { title: 'Upload Bank Statement', subtitle: 'France Visa • Due Tomorrow', impact: 'High', time: '20 min', gain: '+12%', color: 'emerald' },
    { title: 'Visa Appointment Preparation', subtitle: 'France Visa • Due in 2 days', impact: 'High', time: '45 min', gain: '+9%', color: 'amber' },
    { title: 'Practice System Design', subtitle: 'Promotion Review • Due in 3 days', impact: 'Medium', time: '60 min', gain: '+6%', color: 'indigo' },
    { title: 'Review ITR Documents', subtitle: 'Tax Filing 2026 • Due in 5 days', impact: 'Low', time: '30 min', gain: '+4%', color: 'blue' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start animate-in fade-in duration-200">
      
      {/* Middle Center Main Column */}
      <div className="xl:col-span-8 space-y-4">
        


        {/* Quick Score Metrics bar (4 column layout matching the mock) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 p-4 rounded-xl transition-all">
            <p className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 dark:text-zinc-500">Success Probability</p>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-bold text-slate-950 dark:text-neutral-50">78%</span>
              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 px-2 py-0.5 rounded shadow-xs">↑ 12%</span>
            </div>
            {/* Tiny SVG sparkline trend indicator */}
            <div className="h-6 w-full mt-2">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M 0 18 Q 20 8, 40 14 T 80 5 T 100 2" fill="none" className="stroke-emerald-700 dark:stroke-emerald-500" strokeWidth={1.5} />
              </svg>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 p-4 rounded-xl transition-all">
            <p className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 dark:text-zinc-500">Active Goals</p>
            <div className="flex items-baseline mt-1.5">
              <span className="text-2xl font-bold text-slate-950 dark:text-neutral-50">{activeGoals}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 font-mono">
              <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />3 on track</span>
              <span className="flex items-center gap-1 text-amber-600"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />2 at risk</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 p-4 rounded-xl transition-all">
            <p className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 dark:text-zinc-500">Tasks Today</p>
            <div className="flex items-baseline mt-1.5">
              <span className="text-2xl font-bold text-slate-950 dark:text-neutral-50">6</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 font-mono">
              <span className="flex items-center gap-1 text-indigo-600"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />4 pending</span>
              <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />2 completed</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 p-4 rounded-xl transition-all">
            <p className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 dark:text-zinc-500">Focus Time</p>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-bold text-slate-950 dark:text-neutral-50">3.2 hrs</span>
              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 px-2 py-0.5 rounded shadow-xs">↑ 8%</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 font-mono mt-4 leading-none">
              vs yesterday performance
            </p>
          </div>
        </div>

        {/* Today's Priority Plan section matching the mockup */}
        <div className="bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-50 dark:border-zinc-900/60">
            <h2 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">
              Today's Priority Plan
            </h2>
            <button 
              onClick={() => setActiveView('commitments')}
              className="flex items-center gap-1.5 text-xs text-neutral-800 dark:text-neutral-200 font-semibold bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 cursor-pointer shadow-xs transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />
              Replan with AI
            </button>
          </div>

          <div className="space-y-1">
            {priorityTasks.map((task, index) => (
              <div 
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2.5 p-2 px-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/60 border border-transparent hover:border-slate-100 dark:hover:border-zinc-800 transition-all group"
              >
                <div className="sm:col-span-7 flex items-center gap-3 min-w-0">
                  <div className={`h-8.5 w-8.5 shrink-0 rounded-lg flex items-center justify-center font-bold border ${
                    task.color === 'emerald' ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' :
                    task.color === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' :
                    task.color === 'indigo' ? 'bg-indigo-50 text-indigo-800 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30' :
                    'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                  }`}>
                    {task.color === 'emerald' ? <Briefcase className="h-4 w-4" /> :
                     task.color === 'amber' ? <CalendarCheck2 className="h-4 w-4" /> :
                     task.color === 'indigo' ? <User className="h-4 w-4" /> :
                     <Mail className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-slate-800 dark:text-zinc-100 group-hover:text-emerald-850 dark:group-hover:text-emerald-400 transition-colors truncate">
                      {task.title}
                    </h4>
                    <p className="text-[10.5px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5 font-sans truncate">
                      {task.subtitle}
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-5 flex items-center justify-end gap-6 pl-11.5 sm:pl-0">
                  <div className="w-[82px] flex justify-start shrink-0">
                    <span className={`inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs shrink-0 ${
                      task.impact === 'High' 
                        ? 'bg-rose-50 border-rose-200/75 text-rose-700 dark:bg-rose-950/35 dark:border-rose-900/50 dark:text-rose-400' 
                        : task.impact === 'Medium'
                        ? 'bg-amber-50 border-amber-200/75 text-amber-700 dark:bg-amber-950/35 dark:border-amber-900/50 dark:text-amber-400'
                        : 'bg-blue-50 border-blue-200/75 text-blue-700 dark:bg-blue-950/35 dark:border-blue-900/50 dark:text-blue-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        task.impact === 'High' ? 'bg-rose-500' : task.impact === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      {task.impact}
                    </span>
                  </div>
                  <div className="w-[56px] text-left shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 font-mono">
                      {task.time}
                    </span>
                  </div>
                  <div className="w-[92px] text-left font-mono text-[10.5px] shrink-0">
                    <span className="text-slate-400 dark:text-zinc-500">Impact: </span>
                    <strong className="text-emerald-800 dark:text-emerald-400 font-bold">{task.gain}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => setActiveView('commitments')}
              className="text-xs font-bold text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              View all tasks
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
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
            <RadialProgress percentage={72} />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-tight">
                On Track
              </h4>
              <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal font-medium">
                You're doing great! Keep going.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-2 text-center text-[9px] font-mono border-t border-slate-100 dark:border-zinc-850/80">
            <div className="py-1.5 bg-slate-50/50 dark:bg-zinc-900/30 rounded-lg">
              <CalendarIcon className="h-3 w-3 mx-auto mb-0.5 text-slate-400" />
              <strong className="text-slate-800 dark:text-zinc-200">2</strong> Meetings
            </div>
            <div className="py-1.5 bg-slate-50/50 dark:bg-zinc-900/30 rounded-lg">
              <Clock className="h-3 w-3 mx-auto mb-0.5 text-slate-400" />
              <strong className="text-slate-800 dark:text-zinc-200">1</strong> Focus
            </div>
            <div className="py-1.5 bg-slate-50/50 dark:bg-zinc-900/30 rounded-lg">
              <CheckSquare className="h-3 w-3 mx-auto mb-0.5 text-slate-400" />
              <strong className="text-slate-800 dark:text-zinc-200">6</strong> Left
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

          <div className="space-y-0.5 relative">
            {timelineSchedules.map((sched, idx) => (
              <div key={idx} className="grid grid-cols-[16px_64px_1fr] gap-x-2.5 items-stretch group text-left">
                
                {/* Column 1: Line & Dot */}
                <div className="relative flex justify-center shrink-0">
                  {/* Dashed line centered precisely behind the dot */}
                  <div className={`absolute left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-slate-200 dark:border-zinc-800 z-0 ${
                    idx === 0 ? 'top-[15px] bottom-0' :
                    idx === timelineSchedules.length - 1 ? 'top-0 h-[15px]' :
                    'top-0 bottom-0'
                  }`} />
                  
                  {/* Status indicator dot */}
                  <span className={`absolute left-1/2 -translate-x-1/2 top-[10px] h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-[#131415] z-10 transition-all duration-300 group-hover:scale-110 ${
                    sched.color === 'emerald' ? 'bg-emerald-500 dark:bg-emerald-400' :
                    sched.color === 'indigo' ? 'bg-indigo-500 dark:bg-indigo-400' :
                    'bg-amber-500 dark:bg-amber-400'
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

          <div className="pt-2 text-center border-t border-slate-100 dark:border-zinc-850/80">
            <button 
              onClick={() => setActiveView('calendar')}
              className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400 transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              See full timeline
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
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
  const { activeView, isSidebarCollapsed } = useMotive();

  return (
    <main className={`flex-1 ${isSidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[260px]'} min-h-[calc(100vh-64px)] transition-all duration-300 bg-[#faf9f6] dark:bg-[#0c0d0e]`}>
      <div className="max-w-[1280px] mx-auto px-5 py-5 pb-12">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'goals' && <GoalSection />}
        {activeView === 'calendar' && <CalendarSection />}
        {activeView === 'commitments' && <CommitmentsSection />}
        {activeView === 'insights' && <InsightsView />}
      </div>
    </main>
  );
};

export default function App() {
  return (
    <MotiveProvider>
      <div className="min-h-screen flex flex-col font-sans antialiased text-neutral-900 dark:text-neutral-100 bg-white dark:bg-zinc-950 transition-colors duration-300">
        <Header />
        
        <div className="flex flex-1 relative">
          <Sidebar />
          <MainWorkspace />
          <AISidebar />
        </div>
      </div>
    </MotiveProvider>
  );
}
