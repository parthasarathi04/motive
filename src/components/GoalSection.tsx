import React, { useState } from 'react';
import { useMotive } from '../contexts/MotiveContext';
import { Target, Plus, Calendar, AlertTriangle, CheckCircle, Trash2, ArrowUpRight, PlusCircle, Folder, Clock, CheckSquare, GitBranch, X } from 'lucide-react';
import { BusinessEngine } from '../utils/BusinessEngine';
import { Goal, Commitment } from '../types';
import { DependencyGraph } from './DependencyGraph';

export const GoalSection: React.FC<{ minimal?: boolean }> = ({ minimal = false }) => {
  const { goals, deleteGoal, commitments, relationships, setActiveView } = useMotive();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Graph workspace states
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isGraphOpenForNew, setIsGraphOpenForNew] = useState(false);

  const getRiskStyles = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'HIGH':
        return 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400';
      case 'MEDIUM':
        return 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300';
    }
  };

  const getMomentumColor = (score: number) => {
    if (score >= 75) return 'text-emerald-800 dark:text-emerald-400';
    if (score >= 40) return 'text-indigo-800 dark:text-indigo-400';
    return 'text-amber-850 dark:text-amber-400';
  };



  return (
    <div className={minimal ? "space-y-3" : "space-y-4"} id="motive-goals-section">
      {!minimal && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setIsGraphOpenForNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Goal
          </button>
        </div>
      )}

      {minimal && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="h-4 w-4 text-emerald-600" />
            <h2 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">Active Goals</h2>
          </div>
        </div>
      )}

      {/* Goals Card Grid */}
      <div className="grid grid-cols-1 gap-3">
        {(minimal ? goals.slice(0, 2) : goals).map((goal) => {
          const progress = BusinessEngine.calculateGoalProgress(goal.id, commitments, relationships);
          const momentum = BusinessEngine.calculateGoalMomentum(goal.id, commitments, relationships);
          const risk = BusinessEngine.calculateGoalRisk(goal, commitments, relationships);

          // Render minimal card for Home page
          if (minimal) {
            return (
              <div
                key={goal.id}
                onClick={() => {
                  setSelectedGoalId(goal.id);
                  setIsGraphOpen(true);
                }}
                className="group relative bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 rounded-xl p-3.5 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] uppercase font-mono tracking-wider font-semibold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                    <Folder className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
                    {goal.area}
                  </span>
                  <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${getRiskStyles(risk)}`}>
                    {risk}
                  </span>
                </div>

                <h4 className="text-[13px] font-bold text-slate-855 dark:text-zinc-100 tracking-tight mt-1.5 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  {goal.title}
                </h4>

                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 dark:text-zinc-500">
                    <span>Deadline: {goal.deadline}</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-350">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          }

          // Render standard detailed card for Goals page
          // Find linked commitments and detect the next incomplete task/action
          const connectedCommitmentIds = relationships
            .filter(r => r.goalId === goal.id)
            .map(r => r.commitmentId);
          const connectedComms = commitments.filter(c => connectedCommitmentIds.includes(c.id));
          const nextIncompleteAction = connectedComms.find(c => c.status !== 'COMPLETED');

          return (
            <div
              key={goal.id}
              onClick={() => {
                setSelectedGoalId(goal.id);
                setIsGraphOpen(true);
              }}
              className="group relative bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 rounded-xl p-4.5 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-lg transition-all duration-250 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Folder className="h-3 w-3" />
                  {goal.area}
                </span>

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border ${getRiskStyles(risk)}`}>
                    {risk} RISK
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGoal(goal.id);
                    }}
                    className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all cursor-pointer"
                    title="Remove Goal"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-[14.5px] font-bold text-slate-900 dark:text-zinc-50 tracking-tight mt-2 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {goal.title}
              </h3>
              
              <p className="text-[11.5px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                {goal.description}
              </p>

              {/* Next Action Sub-Strip */}
              {nextIncompleteAction && (
                <div className="mb-3.5 px-2.5 py-1.5 bg-slate-50/70 dark:bg-[#1c1d1e]/50 rounded-lg border border-slate-100 dark:border-zinc-900/60 flex items-center gap-2 text-[10.5px] text-slate-600 dark:text-zinc-400">
                  <span className="font-bold text-emerald-850 dark:text-emerald-400 font-mono tracking-wide uppercase text-[8px]">Next:</span>
                  <span className="truncate font-medium" title={nextIncompleteAction.title}>{nextIncompleteAction.title}</span>
                </div>
              )}

              {/* Progress and Momentum bar */}
              <div className="space-y-1.5 mt-3 pt-0.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10.5px] font-mono text-slate-500 dark:text-zinc-500">
                  <span className="flex items-center gap-1 min-w-0">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Deadline: {goal.deadline}</span>
                  </span>
                  <span className="font-semibold text-slate-855 dark:text-zinc-300 shrink-0">{progress}% Progress</span>
                </div>
                
                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Momentum Badge in corner */}
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-900/60 text-[10px] font-mono">
                <span className="text-slate-400 dark:text-zinc-500">Execution Score:</span>
                <span className={`font-semibold ${getMomentumColor(momentum)}`}>{momentum} Momentum</span>

                <span className="ml-auto text-[9.5px] font-bold text-emerald-600 dark:text-emerald-450 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                  Open Canvas Graph <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="w-full border border-dashed border-slate-200 dark:border-zinc-850 rounded-xl p-8 flex flex-col items-center justify-center text-center text-neutral-500">
            <Target className="h-10 w-10 text-neutral-300 dark:text-zinc-700 mb-3" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No active goals yet</h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-1 mb-4">Let's create your first execution plan.</p>
            <button
              onClick={() => setIsGraphOpenForNew(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Add First Goal
            </button>
          </div>
        )}
      </div>

      {minimal && goals.length > 2 && (
        <div className="pt-2 text-center">
          <button
            onClick={() => setActiveView?.('goals')}
            className="text-xs font-bold text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            View More Goals
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-450" />
          </button>
        </div>
      )}

      {/* Dependency Graph Popup for New Goal Creation */}
      {isGraphOpenForNew && (
        <DependencyGraph
          isNewGoalFlow={true}
          onClose={() => setIsGraphOpenForNew(false)}
        />
      )}

      {/* Dependency Graph Popup for Selected Goal */}
      {isGraphOpen && selectedGoalId && (
        <DependencyGraph
          goalId={selectedGoalId}
          onClose={() => setIsGraphOpen(false)}
        />
      )}
    </div>
  );
};
export default GoalSection;
