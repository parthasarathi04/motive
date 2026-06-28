import React, { useState } from 'react';
import { useMotive } from '../contexts/MotiveContext';
import { 
  Calendar, 
  CheckSquare, 
  Square, 
  Trash2, 
  Clock, 
  Brain, 
  Tag, 
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronDown,
  Repeat,
  FileText,
  ArrowRight,
  Activity,
  Check
} from 'lucide-react';
import { CommitmentType, CommitmentConstraint } from '../types';

export const CommitmentsSection: React.FC = () => {
  const { 
    commitments, 
    goals, 
    relationships, 
    updateCommitment, 
    deleteCommitment, 
    toggleCommitmentComplete 
  } = useMotive();
  
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'COMPLETED' | 'DELETED'>('ACTIVE');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'TASK' | 'FOCUS_BLOCK' | 'EVENT'>('ALL');

  const [confirmModal, setConfirmModal] = useState<{
    type: 'COMPLETE' | 'DELETE' | 'HARD_DELETE';
    commitmentId: string;
    commitmentTitle: string;
    goalTitle: string;
  } | null>(null);

  const [dependencyLockModal, setDependencyLockModal] = useState<{
    title: string;
    prerequisites: string[];
  } | null>(null);

  // Helper: Get formatted date and time for commitment
  const formatCommitmentTime = (comm: any) => {
    if (!comm.startTime) return null;
    
    try {
      const startDate = new Date(comm.startTime);
      const startFormat = startDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      const timeFormat = startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      if (comm.endTime) {
        const endDate = new Date(comm.endTime);
        const timeEndFormat = endDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        // Check if multi-day
        if (comm.endDateStr && comm.endDateStr !== comm.startTime.split('T')[0]) {
          const endFormat = new Date(comm.endDateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
          return `${startFormat} - ${endFormat} • ${timeFormat} - ${timeEndFormat}`;
        }
        
        return `${startFormat} • ${timeFormat} - ${timeEndFormat}`;
      }
      
      return `${startFormat} • ${timeFormat}`;
    } catch (e) {
      return null;
    }
  };

  // Helper: Format repeating patterns
  const formatRepeatPattern = (comm: any) => {
    if (!comm.isRepeating || comm.repeatType === 'NONE') return null;
    if (comm.repeatType === 'DAILY') return 'Daily';
    if (comm.repeatType === 'WEEKLY' && comm.repeatDays) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const activeDays = comm.repeatDays.map((d: number) => days[d]).join(', ');
      return `Weekly on ${activeDays}`;
    }
    return 'Repeating';
  };

  // Filter logic
  const filteredCommitments = commitments.filter(c => {
    // 1. Status filter
    if (statusFilter === 'ACTIVE') {
      if (c.status === 'COMPLETED' || c.status === 'CANCELLED') return false;
    } else if (statusFilter === 'COMPLETED') {
      if (c.status !== 'COMPLETED') return false;
    } else if (statusFilter === 'DELETED') {
      if (c.status !== 'CANCELLED') return false;
    }

    // 2. Type filter
    if (typeFilter !== 'ALL') {
      if (c.type !== typeFilter) return false;
    }

    return true;
  });

  // Count items for badges
  const countByStatus = (status: 'ACTIVE' | 'COMPLETED' | 'DELETED') => {
    return commitments.filter(c => {
      if (status === 'ACTIVE') return c.status !== 'COMPLETED' && c.status !== 'CANCELLED';
      if (status === 'COMPLETED') return c.status === 'COMPLETED';
      return c.status === 'CANCELLED';
    }).length;
  };

  const getConstraintBadge = (cons: CommitmentConstraint) => {
    switch (cons) {
      case 'FIXED':
        return 'bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
      case 'OPTIONAL':
        return 'bg-neutral-50 dark:bg-zinc-900/40 text-neutral-500 dark:text-zinc-400 border-neutral-200/40 dark:border-zinc-800/45';
      default:
        return 'bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30';
    }
  };

  const getGoalThemeColor = (goalId: string) => {
    const hash = goalId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-indigo-50/60 border-indigo-200 text-indigo-700 dark:bg-indigo-950/15 dark:border-indigo-900/20 dark:text-indigo-400',
      'bg-emerald-50/60 border-emerald-200 text-emerald-700 dark:bg-emerald-950/15 dark:border-emerald-900/20 dark:text-emerald-400',
      'bg-amber-50/60 border-amber-200 text-amber-700 dark:bg-amber-950/15 dark:border-amber-900/20 dark:text-amber-400',
      'bg-rose-50/60 border-rose-200 text-rose-700 dark:bg-rose-950/15 dark:border-rose-900/20 dark:text-rose-400',
      'bg-teal-50/60 border-teal-200 text-teal-700 dark:bg-teal-950/15 dark:border-teal-900/20 dark:text-teal-400',
      'bg-purple-50/60 border-purple-200 text-purple-700 dark:bg-purple-950/15 dark:border-purple-900/20 dark:text-purple-400'
    ];
    return colors[hash % colors.length];
  };

  const getTypeIcon = (type: CommitmentType) => {
    switch (type) {
      case 'FOCUS_BLOCK':
        return <Sparkles className="h-3.5 w-3.5" />;
      case 'EVENT':
        return <Calendar className="h-3.5 w-3.5" />;
      default:
        return <CheckCircle2 className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-6" id="motive-commitments-section">
      
      {/* Dynamic Header Filter Controls (Premium borders restored) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/20 dark:bg-zinc-950/10 border border-neutral-200 dark:border-zinc-800/80 px-4 py-3 rounded-2xl">
        
        {/* Main Status Filters - 3 Connected Buttons Segmented Control */}
        <div className="inline-flex rounded-xl border border-neutral-200/80 dark:border-zinc-800/50 p-0.5 bg-neutral-100/30 dark:bg-zinc-950/30">
          {(['ACTIVE', 'COMPLETED', 'DELETED'] as const).map(status => {
            const isActive = statusFilter === status;
            const count = countByStatus(status);
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5 border ${
                  isActive 
                    ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-50 shadow-xs border-neutral-200/40 dark:border-zinc-800/60' 
                    : 'bg-transparent border-transparent text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200'
                }`}
              >
                <span className="capitalize">{status.toLowerCase()}</span>
                <span className={`text-[10px] px-1.5 py-0.25 rounded-full font-mono font-semibold transition-all ${
                  isActive 
                    ? 'bg-neutral-100 dark:bg-zinc-800/85 text-neutral-700 dark:text-zinc-400' 
                    : 'bg-transparent text-neutral-400/80 dark:text-zinc-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dropdown for Type Filter */}
        <div className="relative shrink-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full sm:w-auto appearance-none pl-3.5 pr-9 py-1.5 bg-white dark:bg-[#0c0d0e] border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-zinc-300 focus:outline-none focus:border-neutral-300 dark:focus:border-zinc-700 focus:ring-1 focus:ring-neutral-200/50 dark:focus:ring-zinc-800 transition-all cursor-pointer shadow-xs"
          >
            <option value="ALL">All Types</option>
            <option value="TASK">Tasks Only</option>
            <option value="FOCUS_BLOCK">AI Focus Blocks</option>
            <option value="EVENT">Calendar Events</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 dark:text-zinc-500">
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>

      </div>

      {/* Commitments List with Premium squarish cards in a responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCommitments.map((comm) => {
          // Find if there is a relationship to a goal
          const rel = relationships.find(r => r.commitmentId === comm.id);
          const goal = rel ? goals.find(g => g.id === rel.goalId) : null;

          // Dependency calculation
          const incompletePrereqs = comm.dependsOn
            ? comm.dependsOn
                .map(pid => commitments.find(c => c.id === pid))
                .filter(c => c && c.status !== 'COMPLETED')
                .map(c => c!.title)
            : [];
          
          const hasIncompletePrereqs = incompletePrereqs.length > 0;

          const timeDetails = formatCommitmentTime(comm);
          const repeatPattern = formatRepeatPattern(comm);

          return (
            <div
              key={comm.id}
              className={`group relative flex flex-col justify-between bg-white dark:bg-[#0c0d0e] border p-5 rounded-2xl transition-all duration-300 border-neutral-200 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.4)] hover:border-neutral-300 dark:hover:border-zinc-700 hover:translate-y-[-1.5px] min-h-[220px] ${
                comm.status === 'COMPLETED' ? 'bg-neutral-50/10 dark:bg-zinc-950/5 opacity-70' : ''
              }`}
            >
              
              {/* Upper Section */}
              <div className="space-y-3.5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Badge representing type */}
                    <span className={`p-1 rounded-lg shrink-0 ${
                      comm.type === 'FOCUS_BLOCK' 
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500 border border-amber-100/50 dark:border-amber-900/10' 
                        : comm.type === 'EVENT' 
                        ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-500 border border-blue-100/50 dark:border-blue-900/10' 
                        : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 border border-indigo-100/50 dark:border-indigo-900/10'
                    }`}>
                      {getTypeIcon(comm.type)}
                    </span>

                    {/* Source Origin Indicators */}
                    {comm.origin === 'CALENDAR' && (
                      <span className="text-[9px] font-mono tracking-wider font-bold bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-md uppercase">Google Cal</span>
                    )}
                    {comm.origin === 'GMAIL' && (
                      <span className="text-[9px] font-mono tracking-wider font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-md uppercase">GMail</span>
                    )}
                    {comm.origin === 'AI' && (
                      <span className="text-[9px] font-mono tracking-wider font-bold bg-amber-50 border border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-md uppercase flex items-center gap-1">
                        <Brain className="h-2.5 w-2.5 animate-pulse" />
                        AI Planned
                      </span>
                    )}
                  </div>

                  {/* Action Group: Checkbox & Actions (Delete, Restore, etc.) */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {statusFilter !== 'DELETED' ? (
                      <>
                        {/* Circular Checkbox Trigger with Dependency Safeguard support & Tooltip */}
                        <div className="relative group/tooltip">
                          <button
                            onClick={() => {
                              if (hasIncompletePrereqs && comm.status !== 'COMPLETED') {
                                // Dependency Lock: Show informational locked sequence modal instead of bypass
                                setDependencyLockModal({
                                  title: comm.title,
                                  prerequisites: incompletePrereqs as string[]
                                });
                                return;
                              }

                              if (goal && comm.status !== 'COMPLETED') {
                                setConfirmModal({
                                  type: 'COMPLETE',
                                  commitmentId: comm.id,
                                  commitmentTitle: comm.title,
                                  goalTitle: goal.title
                                });
                              } else {
                                toggleCommitmentComplete(comm.id);
                              }
                            }}
                            className={`group/checkbox flex items-center justify-center h-5 w-5 border transition-all duration-200 cursor-pointer ${
                              comm.status === 'COMPLETED'
                                ? 'rounded-full bg-emerald-500 border-emerald-500 text-white dark:bg-emerald-500 dark:border-emerald-500'
                                : hasIncompletePrereqs
                                ? 'rounded-md border-amber-300 dark:border-amber-900/40 text-amber-500 bg-amber-50/10 dark:bg-amber-950/10'
                                : 'rounded-md hover:rounded-full border-neutral-400 dark:border-zinc-500 text-transparent hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10'
                            }`}
                          >
                            {comm.status === 'COMPLETED' ? (
                              <Check className="h-3 w-3 stroke-[3px]" />
                            ) : hasIncompletePrereqs ? (
                              <Lock className="h-2.5 w-2.5 text-amber-500 dark:text-amber-400" />
                            ) : (
                              <Check className="h-3 w-3 text-emerald-500/60 dark:text-emerald-400/60 opacity-0 group-hover/checkbox:opacity-100 transition-opacity duration-150 stroke-[2.5px]" />
                            )}
                          </button>

                          {/* Pure CSS Hover Tooltip */}
                          <div className="absolute right-0 bottom-full mb-1.5 px-2 py-1 bg-neutral-900 dark:bg-zinc-800 text-white dark:text-zinc-200 text-[10px] font-bold rounded-md opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-150 whitespace-nowrap shadow-md pointer-events-none z-10 border border-neutral-800 dark:border-zinc-700">
                            {comm.status === 'COMPLETED' 
                              ? 'Completed' 
                              : hasIncompletePrereqs 
                              ? 'Sequence Locked (Prereqs Required)' 
                              : 'Mark as Complete'}
                          </div>
                        </div>

                        {/* Move to Trash Button with Confirmation Modal support */}
                        <button
                          onClick={() => {
                            setConfirmModal({
                              type: 'DELETE',
                              commitmentId: comm.id,
                              commitmentTitle: comm.title,
                              goalTitle: goal?.title || undefined
                            });
                          }}
                          className="p-1 rounded-lg text-neutral-400 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-neutral-50 dark:hover:bg-zinc-900/40 transition-all cursor-pointer"
                          title="Move to Trash"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCommitment(comm.id, { status: 'PLANNED' })}
                          className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-900/60 text-neutral-650 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-500 text-[9.5px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs bg-white dark:bg-zinc-950"
                          title="Restore commitment"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          Restore
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              type: 'HARD_DELETE',
                              commitmentId: comm.id,
                              commitmentTitle: comm.title,
                              goalTitle: goal?.title || undefined
                            });
                          }}
                          className="px-2 py-1 rounded-lg border border-rose-200/50 dark:border-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/15 text-rose-600 dark:text-rose-400 text-[9.5px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs bg-rose-50/5 dark:bg-rose-950/5"
                          title="Delete permanently"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                          Forever
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Main Title and description */}
                <div className="space-y-1.5 flex-1">
                  <h4 className={`text-sm font-bold tracking-tight text-neutral-800 dark:text-zinc-50 leading-snug ${
                    comm.status === 'COMPLETED' ? 'line-through text-neutral-400 dark:text-zinc-500 font-semibold' : ''
                  }`}>
                    {comm.title}
                  </h4>
                  
                  {comm.description && (
                    <p className={`text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed line-clamp-3 ${
                      comm.status === 'COMPLETED' ? 'opacity-60' : ''
                    }`}>
                      {comm.description}
                    </p>
                  )}
                </div>

                {/* Metadata details block (aligned nicely) */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-400 dark:text-zinc-500 pt-1.5 border-t border-neutral-100 dark:border-zinc-900/30">
                  <span className="flex items-center gap-1 font-semibold text-neutral-500 dark:text-zinc-400">
                    <Clock className="h-3 w-3 opacity-70" />
                    {comm.estimatedDuration}m
                  </span>

                  <span className={`px-1.5 py-0.25 rounded border text-[8.5px] font-bold uppercase tracking-wider ${getConstraintBadge(comm.constraint)}`}>
                    {comm.constraint}
                  </span>

                  {repeatPattern && (
                    <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/15 border border-indigo-100/15 px-1.5 py-0.25 rounded">
                      <Repeat className="h-2.5 w-2.5 opacity-70" />
                      {repeatPattern}
                    </span>
                  )}
                </div>

                {/* Supportive Goal Badge (Fit content, not full width, with padding) */}
                {goal && (
                  <div className={`w-fit max-w-full inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold tracking-tight transition-all self-start ${getGoalThemeColor(goal.id)}`}>
                    <Tag className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    <span className="truncate">Goal: {goal.title}</span>
                  </div>
                )}
              </div>

              {/* Lower Section (only render if there's scheduled time or sequences/dependencies) */}
              {(timeDetails || (comm.dependsOn && comm.dependsOn.length > 0)) && (
                <div className="mt-4 pt-3 border-t border-neutral-200/60 dark:border-zinc-800/60 space-y-3">
                  
                  {/* Real-time schedule label if allocated (Fit content, not full width, with padding) */}
                  {timeDetails && (
                    <div className="w-fit inline-flex items-center gap-1.5 text-[10px] font-mono text-neutral-600 dark:text-zinc-400 font-semibold bg-neutral-50/50 dark:bg-zinc-900/20 border border-neutral-200/40 dark:border-zinc-800/30 px-2.5 py-1 rounded-lg">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500/80" />
                      <span className="truncate">{timeDetails}</span>
                    </div>
                  )}

                  {/* Prerequisite dependencies chain representation */}
                  {comm.dependsOn && comm.dependsOn.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[9.5px] font-mono">
                      <span className="text-neutral-400 dark:text-zinc-400 flex items-center gap-0.5 shrink-0">
                        <Activity className="h-2.5 w-2.5 opacity-55" />
                        Seq:
                      </span>
                      {comm.dependsOn.map((pid: string) => {
                        const parent = commitments.find(c => c.id === pid);
                        if (!parent) return null;
                        const isDone = parent.status === 'COMPLETED';
                        return (
                          <div 
                            key={pid} 
                            title={parent.title}
                            className={`relative group/seqpill flex items-center gap-0.5 px-1.5 py-0.25 rounded border max-w-[100px] cursor-help ${
                              isDone 
                                ? 'bg-emerald-50/20 border-emerald-100/10 text-emerald-600 dark:bg-emerald-950/10 dark:text-emerald-500' 
                                : 'bg-amber-50/20 border-amber-100/10 text-amber-600 dark:bg-amber-950/10 dark:text-amber-400'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="h-2 w-2 shrink-0" /> : <Lock className="h-2 w-2 shrink-0" />}
                            <span className="truncate">{parent.title}</span>

                            {/* Pure CSS Tooltip for Sequence Pillar */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 bg-neutral-900 dark:bg-zinc-800 text-white dark:text-zinc-200 text-[10px] font-bold rounded-lg opacity-0 invisible group-hover/seqpill:opacity-100 group-hover/seqpill:visible transition-all duration-150 whitespace-nowrap shadow-lg pointer-events-none z-20 border border-neutral-800 dark:border-zinc-700">
                              {parent.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}

        {/* Empty States Handling */}
        {filteredCommitments.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-neutral-200 dark:border-zinc-800 rounded-3xl py-24 px-14 flex flex-col items-center justify-center text-center bg-neutral-50/15 dark:bg-zinc-950/10 min-h-[380px] transition-all">
            <Layers className="h-11 w-11 text-neutral-300 dark:text-zinc-600 mb-4 opacity-80 animate-pulse" />
            <p className="text-base font-semibold text-neutral-600 dark:text-zinc-300">
              {statusFilter === 'DELETED' 
                ? 'Trash is empty' 
                : statusFilter === 'COMPLETED' 
                ? 'No completed tasks yet' 
                : 'All clear! No pending tasks'}
            </p>
            <p className="text-xs text-neutral-400 dark:text-zinc-500 mt-2 max-w-sm leading-relaxed">
              {statusFilter === 'DELETED' 
                ? 'Any items you delete will land here, and can be easily restored or deleted forever.' 
                : statusFilter === 'COMPLETED'
                ? 'Complete active tasks to see them tracked in your achievements log.'
                : 'Excellent work. Maintain your momentum and sequence new achievements.'}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal Safeguard for Goals & Deletions */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#0c0d0e] border border-slate-200/80 dark:border-zinc-800/85 w-full max-w-md rounded-2xl overflow-hidden shadow-xl p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-left">
            <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {confirmModal.goalTitle ? (
                <>
                  <Brain className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
                  Goal Alignment Safeguard
                </>
              ) : (
                <>
                  <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
                  Confirm Action
                </>
              )}
            </h3>
            
            {confirmModal.goalTitle ? (
              <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                The item <strong className="text-slate-800 dark:text-zinc-100">"{confirmModal.commitmentTitle}"</strong> is linked directly to your active goal <strong className="text-slate-800 dark:text-zinc-100">"{confirmModal.goalTitle}"</strong>. Doing so affects your active sequence and goal calculations.
              </p>
            ) : (
              <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                You are about to modify <strong className="text-slate-800 dark:text-zinc-100">"{confirmModal.commitmentTitle}"</strong>.
              </p>
            )}

            <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              Are you sure you want to {
                confirmModal.type === 'COMPLETE' 
                  ? 'mark it complete' 
                  : confirmModal.type === 'HARD_DELETE' 
                  ? 'permanently delete it forever' 
                  : 'move it to trash'
              }?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-zinc-900">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 bg-slate-50 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmModal.type === 'COMPLETE') {
                    await toggleCommitmentComplete(confirmModal.commitmentId);
                  } else if (confirmModal.type === 'DELETE') {
                    await updateCommitment(confirmModal.commitmentId, { status: 'CANCELLED' });
                  } else if (confirmModal.type === 'HARD_DELETE') {
                    await deleteCommitment(confirmModal.commitmentId);
                  }
                  setConfirmModal(null);
                }}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-sm ${
                  confirmModal.type === 'COMPLETE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dependency Locked Sequence Modal (No choice/confirm buttons - completely informative block as requested!) */}
      {dependencyLockModal && (
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-zinc-950/75 backdrop-blur-xs z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#0c0d0e] border border-neutral-200 dark:border-zinc-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-left">
            
            <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-zinc-900 pb-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
                <Lock className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  Dependency Lock Safeguard
                </h3>
                <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold">
                  Prerequisite Sequence Lock
                </p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              The task <strong className="text-slate-800 dark:text-zinc-100">"{dependencyLockModal.title}"</strong> is dynamically locked in your goal execution sequence.
            </p>
            
            <div className="space-y-2 bg-neutral-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-neutral-200 dark:border-zinc-800/60">
              <p className="text-[10.5px] font-mono font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                Unresolved Prerequisite Tasks:
              </p>
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {dependencyLockModal.prerequisites.map((title, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-zinc-300">
                    <div className="mt-0.5 text-amber-500 shrink-0">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold leading-relaxed">{title}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 leading-relaxed italic">
              Solve the prerequisite tasks above first in order to safely unlock this commitment in your active workspace sequence.
            </p>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setDependencyLockModal(null)}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-neutral-700 dark:text-zinc-200 bg-neutral-100 dark:bg-zinc-900 hover:bg-neutral-200 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs border border-neutral-200/50 dark:border-zinc-800"
              >
                Understood & Close
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CommitmentsSection;
