import React from 'react';
import { useMotive } from '../contexts/MotiveContext';
import { motion } from 'motion/react';
import { Sparkles, Calendar, Mail, CheckCircle2, ShieldAlert, ArrowRight, Sun, Moon } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, enterSandboxMode, settings, updateSettings, resolvedTheme } = useMotive();

  const currentTheme = resolvedTheme;

  // Smooth cursor spotlight positioning
  const [mousePos, setMousePos] = React.useState({ x: 500, y: 150 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const toggleTheme = () => {
    updateSettings({ theme: currentTheme === 'DARK' ? 'LIGHT' : 'DARK' });
  };

  return (
    <div className={`min-h-screen bg-[radial-gradient(ellipse_120%_120%_at_50%_-20%,rgba(14,165,233,0.15)_0%,rgba(16,185,129,0.12)_25%,rgba(99,102,241,0.08)_50%,#f8fafc_100%)] dark:bg-[radial-gradient(ellipse_120%_120%_at_50%_-20%,#090c12,#020304)] text-slate-900 dark:text-zinc-100 transition-colors duration-500 flex flex-col font-sans overflow-x-hidden relative ${currentTheme === 'DARK' ? 'dark' : ''}`}>
      
      {/* Premium subtle dot matrix grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#64748b26_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#ffffff0a_1.5px,transparent_1.5px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_65%_at_50%_20%,#000_80%,transparent_100%)] pointer-events-none" />
      
      {/* Interactive Laser/Spotlight Glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 opacity-95 dark:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${
            currentTheme === 'DARK' 
              ? 'rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.06) 40%, transparent 80%' 
              : 'rgba(14, 165, 233, 0.20) 0%, rgba(16, 185, 129, 0.14) 35%, rgba(99, 102, 241, 0.08) 70%, transparent 90%'
          })`
        }}
      />

      {/* High-fidelity glowing ambient color orbs with premium slow-drift animations */}
      <motion.div
        animate={{
          scale: [1, 1.25, 0.9, 1.1, 1],
          x: ['-50%', '-38%', '-58%', '-44%', '-50%'],
          y: [0, 40, -50, 30, 0],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[-10%] left-1/2 w-[850px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.22)_0%,rgba(20,184,166,0.18)_35%,rgba(99,102,241,0.08)_65%,transparent_80%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.26)_0%,rgba(20,184,166,0.18)_35%,rgba(99,102,241,0.12)_65%,transparent_80%)] rounded-full blur-[120px] pointer-events-none"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.3, 0.85, 1.15, 1],
          x: [0, -40, 30, -20, 0],
          y: [0, -35, 45, -25, 0],
          rotate: [0, -120, -240, -360],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-[5%] right-[-10%] w-[750px] h-[750px] bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.18)_0%,rgba(99,102,241,0.12)_45%,transparent_75%)] dark:bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18)_0%,rgba(99,102,241,0.14)_45%,transparent_75%)] rounded-full blur-[130px] pointer-events-none"
      />
      
      <motion.div
        animate={{
          scale: [0.95, 1.2, 1.05, 0.9, 0.95],
          x: [0, 50, -30, 20, 0],
          y: [0, 45, -45, 15, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[25%] left-[-15%] w-[650px] h-[650px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.20)_0%,rgba(45,212,191,0.12)_50%,transparent_75%)] dark:bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22)_0%,rgba(45,212,191,0.14)_50%,transparent_75%)] rounded-full blur-[110px] pointer-events-none"
      />

      {/* Animated Flowing Sequence Pathway SVG Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-60 dark:opacity-60 select-none">
        <svg className="w-full h-full min-h-[950px]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="seq-path-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="35%" stopColor="#0ea5e9" stopOpacity="0.40" />
              <stop offset="70%" stopColor="#6366f1" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="seq-path-grad-2" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="glow-grad-em" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="glow-grad-ind" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Pathway 1 (Main sequence line connecting milestones) */}
          <motion.path
            d="M -50 250 Q 250 120, 500 340 T 1100 220 T 1700 450"
            fill="none"
            stroke="url(#seq-path-grad-1)"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            opacity="0.28"
            animate={{
              strokeDashoffset: [0, -144]
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Active Flowing Signal Pulse 1 (Emerald) */}
          <motion.circle
            r="4.5"
            fill="url(#glow-grad-em)"
            style={{ 
              offsetPath: "path('M -50 250 Q 250 120, 500 340 T 1100 220 T 1700 450')",
              filter: "drop-shadow(0 0 6px rgba(16,185,129,0.75))"
            }}
            animate={{
              offsetDistance: ["0%", "100%"]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Active Flowing Signal Pulse 3 (Secondary Delayed Indigo Pulse on Pathway 1) */}
          <motion.circle
            r="3.5"
            fill="url(#glow-grad-ind)"
            style={{ 
              offsetPath: "path('M -50 250 Q 250 120, 500 340 T 1100 220 T 1700 450')",
              filter: "drop-shadow(0 0 5px rgba(99,102,241,0.6))"
            }}
            animate={{
              offsetDistance: ["0%", "100%"]
            }}
            transition={{
              duration: 10,
              delay: 5,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Pathway 2 (Secondary support pipeline) */}
          <motion.path
            d="M 150 850 Q 550 550, 850 720 T 1550 620"
            fill="none"
            stroke="url(#seq-path-grad-2)"
            strokeWidth="1.2"
            strokeDasharray="5 5"
            opacity="0.22"
            animate={{
              strokeDashoffset: [0, 96]
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Active Flowing Signal Pulse 2 (Indigo) */}
          <motion.circle
            r="3.5"
            fill="url(#glow-grad-ind)"
            style={{ 
              offsetPath: "path('M 150 850 Q 550 550, 850 720 T 1550 620')",
              filter: "drop-shadow(0 0 5px rgba(99,102,241,0.6))"
            }}
            animate={{
              offsetDistance: ["0%", "100%"]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Active Flowing Signal Pulse 4 (Secondary Delayed Emerald Pulse on Pathway 2) */}
          <motion.circle
            r="3"
            fill="url(#glow-grad-em)"
            style={{ 
              offsetPath: "path('M 150 850 Q 550 550, 850 720 T 1550 620')",
              filter: "drop-shadow(0 0 4px rgba(16,185,129,0.5))"
            }}
            animate={{
              offsetDistance: ["0%", "100%"]
            }}
            transition={{
              duration: 15,
              delay: 7.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Milestone Hub 1 (Intelligent Intake) */}
          <g transform="translate(350, 210)">
            <circle r="14" fill="none" stroke="#10b981" strokeOpacity="0.2" strokeWidth="1" />
            <motion.circle
              r="24"
              fill="none"
              stroke="#10b981"
              strokeOpacity="0.08"
              strokeWidth="1.5"
              animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle r="3.5" fill="#10b981" className="drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
          </g>

          {/* Milestone Hub 2 (Sequence Optimizer) */}
          <g transform="translate(800, 275)">
            <circle r="16" fill="none" stroke="#6366f1" strokeOpacity="0.2" strokeWidth="1" />
            <motion.circle
              r="28"
              fill="none"
              stroke="#6366f1"
              strokeOpacity="0.08"
              strokeWidth="1.5"
              animate={{ scale: [0.9, 1.5, 0.9], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            />
            <circle r="4" fill="#6366f1" className="drop-shadow-[0_0_4px_rgba(99,102,241,0.5)]" />
          </g>

          {/* Milestone Hub 3 (Dynamic Recalibrator) */}
          <g transform="translate(1250, 310)">
            <circle r="12" fill="none" stroke="#2dd4bf" strokeOpacity="0.2" strokeWidth="1" />
            <motion.circle
              r="22"
              fill="none"
              stroke="#2dd4bf"
              strokeOpacity="0.08"
              strokeWidth="1.5"
              animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
            />
            <circle r="3" fill="#2dd4bf" className="drop-shadow-[0_0_3px_rgba(45,212,191,0.5)]" />
          </g>
        </svg>
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 sm:px-8 h-16 flex items-center justify-between border-b border-slate-100 dark:border-zinc-900/60 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <span className={`${
              settings?.logoFont === 'protest-gorilla' ? 'font-protest-gorilla' :
              settings?.logoFont === 'emblema-one' ? 'font-emblema-one' :
              settings?.logoFont === 'keania-one' ? 'font-keania-one' :
              settings?.logoFont === 'kenia' ? 'font-kenia' : 'font-plaster'
            } text-sm text-white font-bold leading-none`}>
              m
            </span>
          </div>
          <span className={`text-[17px] font-black tracking-wider ${
            settings?.logoFont === 'protest-gorilla' ? 'font-protest-gorilla' :
            settings?.logoFont === 'emblema-one' ? 'font-emblema-one' :
            settings?.logoFont === 'keania-one' ? 'font-keania-one' :
            settings?.logoFont === 'kenia' ? 'font-kenia' : 'font-plaster'
          } lowercase text-slate-950 dark:text-white leading-none`}>
            motive
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {currentTheme === 'DARK' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-12 sm:py-20 z-10 text-center">
        
        {/* Sparkles pill */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/5 dark:bg-indigo-400/5 border border-indigo-500/10 dark:border-indigo-400/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide mb-6 backdrop-blur-md shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>MEET MO, YOUR PERSONAL AI COMPANION</span>
        </motion.div>

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white max-w-3xl leading-[1.1] sm:leading-[1.08]"
        >
          Achieve goals through <br className="hidden sm:inline" />
          <span className="text-gradient">
            intelligent sequencing
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-[18px] text-slate-500 dark:text-zinc-400 mt-6 max-w-2xl font-medium leading-relaxed"
        >
          Motive dynamically schedules daily commitments, auto-links timeline tasks to directional goals, and provides real-time calibrations to keep you on course.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto"
        >
          {/* Google Login Button */}
          <button
            onClick={signInWithGoogle}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-xl shadow-slate-900/10 dark:shadow-white/5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer group"
          >
            {/* Colorful Google G Logo */}
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.74 14.9 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.6 2.79c.85-2.54 3.22-4.25 6.9-4.25z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.6 2.79c2.1-1.94 3.83-4.82 3.83-8.61z"
              />
              <path
                fill="#FBBC05"
                d="M5.1 14.71c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.5 7.4C.54 9.32 0 11.48 0 13.75s.54 4.43 1.5 6.35l3.6-2.79z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.79c-1.1.74-2.5 1.18-4.36 1.18-3.68 0-6.05-1.71-6.9-4.25l-3.6 2.79C3.39 20.35 7.35 23 12 23z"
              />
            </svg>
            <span>Continue with Google</span>
            <ArrowRight className="h-4 w-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Sandbox Fallback Button */}
          <button
            onClick={enterSandboxMode}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-semibold transition-all cursor-pointer"
          >
            <span>Launch Demo Sandbox</span>
          </button>
        </motion.div>


        {/* Feature Cards Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-20 text-left"
        >
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-white/40 dark:bg-[#0c0d0e]/40 border border-slate-200/50 dark:border-zinc-900/60 backdrop-blur-md flex flex-col gap-4 hover:border-emerald-500/30 dark:hover:border-emerald-400/30 hover:shadow-xl hover:shadow-emerald-500/[0.02] transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 dark:border-emerald-400/20 shadow-xs group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 tracking-tight text-[15px]">Intelligent Scheduling</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-[13px] leading-relaxed mt-2">
                Say goodbye to simple lists. Motive breaks down directional goals into sequential, date-aware focus commitments automatically.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-white/40 dark:bg-[#0c0d0e]/40 border border-slate-200/50 dark:border-zinc-900/60 backdrop-blur-md flex flex-col gap-4 hover:border-emerald-500/30 dark:hover:border-emerald-400/30 hover:shadow-xl hover:shadow-emerald-500/[0.02] transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 dark:border-emerald-400/20 shadow-xs group-hover:scale-105 transition-transform">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 tracking-tight text-[15px]">Multi-Source Sync</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-[13px] leading-relaxed mt-2">
                Sync with Google Calendar and Email. Motive analyzes upcoming actions, flags priority shifts, and recommends optimal adjustments.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-white/40 dark:bg-[#0c0d0e]/40 border border-slate-200/50 dark:border-zinc-900/60 backdrop-blur-md flex flex-col gap-4 hover:border-emerald-500/30 dark:hover:border-emerald-400/30 hover:shadow-xl hover:shadow-emerald-500/[0.02] transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 dark:border-emerald-400/20 shadow-xs group-hover:scale-105 transition-transform">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 tracking-tight text-[15px]">AI Executive Insights</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-[13px] leading-relaxed mt-2">
                Receive daily briefs, risk analysis on deadlines, and dynamic roadmap recalculations to keep your objectives on absolute track.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 sm:px-8 py-8 border-t border-slate-100 dark:border-zinc-900/60 z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium font-mono uppercase tracking-wider">
          Motive AI &copy; 2026. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-xs text-slate-450 dark:text-zinc-500 font-semibold">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-500" />
            <span>Secure Cloud Sandbox</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
