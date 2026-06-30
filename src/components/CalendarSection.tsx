import React, { useState, useEffect, useRef } from 'react';
import { useMotive } from '../contexts/MotiveContext';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomTimePicker } from './CustomTimePicker';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Brain, 
  AlertTriangle,
  Grid,
  Check,
  CheckSquare,
  Sparkles,
  Bot,
  Layers,
  Info,
  Sliders,
  X,
  PlusSquare,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { BusinessEngine } from '../utils/BusinessEngine';
import { Commitment, CommitmentType } from '../types';

interface PositionedCommitment {
  commitment: Commitment;
  top: number;
  height: number;
  left: string;
  width: string;
}

const getPositionedCommitments = (dayComms: Commitment[], paddingLeftRightPercent: number = 0, paddingLeftRightPx: number = 12): PositionedCommitment[] => {
  const validComms = dayComms
    .filter(c => c.startTime && c.endTime && c.status !== 'CANCELLED')
    .sort((a, b) => {
      const startA = new Date(a.startTime!).getTime();
      const startB = new Date(b.startTime!).getTime();
      if (startA !== startB) return startA - startB;
      const endA = new Date(a.endTime!).getTime();
      const endB = new Date(b.endTime!).getTime();
      return endB - endA;
    });

  if (validComms.length === 0) return [];

  // Calculate physical top, height, and bottom boundaries for each card based on the actual UI render size
  const minHeight = paddingLeftRightPx === 12 ? 55 : 25;
  const items = validComms.map(c => {
    const start = new Date(c.startTime!);
    const startMins = start.getHours() * 60 + start.getMinutes();
    const duration = c.estimatedDuration || 60;
    const top = startMins;
    const height = Math.max(duration, minHeight);
    const bottom = top + height;
    return {
      commitment: c,
      top,
      height,
      bottom
    };
  });

  // Cluster overlapping items physically
  const clusters: typeof items[] = [];
  let currentCluster: typeof items = [];
  let clusterBottom = 0;

  items.forEach(item => {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterBottom = item.bottom;
    } else if (item.top < clusterBottom) {
      currentCluster.push(item);
      if (item.bottom > clusterBottom) clusterBottom = item.bottom;
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterBottom = item.bottom;
    }
  });
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: PositionedCommitment[] = [];

  clusters.forEach(cluster => {
    const columns: typeof items[] = [];

    cluster.forEach(item => {
      let colIndex = -1;
      for (let i = 0; i < columns.length; i++) {
        const lastInCol = columns[i][columns[i].length - 1];
        // If this item physically starts at or after the last item's physical bottom, reuse the column
        if (item.top >= lastInCol.bottom) {
          colIndex = i;
          break;
        }
      }

      if (colIndex === -1) {
        columns.push([item]);
      } else {
        columns[colIndex].push(item);
      }
    });

    const totalCols = columns.length;
    
    cluster.forEach(item => {
      let colIndex = 0;
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].includes(item)) {
          colIndex = i;
          break;
        }
      }

      // Compute how many columns this item can stretch to the right without physical collision
      let colSpan = 1;
      for (let j = colIndex + 1; j < totalCols; j++) {
        const hasOverlapInCol = columns[j].some(other => {
          return item.top < other.bottom && other.top < item.bottom;
        });
        if (hasOverlapInCol) {
          break;
        }
        colSpan++;
      }

      const colWidthPercent = 100 / totalCols;
      const left = `calc(${colIndex * colWidthPercent}% + ${paddingLeftRightPx}px)`;
      const width = `calc(${colSpan * colWidthPercent}% - ${paddingLeftRightPx * 2}px)`;

      result.push({
        commitment: item.commitment,
        top: item.top,
        height: item.height,
        left,
        width
      });
    });
  });

  return result;
};

export const CalendarSection: React.FC = () => {
  const { 
    commitments, 
    addCommitment, 
    updateCommitment, 
    deleteCommitment, 
    toggleCommitmentComplete, 
    syncGoogleCalendar,
    setIsAiSidebarOpen,
    sendChatMessage
  } = useMotive();
  
  const [viewMode, setViewMode] = useState<'year' | 'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Filter settings
  const [showEvents, setShowEvents] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showFocusBlocks, setShowFocusBlocks] = useState(true);

  // Quick Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newType, setNewType] = useState<CommitmentType>('EVENT');
  const [newEstimatedDuration, setNewEstimatedDuration] = useState('60');

  // Rich scheduling features state
  const [newDescription, setNewDescription] = useState('');
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatType, setRepeatType] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [repeatDays, setRepeatDays] = useState<number[]>([]); // 0 for Sun, 1 for Mon, etc.
  const [endDateStr, setEndDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState<string | null>(null);

  // Editing state
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<CommitmentType>('EVENT');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('10:00');
  const [editEstimatedDuration, setEditEstimatedDuration] = useState('60');
  const [editIsRepeating, setEditIsRepeating] = useState(false);
  const [editRepeatType, setEditRepeatType] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [editRepeatDays, setEditRepeatDays] = useState<number[]>([]);
  const [editEndDateStr, setEditEndDateStr] = useState('');
  const [editStatus, setEditStatus] = useState<'PLANNED' | 'COMPLETED' | 'CANCELLED'>('PLANNED');
  const [editFormError, setEditFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingCommitment) {
      setEditTitle(editingCommitment.title);
      setEditDescription(editingCommitment.description || '');
      setEditType(editingCommitment.type);
      setEditStatus(editingCommitment.status as any || 'PLANNED');
      
      if (editingCommitment.startTime) {
        try {
          const startDate = new Date(editingCommitment.startTime);
          setEditDate(startDate.toISOString().split('T')[0]);
          
          const startHours = String(startDate.getHours()).padStart(2, '0');
          const startMins = String(startDate.getMinutes()).padStart(2, '0');
          setEditStartTime(`${startHours}:${startMins}`);
        } catch (e) {
          setEditDate(new Date().toISOString().split('T')[0]);
          setEditStartTime('09:00');
        }
      } else {
        setEditDate(new Date().toISOString().split('T')[0]);
        setEditStartTime('09:00');
      }

      if (editingCommitment.endTime) {
        try {
          const endDate = new Date(editingCommitment.endTime);
          const endHours = String(endDate.getHours()).padStart(2, '0');
          const endMins = String(endDate.getMinutes()).padStart(2, '0');
          setEditEndTime(`${endHours}:${endMins}`);
        } catch (e) {
          setEditEndTime('10:00');
        }
      } else {
        setEditEndTime('10:00');
      }

      setEditEstimatedDuration(String(editingCommitment.estimatedDuration || 60));
      setEditIsRepeating(editingCommitment.isRepeating || false);
      setEditRepeatType(editingCommitment.repeatType as any || 'DAILY');
      setEditRepeatDays(editingCommitment.repeatDays || []);
      setEditEndDateStr(editingCommitment.endDateStr || new Date().toISOString().split('T')[0]);
      setEditFormError(null);
    }
  }, [editingCommitment]);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommitment) return;
    setEditFormError(null);

    if (!editTitle.trim()) {
      setEditFormError('Please enter a block title');
      return;
    }

    if (!editStartTime || !editEndTime) {
      setEditFormError('Please specify start and end times');
      return;
    }

    const startISO = `${editDate}T${editStartTime}:00`;
    const startDateObj = new Date(startISO);
    
    let endISO = '';
    let calculatedDuration = parseInt(editEstimatedDuration, 10) || 60;

    const isMultiDay = editEndDateStr && editEndDateStr > editDate;

    if (isMultiDay) {
      if (editEndDateStr < editDate) {
        setEditFormError('End date cannot be before start date');
        return;
      }
      endISO = `${editEndDateStr}T${editEndTime}:00`;
      const endDateObj = new Date(endISO);
      if (endDateObj <= startDateObj) {
        setEditFormError('End date/time must be after start date/time');
        return;
      }
      calculatedDuration = Math.round((endDateObj.getTime() - startDateObj.getTime()) / 60000);
    } else {
      endISO = `${editDate}T${editEndTime}:00`;
      const endDateObj = new Date(endISO);
      if (endDateObj <= startDateObj) {
        setEditFormError('End time must be after start time');
        return;
      }
      calculatedDuration = Math.round((endDateObj.getTime() - startDateObj.getTime()) / 60000);
    }

    if (editIsRepeating) {
      if (editRepeatType === 'WEEKLY' && editRepeatDays.length === 0) {
        setEditFormError('Please select at least one day of the week for repetition');
        return;
      }
    }

    // Validate dependency dates constraint!
    const parentIds = editingCommitment.dependsOn || [];
    for (const pid of parentIds) {
      const parent = commitments.find(c => c.id === pid);
      if (parent) {
        const parentEnd = parent.endDateStr || (parent.startTime ? parent.startTime.split('T')[0] : '');
        if (parentEnd && editEndDateStr < parentEnd) {
          setEditFormError(`This task depends on "${parent.title}" (ends ${parentEnd}), so it must end on or after ${parentEnd}.`);
          return;
        }
      }
    }

    const children = commitments.filter(c => c.dependsOn?.includes(editingCommitment.id));
    for (const child of children) {
      const childEnd = child.endDateStr || (child.startTime ? child.startTime.split('T')[0] : '');
      if (childEnd && childEnd < editEndDateStr) {
        setEditFormError(`The dependent task "${child.title}" ends on ${childEnd}, so this task cannot end after ${childEnd}.`);
        return;
      }
    }

    try {
      await updateCommitment(editingCommitment.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        type: editType,
        status: editStatus,
        startTime: startISO,
        endTime: endISO,
        estimatedDuration: calculatedDuration,
        isRepeating: editIsRepeating,
        repeatType: editIsRepeating ? editRepeatType : undefined,
        repeatDays: editIsRepeating && editRepeatType === 'WEEKLY' ? editRepeatDays : undefined,
        endDateStr: editIsRepeating ? editEndDateStr : undefined,
      });
      setEditingCommitment(null);
    } catch (error: any) {
      setEditFormError(error.message || 'Failed to update commitment');
    }
  };

  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll timeline to 8am on day/week views
  useEffect(() => {
    if ((viewMode === 'day' || viewMode === 'week') && timelineScrollRef.current) {
      // 8am is 8 * 60px = 480px down
      timelineScrollRef.current.scrollTop = 420;
    }
  }, [viewMode]);

  // Auto-sync calendar when navigating to a date range without data
  useEffect(() => {
    // Determine the start and end of the current view range
    let rangeStart: Date;
    let rangeEnd: Date;

    if (viewMode === 'day') {
      rangeStart = new Date(selectedDate);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(selectedDate);
      rangeEnd.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      const days = getDaysInActiveWeek(selectedDate);
      rangeStart = new Date(days[0]);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(days[6]);
      rangeEnd.setHours(23, 59, 59, 999);
    } else if (viewMode === 'month') {
      const days = getDaysInActiveMonth(selectedDate);
      rangeStart = new Date(days[0]);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(days[41]);
      rangeEnd.setHours(23, 59, 59, 999);
    } else { // year
      rangeStart = new Date(selectedDate.getFullYear(), 0, 1, 0, 0, 0, 0);
      rangeEnd = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    const rangeStartStr = rangeStart.toISOString().split('T')[0];
    const rangeEndStr = rangeEnd.toISOString().split('T')[0];
    const rangeKey = `cal_synced_${rangeStartStr}_${rangeEndStr}`;

    // If we have already synced this exact range, do not auto-sync again
    if (localStorage.getItem(rangeKey)) {
      return;
    }

    // Check if we have any calendar commitments in this range
    const hasData = commitments.some(c => {
      if (!c.startTime) return false;
      const cStart = new Date(c.startTime);
      return cStart >= rangeStart && cStart <= rangeEnd;
    });

    if (!hasData) {
      localStorage.setItem(rangeKey, 'true');
      console.log(`No calendar data for navigated range [${rangeStartStr} to ${rangeEndStr}]. Triggering auto-sync...`);
      syncGoogleCalendar(rangeStart.toISOString(), rangeEnd.toISOString());
    }
  }, [selectedDate, viewMode, commitments]);

  // Find calendar conflicts using Business Engine
  const conflicts = BusinessEngine.detectConflicts(commitments);

  // Date navigation helpers
  const handlePrev = () => {
    const nextDate = new Date(selectedDate);
    if (viewMode === 'year') {
      nextDate.setFullYear(selectedDate.getFullYear() - 1);
    } else if (viewMode === 'month') {
      nextDate.setMonth(selectedDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(selectedDate.getDate() - 7);
    } else {
      nextDate.setDate(selectedDate.getDate() - 1);
    }
    setSelectedDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(selectedDate);
    if (viewMode === 'year') {
      nextDate.setFullYear(selectedDate.getFullYear() + 1);
    } else if (viewMode === 'month') {
      nextDate.setMonth(selectedDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(selectedDate.getDate() + 7);
    } else {
      nextDate.setDate(selectedDate.getDate() + 1);
    }
    setSelectedDate(nextDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Check if a date is the selected date
  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  // Format headers
  const getHeaderLabel = () => {
    if (viewMode === 'year') {
      return selectedDate.getFullYear().toString();
    } else if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } else if (viewMode === 'week') {
      const days = getDaysInActiveWeek(selectedDate);
      const start = days[0];
      const end = days[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getFullYear()}`;
      } else if (start.getFullYear() === end.getFullYear()) {
        return `${start.toLocaleDateString('en-US', { month: 'short' })} - ${end.toLocaleDateString('en-US', { month: 'short' })} ${start.getFullYear()}`;
      } else {
        return `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
      }
    } else {
      return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Calendar structure generation helpers
  const getDaysInActiveMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
    
    const days: Date[] = [];
    
    // Fill leading days from previous month
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLast - i));
    }
    
    // Fill current month days
    const currentMonthLast = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= currentMonthLast; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Fill trailing days for 6-row grid
    const totalSlots = 42; // 6 rows * 7 days
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const getDaysInActiveWeek = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day; // back to Sunday
    const sunday = new Date(current.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  };

  // Get commitments filtered by checklist settings
  const getFilteredCommitments = () => {
    return commitments.filter(c => {
      if (c.status === 'CANCELLED') return false;
      if (c.type === 'EVENT' || c.type === 'APPOINTMENT') return showEvents;
      if (c.type === 'TASK') return showTasks;
      if (c.type === 'FOCUS_BLOCK') return showFocusBlocks;
      return true;
    });
  };

  // Get commitments scheduled on a specific date
  const getCommitmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const targetTime = new Date(dateStr + 'T00:00:00').getTime();

    return getFilteredCommitments().filter(c => {
      if (!c.startTime) return false;
      const commStartStr = c.startTime.split('T')[0];
      const commStartTime = new Date(commStartStr + 'T00:00:00').getTime();

      // If target date is before the commitment's start date, it doesn't match
      if (targetTime < commStartTime) return false;

      // 1. Repeating events
      if (c.isRepeating) {
        if (c.endDateStr) {
          const commEndTime = new Date(c.endDateStr + 'T00:00:00').getTime();
          if (targetTime > commEndTime) return false;
        }

        if (c.repeatType === 'DAILY') {
          return true;
        }
        if (c.repeatType === 'WEEKLY') {
          const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
          return c.repeatDays?.includes(dayOfWeek) ?? false;
        }
      }

      // 2. Multi-day events (from commStartStr to c.endDateStr)
      if (c.endDateStr) {
        const commEndTime = new Date(c.endDateStr + 'T00:00:00').getTime();
        return targetTime >= commStartTime && targetTime <= commEndTime;
      }

      // 3. Regular single-day events
      return commStartStr === dateStr;
    });
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Basic validation
    if (!newTitle.trim()) {
      setFormError('Please enter a block title');
      return;
    }

    // 2. Validate times
    if (!newStartTime || !newEndTime) {
      setFormError('Please specify start and end times');
      return;
    }

    const startISO = `${newDate}T${newStartTime}:00`;
    const startDateObj = new Date(startISO);
    
    let endISO = '';
    let calculatedDuration = parseInt(newEstimatedDuration, 10) || 60;

    const isMultiDay = endDateStr && endDateStr > newDate;

    if (isMultiDay) {
      if (endDateStr < newDate) {
        setFormError('End date cannot be before start date');
        return;
      }
      endISO = `${endDateStr}T${newEndTime}:00`;
      const endDateObj = new Date(endISO);
      if (endDateObj <= startDateObj) {
        setFormError('End date/time must be after start date/time');
        return;
      }
      calculatedDuration = Math.round((endDateObj.getTime() - startDateObj.getTime()) / 60000);
    } else {
      if (newEndTime <= newStartTime) {
        setFormError('End time must be after start time');
        return;
      }
      endISO = `${newDate}T${newEndTime}:00`;
      const endDateObj = new Date(endISO);
      calculatedDuration = Math.round((endDateObj.getTime() - startDateObj.getTime()) / 60000);
    }

    // 3. Validate repetition
    if (isRepeating) {
      if (repeatType === 'WEEKLY' && repeatDays.length === 0) {
        setFormError('Please select at least one day of the week for repetition');
        return;
      }
    }

    try {
      await addCommitment({
        type: newType,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        constraint: newType === 'EVENT' ? 'FIXED' : 'FLEXIBLE',
        origin: 'USER',
        status: 'PLANNED',
        startTime: startISO,
        endTime: endISO,
        estimatedDuration: calculatedDuration,
        isRepeating,
        repeatDays: isRepeating && repeatType === 'WEEKLY' ? repeatDays : undefined,
        repeatType: isRepeating ? repeatType : 'NONE',
        isAllDay: isMultiDay,
        endDateStr: endDateStr || undefined
      });

      // Reset form on success
      setNewTitle('');
      setNewDescription('');
      setIsRepeating(false);
      setRepeatDays([]);
      setFormError(null);
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while scheduling');
    }
  };

  // Quick type-based styling helper
  const getCommitmentColors = (comm: Commitment, hasConflict: boolean) => {
    if (hasConflict) {
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-300 dark:border-red-900/50',
        text: 'text-red-800 dark:text-red-400',
        accent: 'bg-red-500'
      };
    }
    
    if (comm.status === 'COMPLETED') {
      return {
        bg: 'bg-slate-50 dark:bg-zinc-900/30 opacity-60',
        border: 'border-slate-200 dark:border-zinc-800',
        text: 'text-slate-500 line-through',
        accent: 'bg-slate-300 dark:bg-zinc-700'
      };
    }

    switch (comm.type) {
      case 'FOCUS_BLOCK':
        return {
          bg: 'bg-amber-500/5 dark:bg-amber-500/5 hover:bg-amber-500/10 dark:hover:bg-amber-500/10',
          border: 'border-amber-500/20 dark:border-amber-500/30',
          text: 'text-amber-700 dark:text-amber-400',
          accent: 'bg-amber-500'
        };
      case 'TASK':
        return {
          bg: 'bg-violet-500/5 dark:bg-violet-500/5 hover:bg-violet-500/10 dark:hover:bg-violet-500/10',
          border: 'border-violet-500/20 dark:border-violet-500/30',
          text: 'text-violet-700 dark:text-violet-400',
          accent: 'bg-violet-500'
        };
      case 'EVENT':
      case 'APPOINTMENT':
      default:
        return {
          bg: 'bg-emerald-500/5 dark:bg-emerald-500/5 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10',
          border: 'border-emerald-500/20 dark:border-emerald-500/30',
          text: 'text-emerald-800 dark:text-emerald-400',
          accent: 'bg-emerald-600 dark:bg-emerald-500'
        };
    }
  };

  const getFormatTimeRange = (startTimeStr?: string, endTimeStr?: string) => {
    if (!startTimeStr) return '';
    const st = new Date(startTimeStr);
    const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
    const startFormatted = st.toLocaleTimeString('en-US', options);
    
    if (!endTimeStr) return startFormatted;
    const et = new Date(endTimeStr);
    const endFormatted = et.toLocaleTimeString('en-US', options);
    
    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-180px)] xl:h-[calc(100vh-180px)] select-none">
      
      {/* Side Control and Mini Calendar (Google Calendar style) */}
      {showSidebar && (
        <aside className="w-full xl:w-56 flex flex-col gap-3 flex-shrink-0 animate-in fade-in slide-in-from-left duration-200">
          
          {/* Quick Create Button */}
          <button
            onClick={() => {
              setNewDate(selectedDate.toISOString().split('T')[0]);
              setShowAddModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <PlusSquare className="h-3.5 w-3.5" />
            <span>Schedule</span>
          </button>

          {/* Dynamic Interactive Mini Calendar picker */}
          <div className="bg-white dark:bg-[#0c0d0e] border border-slate-100 dark:border-zinc-900 p-2.5 rounded-xl">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-0.5">
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setMonth(selectedDate.getMonth() - 1);
                    setSelectedDate(d);
                  }}
                  className="p-1 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setMonth(selectedDate.getMonth() + 1);
                    setSelectedDate(d);
                  }}
                  className="p-1 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Mini Calendar Weekday Labels */}
            <div className="grid grid-cols-7 gap-y-1 text-center text-[9px] font-bold text-slate-400 dark:text-zinc-500 mb-1">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            {/* Mini Calendar Day Cells */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {getDaysInActiveMonth(selectedDate).map((day, idx) => {
                const isCurrMonth = day.getMonth() === selectedDate.getMonth();
                const isDayToday = isToday(day);
                const isDaySelected = isSelected(day);
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`text-[9px] font-semibold h-5.5 w-5.5 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      isDaySelected 
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold'
                        : isDayToday
                          ? 'text-emerald-500 border border-emerald-500/30 font-bold'
                          : isCurrMonth
                            ? 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            : 'text-slate-300 dark:text-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-900/30'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter / Calendars checklist (Google Calendar style) */}
          <div className="bg-white dark:bg-[#0c0d0e] border border-slate-100 dark:border-zinc-900 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-wider font-bold mb-2">
              <Sliders className="h-2.5 w-2.5" />
              <span>My Calendars</span>
            </div>

            <div className="space-y-2.5 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={showEvents}
                  onChange={() => setShowEvents(!showEvents)}
                  className="sr-only"
                />
                <div className={`h-4 w-4 rounded-md border flex items-center justify-center transition-all ${showEvents ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-zinc-700'}`}>
                  {showEvents && <Check className="h-2.5 w-2.5 stroke-[3px]" />}
                </div>
                <span className="group-hover:text-slate-900 dark:group-hover:text-white">Events</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-auto" />
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={showFocusBlocks}
                  onChange={() => setShowFocusBlocks(!showFocusBlocks)}
                  className="sr-only"
                />
                <div className={`h-4 w-4 rounded-md border flex items-center justify-center transition-all ${showFocusBlocks ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 dark:border-zinc-700'}`}>
                  {showFocusBlocks && <Check className="h-2.5 w-2.5 stroke-[3px]" />}
                </div>
                <span className="group-hover:text-slate-900 dark:group-hover:text-white">Focus Blocks</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 ml-auto" />
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={showTasks}
                  onChange={() => setShowTasks(!showTasks)}
                  className="sr-only"
                />
                <div className={`h-4 w-4 rounded-md border flex items-center justify-center transition-all ${showTasks ? 'bg-violet-500 border-violet-500 text-white' : 'border-slate-300 dark:border-zinc-700'}`}>
                  {showTasks && <Check className="h-2.5 w-2.5 stroke-[3px]" />}
                </div>
                <span className="group-hover:text-slate-900 dark:group-hover:text-white">Tasks</span>
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 ml-auto" />
              </label>
            </div>
          </div>

          {/* Conflicts Alert Block */}
          {conflicts.length > 0 && (
            <div className="bg-rose-500/[0.04] dark:bg-rose-500/[0.03] border border-rose-500/15 dark:border-rose-500/10 p-2.5 rounded-xl text-[10.5px] shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold mb-0.5">
                <AlertTriangle className="h-3 w-3 text-rose-500 dark:text-rose-400 animate-pulse shrink-0" />
                <span>Overlap Detected</span>
              </div>
              <p className="text-slate-600 dark:text-zinc-400 leading-normal font-semibold mb-2">
                Motive detected {conflicts.length} scheduling {conflicts.length === 1 ? 'conflict' : 'conflicts'}. Let AI auto-resolve or manually reschedule.
              </p>
              <button
                onClick={() => {
                  setIsAiSidebarOpen(true);
                  sendChatMessage("Motive has detected scheduling overlaps. Mo, please analyze my conflicts and propose a smart, auto-rescheduled workspace structure for today.");
                }}
                className="w-full py-1.5 px-2 bg-rose-50/80 hover:bg-rose-100/90 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 rounded-lg font-bold text-[9.5px] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-xs"
              >
                <Bot className="h-3 w-3" />
                <span>Auto-Resolve with Mo</span>
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Main Calendar Section (Exact Google Calendar styling) */}
      <div className="flex-1 bg-white dark:bg-[#0c0d0e] border border-slate-100 dark:border-zinc-900 rounded-xl overflow-hidden flex flex-col">
        
        {/* Calendar Control Toolbar */}
        <div className="border-b border-slate-100 dark:border-zinc-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-lg bg-slate-50/50 hover:bg-slate-100 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/50 border border-slate-100 dark:border-zinc-900 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all cursor-pointer flex-shrink-0"
              title={showSidebar ? "Collapse sidebar" : "Expand sidebar"}
            >
              {showSidebar ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4 animate-pulse" />
              )}
            </button>

            {/* Quick Create Button when sidebar is collapsed (Google Calendar style) */}
            {!showSidebar && (
              <button
                onClick={() => {
                  setNewDate(selectedDate.toISOString().split('T')[0]);
                  setShowAddModal(true);
                }}
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/10 transition-all cursor-pointer flex items-center justify-center hover:scale-[1.03] shadow-sm shadow-emerald-500/20 animate-in zoom-in-95 duration-150 flex-shrink-0"
                title="Schedule"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}

            {/* Nav controls */}
            <div className="flex items-center gap-1.5 bg-slate-50/70 dark:bg-zinc-900/20 border border-slate-100 dark:border-zinc-900/50 p-1 rounded-lg">
              <button
                onClick={handleToday}
                className="text-xs font-bold px-2.5 py-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 cursor-pointer"
              >
                Today
              </button>
              <div className="h-3.5 w-px bg-slate-200 dark:bg-zinc-800" />
              <button
                onClick={handlePrev}
                className="p-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 hidden md:inline-block">
              {getHeaderLabel()}
            </span>
          </div>

          <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 md:hidden block">
            {getHeaderLabel()}
          </span>

          {/* View Mode Selector Tabs */}
          <div className="flex bg-slate-100/70 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-900/50 p-1 rounded-lg">
            {(['day', 'week', 'month', 'year'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md capitalize cursor-pointer transition-all ${
                  viewMode === mode 
                    ? 'bg-neutral-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-xs' 
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 overflow-hidden">
          
          {/* MONTH VIEW */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 h-full text-left" style={{ gridAutoRows: '1fr' }}>
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <div key={i} className="border-b border-r border-slate-100 dark:border-zinc-850/80 bg-slate-50/50 dark:bg-zinc-900/10 px-3 py-2 text-center text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  {d}
                </div>
              ))}

              {/* Month calendar cells (exact Google calendar style) */}
              {getDaysInActiveMonth(selectedDate).map((day, idx) => {
                const dayComms = getCommitmentsForDate(day);
                const isCurrMonth = day.getMonth() === selectedDate.getMonth();
                const isDayToday = isToday(day);
                const isDaySelected = isSelected(day);

                return (
                  <div 
                    key={idx}
                    onClick={() => {
                      setSelectedDate(day);
                      // Switching to Day Level view upon click matches standard behavior
                      setViewMode('day');
                    }}
                    className={`border-b border-r border-slate-100 dark:border-zinc-850/80 p-2 min-h-[50px] sm:min-h-[60px] lg:min-h-[75px] flex flex-col gap-1 transition-all cursor-pointer ${
                      isDaySelected 
                        ? 'bg-emerald-500/[0.12] dark:bg-emerald-500/30 shadow-inner z-10' 
                        : 'hover:bg-slate-50/50 dark:hover:bg-zinc-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold flex items-center justify-center h-6 w-6 rounded-full transition-all ${
                        isDayToday 
                          ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                          : isDaySelected
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold scale-110 shadow-sm'
                            : isCurrMonth 
                              ? 'text-slate-700 dark:text-zinc-200 font-medium' 
                              : 'text-slate-300 dark:text-zinc-600 font-medium'
                      }`}>
                        {day.getDate()}
                      </span>
                      {dayComms.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500">
                          {dayComms.length} items
                        </span>
                      )}
                    </div>

                    {/* Simple colored badge stack */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 mt-1">
                      {dayComms.slice(0, 3).map((comm) => {
                        const hasConflict = conflicts.some(conf => conf.c1.id === comm.id || conf.c2.id === comm.id);
                        const style = getCommitmentColors(comm, hasConflict);
                        
                        return (
                          <div 
                            key={comm.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCommitment(comm);
                            }}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold tracking-tight truncate flex items-center gap-1.5 cursor-pointer hover:opacity-85 active:scale-[0.98] transition-all ${style.bg} ${style.border} ${style.text}`}
                            title={comm.title}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${style.accent} flex-shrink-0`} />
                            <span className="truncate">{comm.title}</span>
                          </div>
                        );
                      })}
                      {dayComms.length > 3 && (
                        <p 
                          className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500 text-left pl-1 cursor-help hover:text-emerald-500 transition-colors"
                          title={dayComms.slice(3).map(c => c.title).join('\n')}
                        >
                          + {dayComms.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* WEEK VIEW */}
          {viewMode === 'week' && (
            <div className="flex flex-col h-full">
              {/* Day columns header row */}
              <div className="grid grid-cols-8 border-b border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/10 select-none">
                <div className="border-r border-slate-100 dark:border-zinc-900 px-3 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                  GMT
                </div>
                {getDaysInActiveWeek(selectedDate).map((day, i) => {
                  const isDayToday = isToday(day);
                  const isDaySelected = isSelected(day);

                  return (
                    <div 
                      key={i} 
                      onClick={() => setSelectedDate(day)}
                      className={`border-r border-slate-100 dark:border-zinc-900 px-3 py-2 text-center cursor-pointer transition-all ${
                        isDaySelected 
                          ? 'bg-emerald-500/[0.12] dark:bg-emerald-500/30 z-10 shadow-xs' 
                          : 'hover:bg-slate-100/50 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${
                        isDaySelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'
                      }`}>
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className={`text-sm font-bold mt-1 inline-flex items-center justify-center h-7 w-7 rounded-full transition-all ${
                        isDayToday 
                          ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                          : isDaySelected
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold scale-110 shadow-sm'
                            : 'text-slate-800 dark:text-zinc-200'
                      }`}>
                        {day.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Scrollable hour grid */}
              <div 
                ref={timelineScrollRef}
                className="flex-1 overflow-y-auto h-[500px] xl:h-[calc(100vh-310px)]"
              >
                <div className="grid grid-cols-8 relative select-none" style={{ height: '1440px' }}>
                  
                  {/* Left Column labels */}
                  <div className="border-r border-slate-100 dark:border-zinc-900/60 flex flex-col h-full bg-slate-50/10 dark:bg-zinc-950/10">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div 
                        key={hour} 
                        className="h-[60px] border-b border-slate-50 dark:border-zinc-900/30 pr-2 text-right text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-start justify-end pt-1"
                      >
                        {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                    ))}
                  </div>

                  {/* 7 Columns for the week's days */}
                  {getDaysInActiveWeek(selectedDate).map((day, colIdx) => {
                    const dayComms = getCommitmentsForDate(day);

                    return (
                      <div 
                        key={colIdx} 
                        className="border-r border-slate-100 dark:border-zinc-900/40 relative h-full bg-slate-50/5 dark:bg-[#0c0d0e]"
                      >
                        {/* Hour horizontal dividers inside day column */}
                        {Array.from({ length: 24 }).map((_, hour) => (
                          <div 
                            key={hour} 
                            className="h-[60px] border-b border-slate-50 dark:border-zinc-900/30 w-full"
                          />
                        ))}

                        {/* Absolute positioned block badges */}
                        {getPositionedCommitments(dayComms, 0, 1.5).map(({ commitment: comm, top, height, left, width }) => {
                          const hasConflict = conflicts.some(conf => conf.c1.id === comm.id || conf.c2.id === comm.id);
                          const style = getCommitmentColors(comm, hasConflict);
                          const start = new Date(comm.startTime!);

                          return (
                            <div
                              key={comm.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCommitment(comm);
                              }}
                              style={{ top: `${top}px`, height: `${height}px`, left, width }}
                              title={comm.title}
                              className={`absolute p-1 rounded-lg border text-[10px] font-bold tracking-tight cursor-pointer overflow-hidden transition-all hover:z-20 flex flex-col justify-between ${style.bg} ${style.border} ${style.text}`}
                            >
                              <div className="flex items-start justify-between">
                                <span className="truncate leading-tight">{comm.title}</span>
                              </div>
                              <span className="text-[9.5px] font-mono opacity-80 mt-1 leading-none">
                                {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>
          )}

          {/* DAY TIMELINE VIEW (PROPER 24H TIMELINE LEVEL) */}
          {viewMode === 'day' && (
            <div className="flex flex-col h-full">
              {/* Day column header */}
              <div className="border-b border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/10 px-6 py-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {isToday(selectedDate) && (
                      <span className="bg-emerald-50 border border-emerald-200/60 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 font-bold px-2 py-0.5 rounded text-[9.5px] uppercase font-mono tracking-wider">
                        Today
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold tracking-wide font-mono mt-0.5 uppercase">
                    Daily Schedule Blocks
                  </p>
                </div>

                <span className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-850 px-3 py-1.5 rounded-xl">
                  {getCommitmentsForDate(selectedDate).length} SCHEDULED BLOCKS
                </span>
              </div>

              {/* Scrollable Timeline Grid */}
              <div 
                ref={timelineScrollRef}
                className="flex-1 overflow-y-auto h-[500px] xl:h-[calc(100vh-310px)]"
              >
                <div className="grid grid-cols-12 relative select-none" style={{ height: '1440px' }}>
                  
                  {/* Left Column hour labels (cols 1-2) */}
                  <div className="col-span-2 border-r border-slate-100 dark:border-zinc-900/60 flex flex-col h-full bg-slate-50/10 dark:bg-zinc-950/10">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div 
                        key={hour} 
                        className="h-[60px] border-b border-slate-50 dark:border-zinc-900/30 pr-3 text-right text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-start justify-end pt-1"
                      >
                        {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                    ))}
                  </div>

                  {/* Right Column Timeline Content (cols 3-12) */}
                  <div className="col-span-10 relative h-full bg-slate-50/5 dark:bg-[#0c0d0e]">
                    
                    {/* Horizontal lines */}
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div 
                        key={hour} 
                        className="h-[60px] border-b border-slate-50 dark:border-zinc-900/30 w-full"
                      />
                    ))}

                    {/* Timeline Commitment Cards (Proper Absolute position matching hours) */}
                    {getPositionedCommitments(getCommitmentsForDate(selectedDate), 0, 12).map(({ commitment: comm, top, height, left, width }) => {
                      const hasConflict = conflicts.some(conf => conf.c1.id === comm.id || conf.c2.id === comm.id);
                      const style = getCommitmentColors(comm, hasConflict);

                      const duration = comm.estimatedDuration;
                      const isFB = comm.type === 'FOCUS_BLOCK';
                      const isShort = duration < 75;

                      return (
                        <div
                          key={comm.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCommitment(comm);
                          }}
                          style={{ top: `${top}px`, height: `${height}px`, left, width }}
                          className={`absolute rounded-lg border text-left flex flex-col justify-between overflow-hidden transition-all hover:z-20 cursor-pointer hover:brightness-[0.98] active:scale-[0.99] ${
                            isShort ? 'px-2.5 py-1.5' : 'p-3'
                          } ${style.bg} ${style.border} ${style.text}`}
                        >
                          {isShort ? (
                            <div className="flex items-start justify-between gap-2 h-full">
                              <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                                <h3 className={`text-xs font-bold tracking-tight leading-snug truncate ${comm.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>
                                  {comm.title}
                                </h3>
                                <span className="flex items-center gap-1 text-[9.5px] font-mono font-bold tracking-wider opacity-80 leading-none">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{getFormatTimeRange(comm.startTime, comm.endTime)}</span>
                                  <span className="opacity-60 shrink-0">({comm.estimatedDuration}m)</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {/* Action: Complete */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCommitmentComplete(comm.id);
                                  }}
                                  className={`group/checkbox flex items-center justify-center h-4.5 w-4.5 border transition-all duration-200 cursor-pointer ${
                                    comm.status === 'COMPLETED'
                                      ? 'rounded-full bg-emerald-500 border-emerald-500 text-white'
                                      : 'rounded-md hover:rounded-full border-neutral-400 dark:border-zinc-500 text-transparent hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10'
                                  }`}
                                  title="Mark Complete"
                                >
                                  {comm.status === 'COMPLETED' ? (
                                    <Check className="h-2.5 w-2.5 stroke-[3.5px]" />
                                  ) : (
                                    <Check className="h-2.5 w-2.5 text-emerald-500 dark:text-emerald-400 opacity-0 group-hover/checkbox:opacity-100 transition-opacity duration-150 stroke-[3px]" />
                                  )}
                                </button>

                                {/* Action: Delete */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCommitment(comm.id);
                                  }}
                                  className="flex items-center justify-center h-4.5 w-4.5 rounded-md border border-neutral-400 dark:border-zinc-500 text-slate-400 hover:text-red-500 hover:border-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10 cursor-pointer transition-all duration-200"
                                  title="Delete Block"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col justify-between h-full">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                    <span className={`h-1.5 w-1.5 rounded-full ${style.accent}`} />
                                    <span className="font-mono text-[8px] font-bold tracking-wider uppercase opacity-80">
                                      {comm.type}
                                    </span>
                                    {isFB && (
                                      <span className="flex items-center gap-0.5 text-amber-500 text-[8px] font-bold uppercase font-mono tracking-wider bg-amber-500/10 px-1 py-0.5 rounded">
                                        <Brain className="h-2.5 w-2.5" />
                                        AI Suggested
                                      </span>
                                    )}
                                    {hasConflict && (
                                      <span className="flex items-center gap-0.5 text-red-500 text-[8px] font-bold uppercase font-mono tracking-wider bg-red-500/10 px-1 py-0.5 rounded">
                                        <AlertTriangle className="h-2.5 w-2.5" />
                                        CONFLICT
                                      </span>
                                    )}
                                  </div>
                                  <h3 className={`text-xs font-bold tracking-tight leading-snug line-clamp-2 ${comm.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>
                                    {comm.title}
                                  </h3>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Action: Complete */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCommitmentComplete(comm.id);
                                    }}
                                    className={`group/checkbox flex items-center justify-center h-5 w-5 border transition-all duration-200 cursor-pointer ${
                                      comm.status === 'COMPLETED'
                                        ? 'rounded-full bg-emerald-500 border-emerald-500 text-white dark:bg-emerald-500 dark:border-emerald-500'
                                        : 'rounded-md hover:rounded-full border-neutral-400 dark:border-zinc-500 text-transparent hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10'
                                    }`}
                                    title="Mark Complete"
                                  >
                                    {comm.status === 'COMPLETED' ? (
                                      <Check className="h-3 w-3 stroke-[3px]" />
                                    ) : (
                                      <Check className="h-3 w-3 text-emerald-500/60 dark:text-emerald-400/60 opacity-0 group-hover/checkbox:opacity-100 transition-opacity duration-150 stroke-[2.5px]" />
                                    )}
                                  </button>

                                  {/* Action: Delete */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteCommitment(comm.id);
                                    }}
                                    className="flex items-center justify-center h-5 w-5 rounded-md border border-neutral-400 dark:border-zinc-500 text-slate-400 hover:text-red-500 hover:border-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10 cursor-pointer transition-all duration-200"
                                    title="Delete Block"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-wider opacity-80 mt-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {getFormatTimeRange(comm.startTime, comm.endTime)}
                                </span>
                                <span>{comm.estimatedDuration} MINS</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {getCommitmentsForDate(selectedDate).length === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-zinc-700 pointer-events-none">
                        <Layers className="h-10 w-10 opacity-30 mb-2.5" />
                        <span className="text-xs font-mono font-bold tracking-widest uppercase">
                          No timeline entries allocated
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-1">
                          Click "Schedule Block" to design your roadmap
                        </span>
                      </div>
                    )}

                  </div>

                </div>
              </div>
            </div>
          )}

          {/* YEAR VIEW */}
          {viewMode === 'year' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 h-full overflow-y-auto max-h-[calc(100vh-180px)] bg-slate-50/10 dark:bg-zinc-950/5">
              {Array.from({ length: 12 }).map((_, monthIdx) => {
                const year = selectedDate.getFullYear();
                const monthName = new Date(year, monthIdx, 1).toLocaleDateString('en-US', { month: 'long' });
                
                // Generates dates for this month
                const firstDay = new Date(year, monthIdx, 1);
                const startDayOfWeek = firstDay.getDay();
                const days: (Date | null)[] = [];
                
                // Fill leading empty days
                for (let i = 0; i < startDayOfWeek; i++) {
                  days.push(null);
                }
                
                const lastDay = new Date(year, monthIdx + 1, 0).getDate();
                for (let i = 1; i <= lastDay; i++) {
                  days.push(new Date(year, monthIdx, i));
                }

                return (
                  <div key={monthIdx} className="bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 p-3 rounded-xl flex flex-col text-left">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 mb-2 px-1">
                      {monthName}
                    </h3>
                    
                    <div className="grid grid-cols-7 gap-y-0.5 text-center text-[8px] font-bold text-slate-400 dark:text-zinc-500 mb-1">
                      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-y-1 text-center">
                      {days.map((day, idx) => {
                        if (!day) return <div key={idx} className="h-5.5 w-5.5" />;
                        
                        const isDayToday = isToday(day);
                        const hasComms = getCommitmentsForDate(day).length > 0;
                        
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(day);
                              setViewMode('day');
                            }}
                            className={`text-[9px] font-semibold h-5.5 w-5.5 mx-auto rounded-full flex flex-col items-center justify-center relative cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all ${
                              isDayToday 
                                ? 'bg-emerald-500 text-white font-bold' 
                                : 'text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            <span>{day.getDate()}</span>
                            {hasComms && !isDayToday && (
                              <span className="absolute bottom-0.5 h-0.75 w-0.75 rounded-full bg-emerald-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* QUICK ADD COMMITMENT MODAL (Exact Google Calendar Popup) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#0c0d0e] border border-slate-100 dark:border-zinc-800 w-full max-w-lg md:max-w-xl rounded-xl overflow-hidden shadow-lg animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Schedule Commitment Block
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleQuickAdd} className="p-5 space-y-4 text-left">
              
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}

              {/* Block Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Block Title
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Scan Schengen Visa docs"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
              </div>

              {/* Description field (Optional) */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Description <span className="text-[9px] text-slate-400/85 dark:text-zinc-500/85 lowercase italic font-semibold">(optional)</span>
                </label>
                <textarea 
                  placeholder="Add notes, links, location, or checklist items..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 resize-none"
                />
              </div>

              {/* Start Date and End Date Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Start Date
                  </label>
                  <CustomDatePicker
                    value={newDate}
                    onChange={(val) => {
                      const oldDate = newDate;
                      setNewDate(val);
                      if (endDateStr === oldDate || endDateStr < val) {
                        setEndDateStr(val);
                      }
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    End Date
                  </label>
                  <CustomDatePicker
                    value={endDateStr}
                    onChange={(val) => setEndDateStr(val)}
                  />
                </div>
              </div>

              {/* Block Type and Estimated Mins */}
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Block Type
                  </label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CommitmentType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="EVENT">Event (Fixed time)</option>
                    <option value="TASK">Task (Flexible duration)</option>
                    <option value="FOCUS_BLOCK">AI Focus Block</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Est. Mins
                  </label>
                  <input 
                    type="number"
                    required
                    min="5"
                    max="1440"
                    value={newEstimatedDuration}
                    onChange={(e) => setNewEstimatedDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Start Time and End Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Start Time
                  </label>
                  <CustomTimePicker
                    value={newStartTime}
                    onChange={(val) => setNewStartTime(val)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    End Time
                  </label>
                  <CustomTimePicker
                    value={newEndTime}
                    onChange={(val) => setNewEndTime(val)}
                  />
                </div>
              </div>

              {/* Repetition Option */}
              <div className="flex items-center justify-between py-2.5 border-y border-slate-50 dark:border-zinc-900/60 my-1">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Repeat commitment
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                    For repeating routines (gym, syncs) scheduled weekly or daily
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextIsRepeating = !isRepeating;
                    setIsRepeating(nextIsRepeating);
                    // If repeating is toggled on, and endDateStr is same as newDate, default to 30 days out for user convenience
                    if (nextIsRepeating && endDateStr === newDate) {
                      const nextMonth = new Date(new Date(newDate).getTime() + 30 * 24 * 60 * 60 * 1000);
                      setEndDateStr(nextMonth.toISOString().split('T')[0]);
                    }
                  }}
                  className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isRepeating ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isRepeating ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Repetition Settings */}
              {isRepeating && (
                <div className="space-y-3 p-3 bg-slate-50/50 dark:bg-zinc-900/25 border border-slate-100/50 dark:border-zinc-900/40 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  
                  {/* Repeat Frequency */}
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      Repeat Frequency
                    </label>
                    <div className="flex bg-slate-100 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-900 p-0.5 rounded-md">
                      {(['DAILY', 'WEEKLY'] as const).map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setRepeatType(freq)}
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm capitalize transition-all ${
                            repeatType === freq 
                              ? 'bg-neutral-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold' 
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
                          }`}
                        >
                          {freq.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weekdays picker */}
                  {repeatType === 'WEEKLY' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                        Select Days of Week (Repeating weekly on)
                      </label>
                      <div className="flex items-center justify-between px-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, index) => {
                          const isSelected = repeatDays.includes(index);
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                if (isSelected) {
                                  setRepeatDays(repeatDays.filter(d => d !== index));
                                } else {
                                  setRepeatDays([...repeatDays, index]);
                                }
                              }}
                              className={`w-7.5 h-7.5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-emerald-600 text-white shadow-xs' 
                                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800'
                              }`}
                            >
                              {dayChar}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-50 dark:border-zinc-900 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 bg-slate-50 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Schedule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT/VIEW COMMITMENT MODAL */}
      {editingCommitment && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#0c0d0e] border border-slate-100 dark:border-zinc-800 w-full max-w-lg md:max-w-xl rounded-xl overflow-hidden shadow-lg animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Edit & View Task
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {/* Trash/Delete Action */}
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this block?")) {
                      await deleteCommitment(editingCommitment.id);
                      setEditingCommitment(null);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                  title="Delete Block"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCommitment(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSave} className="p-5 space-y-4 text-left">
              
              {editFormError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
                  {editFormError}
                </div>
              )}

              {/* Block Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Block Title
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Scan Schengen Visa docs"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
              </div>

              {/* Description field (Optional) */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Description <span className="text-[9px] text-slate-400/85 dark:text-zinc-500/85 lowercase italic font-semibold">(optional)</span>
                </label>
                <textarea 
                  placeholder="Add notes, links, location, or checklist items..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 resize-none"
                />
              </div>

              {/* Block Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Block Type
                  </label>
                  <select 
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as CommitmentType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="EVENT">Event (Fixed time)</option>
                    <option value="TASK">Task (Flexible duration)</option>
                    <option value="FOCUS_BLOCK">AI Focus Block</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Status
                  </label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Start Date and End Date Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Start Date
                  </label>
                  <CustomDatePicker
                    value={editDate}
                    onChange={(val) => {
                      const oldDate = editDate;
                      setEditDate(val);
                      if (editEndDateStr === oldDate || editEndDateStr < val) {
                        setEditEndDateStr(val);
                      }
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    End Date
                  </label>
                  <CustomDatePicker
                    value={editEndDateStr}
                    onChange={(val) => setEditEndDateStr(val)}
                  />
                </div>
              </div>

              {/* Start Time, End Time, Est Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Start Time
                  </label>
                  <CustomTimePicker
                    value={editStartTime}
                    onChange={(val) => setEditStartTime(val)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    End Time
                  </label>
                  <CustomTimePicker
                    value={editEndTime}
                    onChange={(val) => setEditEndTime(val)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Est. Duration
                  </label>
                  <input 
                    type="number"
                    required
                    min="5"
                    max="1440"
                    value={editEstimatedDuration}
                    onChange={(e) => setEditEstimatedDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Repeating Setup (Compact and clean) */}
              <div className="pt-2 border-t border-slate-50 dark:border-zinc-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                    Repeat Regularly
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editIsRepeating}
                      onChange={(e) => setEditIsRepeating(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-100 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-zinc-700 peer-checked:bg-emerald-600" />
                  </label>
                </div>

                {editIsRepeating && (
                  <div className="p-3 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 rounded-lg space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">Frequency</span>
                      <div className="flex gap-2">
                        {(['DAILY', 'WEEKLY'] as const).map((freq) => (
                          <button
                            key={freq}
                            type="button"
                            onClick={() => setEditRepeatType(freq)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                              editRepeatType === freq
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-white dark:bg-zinc-900 text-slate-500 border-slate-200 dark:border-zinc-800 hover:bg-slate-50'
                            }`}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>

                    {editRepeatType === 'WEEKLY' && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">Select Repeat Days</span>
                        <div className="flex justify-between gap-1 pt-1">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, i) => {
                            const isSelected = editRepeatDays.includes(i);
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSelected) {
                                    setEditRepeatDays(editRepeatDays.filter(d => d !== i));
                                  } else {
                                    setEditRepeatDays([...editRepeatDays, i].sort());
                                  }
                                }}
                                className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-zinc-800'
                                }`}
                              >
                                {dayChar}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-50 dark:border-zinc-900 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditFormError(null);
                    setEditingCommitment(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 bg-slate-50 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editTitle.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CalendarSection;
