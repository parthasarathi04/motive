import React from 'react';
import { useMotive } from '../contexts/MotiveContext';
import { Calendar, Target, CheckSquare, Sparkles, Plus, RefreshCw, GitCommit } from 'lucide-react';

export const TimelineSection: React.FC = () => {
  const { timeline } = useMotive();

  const getIcon = (type: string) => {
    switch (type) {
      case 'GOAL_CREATED':
        return <Target className="h-4 w-4 text-emerald-500" />;
      case 'COMMITMENT_COMPLETED':
        return <CheckSquare className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />;
      case 'RECOMMENDATION_ACCEPTED':
        return <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500/10 animate-pulse" />;
      case 'CALENDAR_IMPORTED':
      case 'EMAIL_DISCOVERED':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <GitCommit className="h-4 w-4 text-neutral-400" />;
    }
  };

  const getFormatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="space-y-4" id="motive-timeline-section">
      <div className="flex items-center gap-2 mb-2">
        <GitCommit className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">Timeline & Audit Feed</h2>
      </div>

      <div className="relative border-l border-neutral-200 dark:border-zinc-800 pl-6 ml-3 space-y-5">
        {timeline.map((entry) => (
          <div key={entry.id} className="relative group">
            {/* Timeline Dot */}
            <span className="absolute -left-[33px] top-0.5 bg-white dark:bg-zinc-950 p-1 border border-neutral-200 dark:border-zinc-800 rounded-full shadow-sm">
              {getIcon(entry.type)}
            </span>

            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-neutral-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                {getFormatTime(entry.createdAt)} &bull; {entry.type.replace('_', ' ')}
              </span>
              <p className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed font-medium">
                {entry.summary}
              </p>
            </div>
          </div>
        ))}

        {timeline.length === 0 && (
          <div className="text-center py-6 text-neutral-400 text-xs font-mono">
            Feed is currently empty. Initialize a goal to establish timeline coordinates.
          </div>
        )}
      </div>
    </div>
  );
};
export default TimelineSection;
