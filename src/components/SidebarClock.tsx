import React, { useEffect, useState } from 'react';

interface SidebarClockProps {
  isSidebarCollapsed: boolean;
}

export const SidebarClock: React.FC<SidebarClockProps> = ({ isSidebarCollapsed }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Calculations for analog clock hands angles
  const hourDegrees = ((hours % 12) * 30) + (minutes * 0.5);
  const minuteDegrees = (minutes * 6) + (seconds * 0.1);
  const secondDegrees = seconds * 6;

  // Format date
  const dayName = time.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = time.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = time.getDate();

  // Format digital time
  const digitalTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedHour = time.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false });
  const formattedMin = time.toLocaleTimeString('en-US', { minute: '2-digit' });
  const ampm = time.getHours() >= 12 ? 'PM' : 'AM';

  if (isSidebarCollapsed) {
    return (
      <div className="flex flex-col items-center justify-center py-2.5 animate-in fade-in duration-300">
        <div 
          className="relative w-9 h-9 rounded-full bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-850 flex items-center justify-center shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] dark:shadow-none group cursor-pointer hover:border-slate-300/60 dark:hover:border-zinc-700/60 transition-all duration-300"
          title={`${digitalTime}\n${dayName}, ${monthName} ${dayNum}`}
        >
          {/* Subtle Ambient Radial Glow for Dark Mode */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/0 group-hover:bg-indigo-500/[0.03] dark:group-hover:bg-indigo-500/[0.02] transition-all duration-300 pointer-events-none" />
          
          {/* Clock Dial Face */}
          <svg className="w-full h-full transform -rotate-90 p-1" viewBox="0 0 40 40">
            {/* Hour hand */}
            <line
              x1="20"
              y1="20"
              x2="20"
              y2="12"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="text-slate-800 dark:text-zinc-100 transition-transform duration-500 ease-out"
              style={{
                transformOrigin: '20px 20px',
                transform: `rotate(${hourDegrees}deg)`,
              }}
            />
            {/* Minute hand */}
            <line
              x1="20"
              y1="20"
              x2="20"
              y2="8"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="text-slate-400 dark:text-zinc-400 transition-transform duration-500 ease-out"
              style={{
                transformOrigin: '20px 20px',
                transform: `rotate(${minuteDegrees}deg)`,
              }}
            />
            {/* Second hand */}
            <line
              x1="20"
              y1="20"
              x2="20"
              y2="6.5"
              stroke="#f97316" // Orange accent
              strokeWidth="0.8"
              strokeLinecap="round"
              className="transition-transform duration-100 ease-out"
              style={{
                transformOrigin: '20px 20px',
                transform: `rotate(${secondDegrees}deg)`,
              }}
            />
            {/* Center Pin */}
            <circle cx="20" cy="20" r="1.5" className="fill-slate-800 dark:fill-zinc-200" />
            <circle cx="20" cy="20" r="0.6" fill="#f97316" />
          </svg>
        </div>
        <span className="text-[9px] font-mono font-semibold mt-1 text-slate-400 dark:text-zinc-500">
          {dayNum}
        </span>
      </div>
    );
  }

  // Generate 12 tiny tick dots for premium modern clock look
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const r = 16; // radius of ticks
    const x = 20 + r * Math.cos(angle);
    const y = 20 + r * Math.sin(angle);
    const isMain = i % 3 === 0;
    return (
      <circle 
        key={i} 
        cx={x} 
        cy={y} 
        r={isMain ? 0.8 : 0.4} 
        className={isMain ? "fill-slate-400 dark:fill-zinc-500" : "fill-slate-200 dark:fill-zinc-800"} 
      />
    );
  });

  return (
    <div className="mx-1.5 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-900 bg-slate-50/[0.3] dark:bg-zinc-950/[0.15] hover:bg-slate-50/[0.6] dark:hover:bg-zinc-950/[0.25] transition-all duration-300 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Date & Elegant Digital Time (Left) */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 tracking-wider font-sans uppercase">
            {dayName}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <span className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400">
            {monthName} {dayNum}
          </span>
        </div>
        
        {/* Dynamic Hour:Min + AM/PM in clean typography */}
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-lg font-semibold tracking-tight text-slate-850 dark:text-zinc-100 font-sans leading-none">
            {formattedHour}:{formattedMin}
          </span>
          <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
            {ampm}
          </span>
        </div>
      </div>

      {/* Modern Borderless Analog Clock (Right) */}
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
        {/* Subtle dynamic background pulsing glow for seconds */}
        <div className="absolute inset-0 rounded-full bg-orange-500/[0.015] dark:bg-orange-500/[0.01] animate-pulse" />
        
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
          {/* Premium micro tick marks */}
          {ticks}

          {/* Hour hand */}
          <line
            x1="20"
            y1="20"
            x2="20"
            y2="12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="text-slate-850 dark:text-zinc-100"
            style={{
              transformOrigin: '20px 20px',
              transform: `rotate(${hourDegrees}deg)`,
            }}
          />
          {/* Minute hand */}
          <line
            x1="20"
            y1="20"
            x2="20"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="text-slate-400 dark:text-zinc-400"
            style={{
              transformOrigin: '20px 20px',
              transform: `rotate(${minuteDegrees}deg)`,
            }}
          />
          {/* Second hand */}
          <line
            x1="20"
            y1="20"
            x2="20"
            y2="6"
            stroke="#f97316" // Vibrant Orange Accent
            strokeWidth="0.8"
            strokeLinecap="round"
            style={{
              transformOrigin: '20px 20px',
              transform: `rotate(${secondDegrees}deg)`,
            }}
          />
          
          {/* Premium Center Axis with multi-ring composition */}
          <circle cx="20" cy="20" r="1.6" className="fill-slate-850 dark:fill-zinc-100" />
          <circle cx="20" cy="20" r="0.6" fill="#f97316" />
        </svg>
      </div>

    </div>
  );
};
