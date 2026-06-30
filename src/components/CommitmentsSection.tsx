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
  Check,
  Pencil,
  Copy,
  Archive,
  Flame,
  Target
} from 'lucide-react';
import { CommitmentType, CommitmentConstraint } from '../types';

export const CommitmentsSection: React.FC = () => {
  const { 
    commitments, 
    goals, 
    relationships, 
    updateCommitment, 
    deleteCommitment, 
    toggleCommitmentComplete,
    addCommitment
  } = useMotive();
  
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'COMPLETED' | 'DELETED'>('ACTIVE');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'TASK' | 'FOCUS_BLOCK' | 'EVENT'>('ALL');

  const [editModalComm, setEditModalComm] = useState<any | null>(null);

  // Edit form states
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<CommitmentType>('TASK');
  const [editStatus, setEditStatus] = useState<any>('PLANNED');
  const [editGoalId, setEditGoalId] = useState<string>('');
  const [editDuration, setEditDuration] = useState<number>(30);
  const [editDate, setEditDate] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');

  React.useEffect(() => {
    if (editModalComm) {
      setEditTitle(editModalComm.title);
      setEditDescription(editModalComm.description || '');
      setEditType(editModalComm.type || 'TASK');
      setEditStatus(editModalComm.status || 'PLANNED');
      setEditGoalId(editModalComm.goalId || '');
      setEditDuration(editModalComm.estimatedDuration || 30);
      
      if (editModalComm.startTime) {
        try {
          const dt = new Date(editModalComm.startTime);
          setEditDate(dt.toISOString().split('T')[0]);
          const hh = String(dt.getHours()).padStart(2, '0');
          const mm = String(dt.getMinutes()).padStart(2, '0');
          setEditStartTime(`${hh}:${mm}`);
        } catch {
          setEditDate('');
          setEditStartTime('');
        }
      } else {
        setEditDate('');
        setEditStartTime('');
      }

      if (editModalComm.endTime) {
        try {
          const dt = new Date(editModalComm.endTime);
          const hh = String(dt.getHours()).padStart(2, '0');
          const mm = String(dt.getMinutes()).padStart(2, '0');
          setEditEndTime(`${hh}:${mm}`);
        } catch {
          setEditEndTime('');
        }
      } else {
        setEditEndTime('');
      }
    }
  }, [editModalComm]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalComm) return;

    let startTimeISO: string | null = null;
    let endTimeISO: string | null = null;

    if (editDate && editStartTime) {
      try {
        startTimeISO = new Date(`${editDate}T${editStartTime}`).toISOString();
        if (editEndTime) {
          endTimeISO = new Date(`${editDate}T${editEndTime}`).toISOString();
        }
      } catch (err) {
        console.error("Invalid date or time", err);
      }
    }

    try {
      await updateCommitment(editModalComm.id, {
        title: editTitle,
        description: editDescription,
        type: editType,
        status: editStatus,
        goalId: editGoalId || null,
        estimatedDuration: Number(editDuration),
        startTime: startTimeISO,
        endTime: endTimeISO,
      });
      setEditModalComm(null);
    } catch (err) {
      console.error("Failed to update commitment:", err);
    }
  };

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
        return 'bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400/90 border-rose-500/10 dark:border-rose-500/20 text-[8.5px] font-mono tracking-wider';
      case 'OPTIONAL':
        return 'bg-slate-500/5 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/10 dark:border-slate-500/20 text-[8.5px] font-mono tracking-wider';
      default:
        return 'bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400/90 border-blue-500/10 dark:border-blue-500/20 text-[8.5px] font-mono tracking-wider';
    }
  };

  const getGoalThemeColor = (goalId: string) => {
    return 'bg-slate-50/50 border-slate-200/50 text-slate-600 dark:bg-zinc-900/30 dark:border-zinc-800/80 dark:text-zinc-400';
  };

  const handleDuplicate = async (comm: any) => {
    const { id, userId, createdAt, updatedAt, ...rest } = comm;
    rest.title = `${rest.title} (Copy)`;
    await addCommitment(rest);
  };

  const handleRescheduleOneDay = (comm: any) => {
    if (comm.startTime) {
      const current = new Date(comm.startTime);
      current.setDate(current.getDate() + 1);
      updateCommitment(comm.id, { startTime: current.toISOString() });
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      updateCommitment(comm.id, { startTime: tomorrow.toISOString() });
    }
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
              className={`group relative flex flex-col justify-between bg-white dark:bg-[#0c0d0e] border p-5 rounded-2xl transition-all duration-200 border-neutral-200 dark:border-zinc-800 shadow-xs hover:shadow-md hover:border-neutral-300 dark:hover:border-zinc-700 min-h-[240px] ${
                comm.status === 'COMPLETED' ? 'bg-neutral-50/15 dark:bg-zinc-950/5 opacity-70' : ''
              }`}
            >
              
              {/* Upper Section */}
              <div className="space-y-3.5 flex-1 flex flex-col pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Badge representing type */}
                    <span className="p-1 rounded-lg shrink-0 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
                      {getTypeIcon(comm.type)}
                    </span>

                    {/* Source Origin Indicators */}
                    {comm.origin === 'CALENDAR' && (
                      <span className="text-[9px] font-mono tracking-wider font-semibold bg-slate-100 border border-slate-200 text-slate-600 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-400 px-1.5 py-0.5 rounded-md uppercase">Google Cal</span>
                    )}
                    {comm.origin === 'EMAIL' && (
                      <span className="text-[9px] font-mono tracking-wider font-semibold bg-slate-100 border border-slate-200 text-slate-600 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-400 px-1.5 py-0.5 rounded-md uppercase">Email</span>
                    )}
                    {comm.origin === 'AI' && (
                      <span className="text-[9px] font-mono tracking-wider font-semibold bg-slate-100 border border-slate-200 text-slate-600 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-400 px-1.5 py-0.5 rounded-md uppercase flex items-center gap-1">
                        <Brain className="h-2.5 w-2.5 text-zinc-400" />
                        AI Planned
                      </span>
                    )}
                  </div>

                  {/* Standard top-right simple status indicator */}
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${
                      comm.status === 'COMPLETED' ? 'bg-emerald-500' :
                      comm.status === 'BLOCKED' ? 'bg-rose-500' :
                      comm.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                      'bg-slate-300 dark:bg-zinc-700'
                    }`} />
                  </div>
                </div>

                {/* Card Main Title and description */}
                <div className="space-y-1.5 flex-1">
                  <h4 className={`text-sm font-bold tracking-tight text-neutral-800 dark:text-zinc-100 leading-snug ${
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

                {/* Metadata details block */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-neutral-400 dark:text-zinc-500 pt-1.5">
                  <span className="flex items-center gap-1 font-semibold text-slate-500 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-900/30 px-1.5 py-0.5 rounded border border-slate-100/80 dark:border-zinc-800/50">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {comm.estimatedDuration}m
                  </span>

                  <span className={`px-1.5 py-0.5 rounded border text-[8.5px] font-bold uppercase tracking-wider ${getConstraintBadge(comm.constraint)}`}>
                    {comm.constraint}
                  </span>

                  {/* Energy Required Badge */}
                  <span className="flex items-center gap-1 font-semibold text-slate-500 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-900/30 px-1.5 py-0.5 rounded border border-slate-100/80 dark:border-zinc-800/50">
                    <Flame className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
                    Energy: {comm.energyRequired || 'MEDIUM'}
                  </span>

                  {/* Estimated Impact Badge */}
                  <span className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-900/30 px-1.5 py-0.5 rounded border border-slate-100/80 dark:border-zinc-800/50">
                    <Target className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
                    Impact: {comm.estimatedImpact || 'MEDIUM'}
                  </span>

                  {repeatPattern && (
                    <span className="flex items-center gap-0.5 text-slate-500 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100/80 dark:border-zinc-800/50 px-1.5 py-0.5 rounded">
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
                <div className="mt-2 pt-3 border-t border-neutral-200/40 dark:border-zinc-800/40 space-y-3 pb-8">
                  
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
                            {isDone ? <CheckCircle2 className="h-2.5 w-2.5 shrink-0" /> : <Lock className="h-2.5 w-2.5 shrink-0" />}
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

              {/* Floating Hover Toolbar - Linear style revealed ONLY on hover! */}
              {statusFilter !== 'DELETED' && (
                <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-950/95 dark:bg-zinc-900/95 border border-zinc-800 dark:border-zinc-800 px-2 py-1 rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:pointer-events-auto transition-all duration-200 backdrop-blur-sm z-20 whitespace-nowrap">
                  
                  {/* Quick Complete Action */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasIncompletePrereqs && comm.status !== 'COMPLETED') {
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
                    className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-850 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title={comm.status === 'COMPLETED' ? 'Mark Incomplete' : 'Quick Complete'}
                  >
                    <Check className={`h-3.5 w-3.5 ${comm.status === 'COMPLETED' ? 'text-emerald-400' : ''}`} />
                  </button>

                  {/* Reschedule (+1 Day) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRescheduleOneDay(comm);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-850 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title="Reschedule +1 Day"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </button>

                  {/* Edit metadata */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditModalComm(comm);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-850 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title="Edit Details"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(comm);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-850 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title="Duplicate Item"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  {/* Move to Trash/Archive */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmModal({
                        type: 'DELETE',
                        commitmentId: comm.id,
                        commitmentTitle: comm.title,
                        goalTitle: goal?.title || undefined
                      });
                    }}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-850 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title="Archive/Move to Trash"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

            </div>
          );
        })}

        {/* Empty States Handling */}
        {filteredCommitments.length === 0 && (
          <div className="col-span-full border border-dashed border-slate-300 dark:border-zinc-800 rounded-2xl py-16 px-10 flex flex-col items-center justify-center text-center bg-slate-50/20 dark:bg-zinc-950/10 min-h-[320px] transition-all">
            <Layers className="h-7 w-7 text-slate-400 dark:text-zinc-500 mb-3" />
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
              {statusFilter === 'DELETED' 
                ? 'Trash is empty' 
                : statusFilter === 'COMPLETED' 
                ? 'No completed commitments' 
                : 'All clear! No pending actions'}
            </p>
            <p className="text-[11px] text-slate-450 dark:text-zinc-500 mt-1.5 max-w-xs leading-relaxed font-sans">
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
          <div className="bg-white dark:bg-[#0c0d0e] border border-neutral-200 dark:border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-left">
            
            <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-zinc-800 pb-3">
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

      {/* Edit Commitment Modal */}
      {editModalComm && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#0c0d0e] border border-slate-200/80 dark:border-zinc-800/85 w-full max-w-lg rounded-2xl overflow-hidden shadow-xl p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-zinc-900">
              <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="h-4 w-4 text-blue-500" />
                Edit Task & Commitment Details
              </h3>
              <button
                type="button"
                onClick={() => setEditModalComm(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-xs font-bold px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all font-sans font-medium"
                  placeholder="Task title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all font-sans leading-relaxed"
                  placeholder="Describe details, steps, or context"
                />
              </div>

              {/* Row: Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500 mb-1">
                    Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as CommitmentType)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all font-sans"
                  >
                    <option value="TASK">Task</option>
                    <option value="FOCUS_BLOCK">Focus Block</option>
                    <option value="EVENT">Calendar Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all font-sans"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled (Trash)</option>
                  </select>
                </div>
              </div>

              {/* Row: Goal and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500 mb-1">
                    Linked Goal
                  </label>
                  <select
                    value={editGoalId}
                    onChange={(e) => setEditGoalId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all font-sans"
                  >
                    <option value="">No Linked Goal</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500 mb-1">
                    Estimated Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Schedule Section */}
              <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-3.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  Timeline Schedule
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-sans font-medium text-slate-400 dark:text-zinc-500 mb-0.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-sans font-medium text-slate-400 dark:text-zinc-500 mb-0.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      disabled={!editDate}
                      className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-sans font-medium text-slate-400 dark:text-zinc-500 mb-0.5">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      disabled={!editDate || !editStartTime}
                      className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Are you sure you want to permanently delete this task?")) {
                      await deleteCommitment(editModalComm.id);
                      setEditModalComm(null);
                    }
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-rose-500 hover:text-white hover:bg-rose-600 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Permanently
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModalComm(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 bg-slate-50 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitmentsSection;
