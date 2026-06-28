import React from 'react';
import { useMotive } from '../contexts/MotiveContext';
import { Mail, Check, X, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

export const ArtifactsQueue: React.FC = () => {
  const { artifacts, goals, acceptArtifact, dismissArtifact } = useMotive();

  const pending = artifacts.filter(a => a.status === 'PENDING');

  if (pending.length === 0) return null;

  return (
    <div className="mb-8" id="motive-artifacts-queue">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
        <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
          Discovery Inbox Queue 
          <span className="bg-emerald-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
            {pending.length}
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pending.map((art) => {
          const goal = art.suggestedGoalId ? goals.find(g => g.id === art.suggestedGoalId) : null;

          return (
            <div 
              key={art.id}
              className="bg-white dark:bg-[#131415] border border-slate-200/60 dark:border-zinc-800/80 rounded-[20px] p-5 hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm dark:shadow-none"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-slate-400 dark:text-zinc-500">
                    <Mail className="h-3.5 w-3.5" />
                    {art.source === 'GMAIL' ? 'GMail Extracted Action' : 'Calendar Event'}
                  </span>
                  
                  {art.confidence && (
                    <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9.5px] font-semibold whitespace-nowrap">
                      {art.confidence}% Confidence
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-50 tracking-tight leading-snug">
                    {art.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mt-1">
                    {art.summary}
                  </p>
                </div>

                {goal && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-mono px-2.5 py-1 rounded-lg border border-emerald-500/10 w-fit">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Connects to Goal: <strong className="font-semibold">{goal.title}</strong>
                  </div>
                )}
              </div>

              {/* Accept & Dismiss CTAs */}
              <div className="flex items-center gap-2 mt-4.5 pt-3 border-t border-slate-100 dark:border-zinc-850/80">
                <button
                  onClick={() => acceptArtifact(art)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve & Plan
                </button>
                
                <button
                  onClick={() => dismissArtifact(art.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 border border-slate-200/20 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-medium cursor-pointer transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  Dismiss
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ArtifactsQueue;
