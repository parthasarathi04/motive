import React, { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, 
  Plus, 
  Trash2, 
  X, 
  CheckSquare, 
  Square, 
  Clock, 
  Sparkles, 
  PlusCircle, 
  ChevronDown, 
  AlertCircle, 
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  Lock,
  Pencil,
  Folder,
  Target,
  Trophy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMotive } from '../contexts/MotiveContext';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomTimePicker } from './CustomTimePicker';
import { Commitment, CommitmentType, CommitmentConstraint, CommitmentStatus } from '../types';

interface DependencyGraphProps {
  goalId?: string; // If existing goal
  onClose: () => void;
  // For new goal flow
  isNewGoalFlow?: boolean;
  initialCommitments?: Commitment[];
  onSaveNewGoalCommitments?: (commitments: Commitment[]) => void;
}

const EMPTY_COMMITMENTS: Commitment[] = [];

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  goalId,
  onClose,
  isNewGoalFlow = false,
  initialCommitments = EMPTY_COMMITMENTS,
  onSaveNewGoalCommitments
}) => {
  const { 
    commitments: globalCommitments, 
    relationships, 
    addCommitment, 
    updateCommitment, 
    deleteCommitment,
    goals,
    updateGoal,
    addGoal
  } = useMotive();

  // Selected goal details if existing
  const currentGoal = goalId ? goals.find(g => g.id === goalId) : null;

  // Goal Info editing states
  const [goalTitle, setGoalTitle] = useState(currentGoal ? currentGoal.title : '');
  const [goalDesc, setGoalDesc] = useState(currentGoal ? (currentGoal.description || '') : '');
  const [goalArea, setGoalArea] = useState(currentGoal ? currentGoal.area : 'Career');
  const [goalDeadline, setGoalDeadline] = useState(() => {
    if (currentGoal) return currentGoal.deadline;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (currentGoal) {
      setGoalTitle(currentGoal.title);
      setGoalDesc(currentGoal.description || '');
      setGoalArea(currentGoal.area);
      setGoalDeadline(currentGoal.deadline);
    } else if (isNewGoalFlow) {
      setGoalTitle('New Directional Goal');
      setGoalDesc('Describe what success looks like...');
      setGoalArea('Career');
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setGoalDeadline(d.toISOString().split('T')[0]);
    }
  }, [currentGoal, isNewGoalFlow]);

  const handleFieldUpdate = async (fields: { title?: string; description?: string; area?: string; deadline?: string }) => {
    if (isNewGoalFlow || !goalId) return; // Only auto-save existing goals

    if (fields.title !== undefined) {
      const trimmedTitle = fields.title.trim();
      if (!trimmedTitle) {
        triggerAlert("Invalid Title", "The Goal Title cannot be empty.", "warning");
        return;
      }
      if (trimmedTitle.length < 3) {
        triggerAlert("Title Too Short", "The Goal Title must be at least 3 characters long.", "warning");
        return;
      }
      // Check if duplicate goal title exists among other goals
      const duplicateExists = goals.some(g => g.id !== goalId && g.title.trim().toLowerCase() === trimmedTitle.toLowerCase());
      if (duplicateExists) {
        triggerAlert("Duplicate Goal Title", "A Goal with this title already exists. Goal titles must be unique.", "warning");
        return;
      }
    }

    if (fields.description !== undefined) {
      if (!fields.description.trim()) {
        triggerAlert("Invalid Description", "The Goal description cannot be empty.", "warning");
        return;
      }
    }

    if (fields.deadline !== undefined) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (fields.deadline < todayStr) {
        triggerAlert("Invalid Deadline", "The target deadline cannot be in the past!", "warning");
        return;
      }
    }

    try {
      await updateGoal(goalId, fields);
    } catch (e) {
      console.error("Auto-update failed:", e);
    }
  };

  const handleSaveWorkspace = async () => {
    if (isNewGoalFlow) {
      const trimmedTitle = goalTitle.trim();
      if (!trimmedTitle) {
        triggerAlert("Missing Goal Title", "Please enter a Goal Title in the header first!", "warning");
        return;
      }
      if (trimmedTitle.length < 3) {
        triggerAlert("Title Too Short", "The Goal Title must be at least 3 characters long.", "warning");
        return;
      }
      // Check if duplicate goal title exists among all goals
      const duplicateExists = goals.some(g => g.title.trim().toLowerCase() === trimmedTitle.toLowerCase());
      if (duplicateExists) {
        triggerAlert("Duplicate Goal Title", "A Goal with this title already exists. Goal titles must be unique.", "warning");
        return;
      }
      if (!goalDesc.trim()) {
        triggerAlert("Missing Description", "Please enter a Goal Description to describe what success looks like.", "warning");
        return;
      }
      const todayStr = new Date().toISOString().split('T')[0];
      if (goalDeadline < todayStr) {
        triggerAlert("Invalid Deadline", "The target deadline cannot be in the past!", "warning");
        return;
      }
      try {
        await addGoal(trimmedTitle, goalDesc.trim(), goalDeadline, goalArea, localCommitments);
        onClose();
      } catch (err) {
        console.error("Failed to create new goal from canvas:", err);
        triggerAlert("Error Saving Goal", "An error occurred while creating the goal.", "error");
      }
    } else {
      onClose();
    }
  };

  // Local state for commitments in the graph (highly relevant for both flows, but crucial for new goal creation)
  const [localCommitments, setLocalCommitments] = useState<Commitment[]>([]);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string>("Circular Path Intercepted");
  const [errorSeverity, setErrorSeverity] = useState<'error' | 'warning' | 'info'>('error');

  const triggerAlert = (title: string, message: string, severity: 'error' | 'warning' | 'info' = 'error') => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorSeverity(severity);
  };
  const [activeDropdownCommId, setActiveDropdownCommId] = useState<string | null>(null);
  const [deleteConfirmNodeId, setDeleteConfirmNodeId] = useState<string | null>(null);

  // Auto-dismiss errors after a timeout
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Handle clicking outside to close any active dropdowns
  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveDropdownCommId(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  // Lock body scrolling when the workspace popup is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // New commitment form states
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<CommitmentType>('TASK');
  const [newConstraint, setNewConstraint] = useState<CommitmentConstraint>('FLEXIBLE');
  const [newDuration, setNewDuration] = useState(30);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newEndDateStr, setNewEndDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');

  // Edit commitment form states
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<CommitmentType>('TASK');
  const [editConstraint, setEditConstraint] = useState<CommitmentConstraint>('FLEXIBLE');
  const [editDuration, setEditDuration] = useState(30);
  const [editStatus, setEditStatus] = useState<CommitmentStatus>('PLANNED');
  const [editDate, setEditDate] = useState('');
  const [editEndDateStr, setEditEndDateStr] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('10:00');

  // Connection tracking states
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [, setRepaintCount] = useState(0);

  // 1a. Resolve commitments for new goal flow
  useEffect(() => {
    if (isNewGoalFlow) {
      setLocalCommitments(initialCommitments);
    }
  }, [isNewGoalFlow, initialCommitments]);

  // 1b. Resolve commitments for existing goal flow
  useEffect(() => {
    if (!isNewGoalFlow && goalId) {
      const linkedCommitmentIds = relationships
        .filter(r => r.goalId === goalId)
        .map(r => r.commitmentId);
      const matched = globalCommitments.filter(c => linkedCommitmentIds.includes(c.id));
      setLocalCommitments(matched);
    }
  }, [isNewGoalFlow, goalId, globalCommitments, relationships]);

  // Handle repaint on sizing changes or scroll to update SVG paths
  useEffect(() => {
    const handleResize = () => setRepaintCount(prev => prev + 1);
    window.addEventListener('resize', handleResize);
    
    let observer: ResizeObserver | null = null;
    if (canvasRef.current) {
      observer = new ResizeObserver(() => {
        setRepaintCount(prev => prev + 1);
      });
      observer.observe(canvasRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  // Recalculate anytime adding/removing elements, editing states, or loading states change
  useEffect(() => {
    // We trigger repaints at multiple intervals to capture the layout as cards animate/move columns
    const delays = [50, 150, 300, 450, 600, 800];
    const timers = delays.map(delay => 
      setTimeout(() => {
        setRepaintCount(prev => prev + 1);
      }, delay)
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [localCommitments, isAddingNode, editingCommitment, activeDropdownCommId, deleteConfirmNodeId]);

  // 2. Depth/Layer calculation algorithm
  const getLevel = (id: string, currentPath = new Set<string>()): number => {
    if (currentPath.has(id)) return 0; // Prevent circular reference stack overflows
    
    const comm = localCommitments.find(x => x.id === id);
    if (!comm || !comm.dependsOn || comm.dependsOn.length === 0) return 0;
    
    const nextPath = new Set(currentPath);
    nextPath.add(id);

    let maxParentLevel = -1;
    for (const parentId of comm.dependsOn) {
      // Ensure the parent exists in our local group before recursing
      if (localCommitments.some(x => x.id === parentId)) {
        maxParentLevel = Math.max(maxParentLevel, getLevel(parentId, nextPath));
      }
    }
    return maxParentLevel + 1;
  };

  // Helper to check if childId transitively depends on parentId
  const isTransitivelyDependent = (childId: string, parentId: string, visited = new Set<string>()): boolean => {
    if (visited.has(childId)) return false;
    visited.add(childId);

    const child = localCommitments.find(x => x.id === childId);
    if (!child || !child.dependsOn) return false;

    for (const depId of child.dependsOn) {
      if (depId === parentId) return true;
      if (isTransitivelyDependent(depId, parentId, visited)) return true;
    }
    return false;
  };

  // Get simplified (transitively reduced) dependencies for a node
  const getSimplifiedDependencies = (commId: string): string[] => {
    const comm = localCommitments.find(x => x.id === commId);
    if (!comm || !comm.dependsOn || comm.dependsOn.length === 0) return [];

    return comm.dependsOn.filter(parentId => {
      const isRedundant = comm.dependsOn!.some(otherParentId => {
        if (otherParentId === parentId) return false;
        return isTransitivelyDependent(otherParentId, parentId, new Set<string>());
      });
      return !isRedundant;
    });
  };

  // Check if a dependent/child commitment ends before any of its parent tasks, or if any child ends before it
  const checkDependencyDatesConstraint = (
    commId: string, 
    newEndDate: string, 
    allCommitments: Commitment[]
  ): { isValid: boolean; message?: string } => {
    const comm = allCommitments.find(c => c.id === commId);
    if (!comm) return { isValid: true };

    const parentIds = comm.dependsOn || [];
    
    // Check parents
    for (const pid of parentIds) {
      const parent = allCommitments.find(c => c.id === pid);
      if (parent) {
        const parentEnd = parent.endDateStr || (parent.startTime ? parent.startTime.split('T')[0] : '');
        if (parentEnd && newEndDate < parentEnd) {
          return {
            isValid: false,
            message: `This task depends on "${parent.title}" (ends ${parentEnd}), so it must end on or after ${parentEnd}.`
          };
        }
      }
    }

    // Check children (dependents)
    const children = allCommitments.filter(c => c.dependsOn?.includes(commId));
    for (const child of children) {
      const childEnd = child.endDateStr || (child.startTime ? child.startTime.split('T')[0] : '');
      if (childEnd && childEnd < newEndDate) {
        return {
          isValid: false,
          message: `The dependent task "${child.title}" ends on ${childEnd}, so this task cannot end after ${childEnd}.`
        };
      }
    }

    return { isValid: true };
  };

  // Helper to robustly parse various date formats (strings, Firestore Timestamps, Date objects, etc.)
  const parseDate = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'string') {
      const d = Date.parse(val);
      return isNaN(d) ? 0 : d;
    }
    if (val instanceof Date) {
      return val.getTime();
    }
    if (typeof val === 'object') {
      if (typeof val.seconds === 'number') {
        return val.seconds * 1000;
      }
      if (typeof val._seconds === 'number') {
        return val._seconds * 1000;
      }
      if (typeof val.toDate === 'function') {
        return val.toDate().getTime();
      }
    }
    return 0;
  };

  // Group commitments into columns/tiers based on computed layer level
  const columns: { [key: number]: Commitment[] } = {};
  localCommitments.forEach(comm => {
    const level = getLevel(comm.id);
    if (!columns[level]) {
      columns[level] = [];
    }
    columns[level].push(comm);
  });

  // Sort nodes in each column/level by createdAt ascending so newer nodes appear at the bottom
  Object.keys(columns).forEach(levelKey => {
    const level = Number(levelKey);
    columns[level].sort((a, b) => {
      const dateA = parseDate(a.createdAt);
      const dateB = parseDate(b.createdAt);
      return dateA - dateB;
    });
  });

  const levels = Object.keys(columns).map(Number).sort((a, b) => a - b);

  // 3. Operations
  const handleAddCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      triggerAlert("Invalid Task Title", "The Task Title cannot be empty.", "warning");
      return;
    }
    if (newTitle.trim().length < 3) {
      triggerAlert("Task Title Too Short", "The Task Title must be at least 3 characters long.", "warning");
      return;
    }

    const startISO = `${newDate}T${newStartTime}:00`;
    const startDateObj = new Date(startISO);
    const endISO = `${newEndDateStr}T${newEndTime}:00`;
    const endDateObj = new Date(endISO);

    if (endDateObj <= startDateObj) {
      triggerAlert("Invalid Dates/Times", "End date/time must be after start date/time.", "warning");
      return;
    }

    const calculatedDuration = Math.round((endDateObj.getTime() - startDateObj.getTime()) / 60000);

    if (isNewGoalFlow) {
      // Simply add to local state
      const tempId = `temp-${Date.now()}`;
      const freshComm: Commitment = {
        id: tempId,
        userId: 'temp_user',
        title: newTitle.trim(),
        type: newType,
        constraint: newConstraint,
        origin: 'USER',
        status: 'PLANNED',
        startTime: startISO,
        endTime: endISO,
        endDateStr: newEndDateStr,
        estimatedDuration: calculatedDuration,
        dependsOn: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [...localCommitments, freshComm];
      setLocalCommitments(updated);
      onSaveNewGoalCommitments?.(updated);
    } else if (goalId) {
      // Add to global repository via context
      await addCommitment({
        type: newType,
        title: newTitle.trim(),
        constraint: newConstraint,
        origin: 'USER',
        status: 'PLANNED',
        startTime: startISO,
        endTime: endISO,
        endDateStr: newEndDateStr,
        estimatedDuration: calculatedDuration,
        dependsOn: []
      }, goalId);
    }

    // Reset fields
    setNewTitle('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewEndDateStr(new Date().toISOString().split('T')[0]);
    setNewStartTime('09:00');
    setNewEndTime('10:00');
    setNewDuration(30);
    setIsAddingNode(false);
  };

  const handleSaveEditCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommitment) return;
    if (!editTitle.trim()) {
      triggerAlert("Invalid Task Title", "The Task Title cannot be empty.", "warning");
      return;
    }
    if (editTitle.trim().length < 3) {
      triggerAlert("Task Title Too Short", "The Task Title must be at least 3 characters long.", "warning");
      return;
    }

    const startISO = `${editDate}T${editStartTime}:00`;
    const startDateObj = new Date(startISO);
    const endISO = `${editEndDateStr}T${editEndTime}:00`;
    const endDateObj = new Date(endISO);

    if (endDateObj <= startDateObj) {
      triggerAlert("Invalid Dates/Times", "End date/time must be after start date/time.", "warning");
      return;
    }

    const calculatedDuration = Math.round((endDateObj.getTime() - startDateObj.getTime()) / 60000);

    // Validate dependency dates constraint!
    const validation = checkDependencyDatesConstraint(
      editingCommitment.id,
      editEndDateStr,
      localCommitments
    );

    if (!validation.isValid) {
      triggerAlert("Date Range Invalidation", validation.message || "", "warning");
      return;
    }

    // Check if user is completing a task that has uncompleted prerequisites
    if (editStatus === 'COMPLETED' && editingCommitment.status !== 'COMPLETED') {
      const parentIds = editingCommitment.dependsOn || [];
      const uncompletedPrereqs = parentIds
        .map(pid => localCommitments.find(c => c.id === pid))
        .filter(c => c && c.status !== 'COMPLETED');
        
      if (uncompletedPrereqs.length > 0) {
        const titles = uncompletedPrereqs.map(c => `"${c?.title}"`).join(', ');
        triggerAlert(
          "Prerequisite Blocked",
          `Please complete outstanding prerequisite task(s) first: ${titles}`,
          "warning"
        );
        return;
      }
    }

    const updatedFields: Partial<Commitment> = {
      title: editTitle.trim(),
      type: editType,
      constraint: editConstraint,
      estimatedDuration: calculatedDuration,
      status: editStatus,
      startTime: startISO,
      endTime: endISO,
      endDateStr: editEndDateStr,
      updatedAt: new Date().toISOString()
    };

    const updatedList = localCommitments.map(c => 
      c.id === editingCommitment.id ? { ...c, ...updatedFields } : c
    );

    // Trigger resets on dependent tasks if we are demoting from COMPLETED
    if (editStatus !== 'COMPLETED' && editingCommitment.status === 'COMPLETED') {
      const dependents = getTransitiveDependents(editingCommitment.id, localCommitments);
      const dependentNodes = localCommitments.filter(c => dependents.has(c.id) && c.status === 'COMPLETED');
      
      let updatedListWithResets = updatedList;
      if (dependents.size > 0) {
        updatedListWithResets = updatedList.map(c => {
          if (dependents.has(c.id) && c.status === 'COMPLETED') {
            return { ...c, status: 'PLANNED' as CommitmentStatus, updatedAt: new Date().toISOString() };
          }
          return c;
        });
      }

      setLocalCommitments(updatedListWithResets);

      if (isNewGoalFlow) {
        onSaveNewGoalCommitments?.(updatedListWithResets);
      } else {
        await updateCommitment(editingCommitment.id, updatedFields);
        for (const dep of dependentNodes) {
          await updateCommitment(dep.id, { status: 'PLANNED' });
        }
      }

      if (dependentNodes.length > 0) {
        triggerAlert(
          "Dependent Tasks Reset",
          `Resetting parent task automatically reset dependent tasks: ${dependentNodes.map(n => `"${n.title}"`).join(', ')}`,
          "info"
        );
      }
    } else {
      // Normal save
      setLocalCommitments(updatedList);
      if (isNewGoalFlow) {
        onSaveNewGoalCommitments?.(updatedList);
      } else {
        await updateCommitment(editingCommitment.id, updatedFields);
      }
    }

    // Close panel
    setEditingCommitment(null);
  };

  // Find all transitively dependent nodes
  const getTransitiveDependents = (nodeId: string, commitments: Commitment[]): Set<string> => {
    const dependents = new Set<string>();
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      commitments.forEach(c => {
        if (c.dependsOn?.includes(currentId) && !dependents.has(c.id)) {
          dependents.add(c.id);
          queue.push(c.id);
        }
      });
    }
    return dependents;
  };

  const handleDeleteNodeDirectly = async (id: string) => {
    const dependentNodes = localCommitments.filter(c => c.dependsOn?.includes(id));

    if (isNewGoalFlow) {
      // Filter out commitment and remove it from any dependsOn lists
      const updated = localCommitments
        .filter(c => c.id !== id)
        .map(c => ({
          ...c,
          dependsOn: c.dependsOn?.filter(pid => pid !== id) || []
        }));
      setLocalCommitments(updated);
      onSaveNewGoalCommitments?.(updated);

      if (dependentNodes.length > 0) {
        triggerAlert(
          "Linkages Severed",
          `Prerequisite linkages were automatically severed for ${dependentNodes.length} dependent task(s) after deleting the task.`,
          "info"
        );
      }
    } else {
      // Update other commitments depending on this node to sever the relationship
      for (const other of localCommitments) {
        if (other.dependsOn?.includes(id)) {
          const freshDeps = other.dependsOn.filter(pid => pid !== id);
          await updateCommitment(other.id, { dependsOn: freshDeps });
        }
      }
      await deleteCommitment(id);

      if (dependentNodes.length > 0) {
        triggerAlert(
          "Linkages Severed",
          `Prerequisite linkages were automatically severed for ${dependentNodes.length} dependent task(s) after deleting the task.`,
          "info"
        );
      }
    }
    setDeleteConfirmNodeId(null);
  };

  const handleToggleStatus = async (comm: Commitment) => {
    const nextStatus = comm.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';

    if (nextStatus === 'COMPLETED' && comm.dependsOn && comm.dependsOn.length > 0) {
      const uncompletedPrereqs = comm.dependsOn
        .map(pid => localCommitments.find(c => c.id === pid))
        .filter(c => c && c.status !== 'COMPLETED');
        
      if (uncompletedPrereqs.length > 0) {
        const titles = uncompletedPrereqs.map(c => `"${c?.title}"`).join(', ');
        triggerAlert(
          "Prerequisite Blocked",
          `Please complete outstanding prerequisite task(s) first: ${titles}`,
          "warning"
        );
        return;
      }
    }

    if (isNewGoalFlow) {
      let updated = localCommitments.map(c => 
        c.id === comm.id ? { ...c, status: nextStatus, updatedAt: new Date().toISOString() } : c
      );

      if (nextStatus !== 'COMPLETED') {
        const dependents = getTransitiveDependents(comm.id, localCommitments);
        updated = updated.map(c => 
          dependents.has(c.id) && c.status === 'COMPLETED'
            ? { ...c, status: 'PLANNED' as CommitmentStatus, updatedAt: new Date().toISOString() }
            : c
        );
        const dependentNodes = localCommitments.filter(c => dependents.has(c.id) && c.status === 'COMPLETED');
        if (dependentNodes.length > 0) {
          triggerAlert(
            "Dependent Tasks Reset",
            `Resetting parent task automatically reset dependent tasks: ${dependentNodes.map(n => `"${n.title}"`).join(', ')}`,
            "info"
          );
        }
      }

      setLocalCommitments(updated);
      onSaveNewGoalCommitments?.(updated);
    } else {
      if (nextStatus !== 'COMPLETED') {
        const dependents = getTransitiveDependents(comm.id, localCommitments);
        const dependentNodes = localCommitments.filter(c => dependents.has(c.id) && c.status === 'COMPLETED');
        
        await updateCommitment(comm.id, { status: nextStatus });
        
        for (const dep of dependentNodes) {
          await updateCommitment(dep.id, { status: 'PLANNED' });
        }
        
        if (dependentNodes.length > 0) {
          triggerAlert(
            "Dependent Tasks Reset",
            `Resetting parent task automatically reset dependent tasks: ${dependentNodes.map(n => `"${n.title}"`).join(', ')}`,
            "info"
          );
        }
      } else {
        await updateCommitment(comm.id, { status: nextStatus });
      }
    }
  };

  const handleAddDependency = async (commId: string, prerequisiteId: string) => {
    const comm = localCommitments.find(c => c.id === commId);
    if (!comm || commId === prerequisiteId) return;

    // Detect cycles before adding
    const wouldCreateCycle = (startId: string, targetId: string, visited = new Set<string>()): boolean => {
      if (startId === targetId) return true;
      visited.add(startId);
      const current = localCommitments.find(x => x.id === startId);
      if (!current || !current.dependsOn) return false;
      for (const parentId of current.dependsOn) {
        if (!visited.has(parentId)) {
          if (wouldCreateCycle(parentId, targetId, visited)) return true;
        }
      }
      return false;
    };

    if (wouldCreateCycle(prerequisiteId, commId)) {
      triggerAlert(
        "Circular Dependency Intercepted",
        "A prerequisite cannot depend on its own child task (e.g. A depends on B which depends on A). Path rejected.",
        "error"
      );
      return;
    }

    const currentDeps = comm.dependsOn || [];
    if (currentDeps.includes(prerequisiteId)) return;

    const parent = localCommitments.find(c => c.id === prerequisiteId);
    if (parent) {
      const getEffectiveEndDateVal = (c: Commitment): string => {
        if (c.endDateStr) return c.endDateStr;
        if (c.startTime) return c.startTime.split('T')[0];
        return new Date().toISOString().split('T')[0];
      };
      
      const childEnd = getEffectiveEndDateVal(comm);
      const parentEnd = getEffectiveEndDateVal(parent);
      
      if (childEnd < parentEnd) {
        triggerAlert(
          "Invalid Date Dependency",
          `The dependent task "${comm.title}" (ends ${childEnd}) must end same day or after the prerequisite task "${parent.title}" (ends ${parentEnd}).`,
          "warning"
        );
        return;
      }
    }

    const updatedDeps = [...currentDeps, prerequisiteId];

    // Optimistically update local state immediately to make UI super snappy and trigger immediate layout/SVG repaint!
    const updated = localCommitments.map(c => 
      c.id === commId ? { ...c, dependsOn: updatedDeps } : c
    );
    setLocalCommitments(updated);

    if (isNewGoalFlow) {
      onSaveNewGoalCommitments?.(updated);
    } else {
      await updateCommitment(commId, { dependsOn: updatedDeps });
    }
  };

  const handleRemoveDependency = async (commId: string, prerequisiteId: string) => {
    const comm = localCommitments.find(c => c.id === commId);
    if (!comm) return;

    const updatedDeps = (comm.dependsOn || []).filter(pid => pid !== prerequisiteId);

    // Optimistically update local state immediately to make UI super snappy and trigger immediate layout/SVG repaint!
    const updated = localCommitments.map(c => 
      c.id === commId ? { ...c, dependsOn: updatedDeps } : c
    );
    setLocalCommitments(updated);

    if (isNewGoalFlow) {
      onSaveNewGoalCommitments?.(updated);
    } else {
      await updateCommitment(commId, { dependsOn: updatedDeps });
    }
  };

  // 4. Draw SVG curved lines connecting elements
  const renderSVGConnections = () => {
    const measureRef = canvasRef.current || containerRef.current;
    if (!measureRef) return null;

    const paths: React.JSX.Element[] = [];
    const baseRect = measureRef.getBoundingClientRect();

    localCommitments.forEach(comm => {
      const simplifiedDeps = getSimplifiedDependencies(comm.id);
      if (simplifiedDeps.length === 0) return;

      const targetEl = document.getElementById(`node-${comm.id}`);
      if (!targetEl) return;

      const targetRect = targetEl.getBoundingClientRect();
      // Target input coordinates (middle left of the child card) relative to the canvas/nested container
      const targetX = targetRect.left - baseRect.left;
      const targetY = targetRect.top + targetRect.height / 2 - baseRect.top;

      simplifiedDeps.forEach(parentId => {
        const sourceEl = document.getElementById(`node-${parentId}`);
        if (!sourceEl) return;

        const sourceRect = sourceEl.getBoundingClientRect();
        // Source output coordinates (middle right of the parent card) relative to the canvas/nested container
        const sourceX = sourceRect.right - baseRect.left;
        const sourceY = sourceRect.top + sourceRect.height / 2 - baseRect.top;

        // Visual properties based on parent completion
        const parentComm = localCommitments.find(x => x.id === parentId);
        const isCompleted = parentComm?.status === 'COMPLETED';

        // Adjust endpoints for clean arrow aesthetics:
        // Curve starts 2px to the right of the parent card and ends 8px to the left of the child card (base of arrowhead).
        const startX = sourceX + 2;
        const startY = sourceY;
        const endX = targetX - 8;
        const endY = targetY;

        // Draw dynamic smooth cubic bezier curves
        // Control points shift on X axis to make horizontal lines flow smoothly
        const controlOffset = Math.max(20, Math.abs(endX - startX) * 0.45);
        const cp1X = startX + controlOffset;
        const cp1Y = startY;
        const cp2X = endX - controlOffset;
        const cp2Y = endY;

        const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

        // Arrowhead path pointing to the right, ending exactly at targetX - 2.
        // This is inside the column gap so it is never clipped/covered by the card.
        const arrowPath = `M ${targetX - 8} ${targetY - 3.5} L ${targetX - 2} ${targetY} L ${targetX - 8} ${targetY + 3.5} Z`;

        paths.push(
          <g key={`${parentId}-${comm.id}`}>
            {/* Background glowing line */}
            <path 
              d={pathData} 
              fill="none" 
              className={`transition-all duration-1000 stroke-[4px] ${
                isCompleted 
                  ? 'stroke-emerald-400 dark:stroke-emerald-500 opacity-10' 
                  : 'stroke-indigo-400 dark:stroke-indigo-500 opacity-5 animate-path-flow'
              }`}
            />
            {/* Core foreground line */}
            <path 
              d={pathData} 
              fill="none" 
              className={`transition-all duration-1000 stroke-[1.5px] ${
                isCompleted 
                  ? 'stroke-emerald-600 dark:stroke-emerald-400' 
                  : 'stroke-indigo-400/80 dark:stroke-zinc-700/80 animate-path-flow'
              }`}
            />
            {/* Modern crisp arrowhead pointing to the child node, rendered in the open space gutter */}
            <path 
              d={arrowPath}
              className={`transition-all duration-300 ${
                isCompleted 
                  ? 'fill-emerald-600 dark:fill-emerald-400' 
                  : 'fill-indigo-400/80 dark:fill-zinc-600'
              }`}
            />
          </g>
        );
      });
    });

    return (
      <svg className="absolute inset-0 pointer-events-none overflow-visible w-full h-full z-20">
        {paths}
      </svg>
    );
  };

  const renderNodeCard = (comm: Commitment) => {
    if (editingCommitment?.id === comm.id) {
      return (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          key={`edit-${comm.id}`}
          id={`node-${comm.id}`}
          className="relative p-3.5 shadow-md flex flex-col gap-2.5 rounded-xl border border-indigo-500 bg-white dark:bg-zinc-900 z-50 w-full"
        >
          <form onSubmit={handleSaveEditCommitment} className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-zinc-800">
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide font-mono">
                Editing Specifications
              </span>
              <button 
                type="button"
                onClick={() => setEditingCommitment(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono">Objective</label>
              <input
                type="text"
                required
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-2 py-1 text-[11px] bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-neutral-900 dark:text-neutral-100 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono">Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as CommitmentType)}
                  className="w-full px-1.5 py-1 text-[11px] bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-neutral-900 dark:text-neutral-100 font-sans"
                >
                  <option value="TASK">Task</option>
                  <option value="EVENT">Event</option>
                  <option value="FOCUS_BLOCK">Focus Block</option>
                  <option value="APPOINTMENT">Appointment</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono">Constraint</label>
                <select
                  value={editConstraint}
                  onChange={(e) => setEditConstraint(e.target.value as CommitmentConstraint)}
                  className="w-full px-1.5 py-1 text-[11px] bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-neutral-900 dark:text-neutral-100 font-sans"
                >
                  <option value="FLEXIBLE">Flexible</option>
                  <option value="FIXED">Fixed</option>
                  <option value="OPTIONAL">Optional</option>
                </select>
              </div>
            </div>

            {/* Dates & Times */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono">Start Date</label>
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
                <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono">End Date</label>
                <CustomDatePicker
                  value={editEndDateStr}
                  onChange={(val) => setEditEndDateStr(val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono">Start Time</label>
                <CustomTimePicker
                  value={editStartTime}
                  onChange={(val) => setEditStartTime(val)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono">End Time</label>
                <CustomTimePicker
                  value={editEndTime}
                  onChange={(val) => setEditEndTime(val)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as CommitmentStatus)}
                className="w-full px-1.5 py-1 text-[11px] bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-neutral-900 dark:text-neutral-100 font-sans"
              >
                <option value="PLANNED">Planned</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-1.5 border-t border-neutral-100 dark:border-zinc-800 mt-2">
              <button
                type="button"
                onClick={() => setEditingCommitment(null)}
                className="px-2 py-1 text-[10.5px] border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-850 rounded-md text-neutral-500 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 text-[10.5px] bg-neutral-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-neutral-800 dark:hover:bg-zinc-200 rounded-md font-bold transition-all cursor-pointer shadow-xs"
              >
                Save
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    const isCompleted = comm.status === 'COMPLETED';
    const otherNodes = localCommitments.filter(c => c.id !== comm.id);
    
    const isAvailable = !isCompleted && (!comm.dependsOn || comm.dependsOn.length === 0 || comm.dependsOn.every(pid => {
      const parentNode = localCommitments.find(c => c.id === pid);
      return parentNode?.status === 'COMPLETED';
    }));
    const isBlocked = !isCompleted && !isAvailable;

    let cardBorderClass = '';
    let cardBgClass = '';
    let cardBadge = null;

    if (isCompleted) {
      cardBorderClass = 'border-emerald-500/30 ring-1 ring-emerald-500/10';
      cardBgClass = 'bg-[#f0fdf4] dark:bg-[#042417]';
      cardBadge = (
        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30 uppercase tracking-wider flex items-center gap-0.5">
          <CheckCircle2 className="h-2.5 w-2.5" /> Done
        </span>
      );
    } else if (isAvailable) {
      cardBorderClass = 'border-indigo-500 dark:border-indigo-500 shadow-md ring-1 ring-indigo-500/10 hover:border-indigo-600 dark:hover:border-indigo-400';
      cardBgClass = 'bg-white dark:bg-zinc-900';
      cardBadge = (
        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/30 uppercase tracking-wider animate-pulse flex items-center gap-0.5">
          Ready
        </span>
      );
    } else {
      cardBorderClass = 'border-neutral-200/60 dark:border-zinc-800/60';
      cardBgClass = 'bg-[#f4f4f5] dark:bg-[#18181b]';
      cardBadge = (
        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 border border-neutral-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 uppercase tracking-wider flex items-center gap-0.5">
          <Lock className="h-2.5 w-2.5" /> Blocked
        </span>
      );
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        key={comm.id}
        id={`node-${comm.id}`}
        className={`relative p-3.5 shadow-xs transition-all duration-300 flex flex-col gap-2.5 rounded-xl border ${cardBorderClass} ${cardBgClass}`}
      >
        {/* Card top details */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
              isBlocked ? 'bg-neutral-200 border-neutral-300/80 text-neutral-600 dark:bg-zinc-800 dark:border-zinc-700/60 dark:text-zinc-300' :
              comm.type === 'FOCUS_BLOCK' ? 'bg-indigo-100/80 border-indigo-200 text-indigo-800 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400' :
              comm.type === 'EVENT' ? 'bg-blue-100/80 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400' :
              comm.type === 'APPOINTMENT' ? 'bg-rose-100/80 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400' :
              'bg-neutral-100/90 border-neutral-200 text-neutral-800 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300'
            }`}>
              {comm.type.replace('_', ' ')}
            </span>
            {cardBadge}
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle completion */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(comm);
              }}
              className={`group/checkbox flex items-center justify-center h-4.5 w-4.5 border transition-all duration-200 cursor-pointer ${
                isCompleted
                  ? 'rounded-full bg-emerald-500 border-emerald-500 text-white dark:bg-emerald-500 dark:border-emerald-500'
                  : 'rounded-md hover:rounded-full border-neutral-400 dark:border-zinc-500 text-transparent hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10'
              }`}
              title={isCompleted ? "Mark Uncompleted" : "Complete Task"}
            >
              {isCompleted ? (
                <Check className="h-2.5 w-2.5 stroke-[3.5px]" />
              ) : (
                <Check className="h-2.5 w-2.5 text-emerald-500 dark:text-emerald-400 opacity-0 group-hover/checkbox:opacity-100 transition-opacity duration-150 stroke-[3px]" />
              )}
            </button>

            {/* Edit details button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingNode(false);
                setEditingCommitment(comm);
                setEditTitle(comm.title);
                setEditType(comm.type);
                setEditConstraint(comm.constraint);
                setEditDuration(comm.estimatedDuration);
                setEditStatus(comm.status);
                const sDate = comm.startTime ? comm.startTime.split('T')[0] : new Date().toISOString().split('T')[0];
                const sTime = comm.startTime && comm.startTime.includes('T') ? comm.startTime.split('T')[1].substring(0, 5) : '09:00';
                const eDate = comm.endDateStr || (comm.endTime ? comm.endTime.split('T')[0] : sDate);
                const eTime = comm.endTime && comm.endTime.includes('T') ? comm.endTime.split('T')[1].substring(0, 5) : '10:00';
                setEditDate(sDate);
                setEditEndDateStr(eDate);
                setEditStartTime(sTime);
                setEditEndTime(eTime);
              }}
              className="flex items-center justify-center h-4.5 w-4.5 rounded-md border border-neutral-400 dark:border-zinc-500 text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
              title="Edit Node Details"
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmNodeId(comm.id);
              }}
              className="flex items-center justify-center h-4.5 w-4.5 rounded-md border border-neutral-400 dark:border-zinc-500 text-slate-400 hover:text-red-500 hover:border-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10 cursor-pointer transition-all duration-200"
              title="Remove Node"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="min-w-0">
          <h4 className={`text-[12.5px] font-bold tracking-tight line-clamp-2 ${
            isCompleted ? 'line-through text-neutral-400 dark:text-zinc-500' :
            isBlocked ? 'text-neutral-800 dark:text-zinc-200' :
            'text-neutral-900 dark:text-neutral-100'
          }`}>
            {isBlocked && <Lock className="h-3 w-3 shrink-0 inline mr-1 text-neutral-500 dark:text-zinc-400 align-text-top" />}
            {comm.title}
          </h4>
        </div>

        {/* Duration info */}
        <div className="flex items-center gap-1 text-[9.5px] text-neutral-400 dark:text-zinc-500 font-mono">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{comm.estimatedDuration} mins</span>
        </div>

        {/* Prerequisites editing section */}
        <div className="pt-2 border-t border-neutral-100 dark:border-zinc-850/80 space-y-1.5">
          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500">
            Prerequisites
          </div>

          {/* Prerequisites chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {comm.dependsOn?.map(pid => {
              const parentNode = localCommitments.find(c => c.id === pid);
              if (!parentNode) return null;
              return (
                <div 
                  key={pid} 
                  className="flex items-center gap-1 text-[9.5px] bg-emerald-100/90 border border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 rounded-md px-1.5 py-0.5 truncate max-w-[150px] font-medium"
                >
                  <span className="truncate" title={parentNode.title}>{parentNode.title}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveDependency(comm.id, pid);
                    }}
                    className="text-emerald-700 dark:text-emerald-400 hover:text-rose-500 dark:hover:text-rose-400 font-bold shrink-0 focus:outline-none cursor-pointer"
                    title="Unlink"
                  >
                    &times;
                  </button>
                </div>
              );
            })}

            {/* Plus button directly inside the list */}
            {otherNodes.length > 0 && (
              <div className="relative inline-block text-left">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdownCommId(activeDropdownCommId === comm.id ? null : comm.id);
                  }}
                  className="flex items-center justify-center h-5 w-5 rounded-md border border-neutral-200 dark:border-zinc-800/60 bg-neutral-50/50 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 dark:bg-zinc-950/40 dark:hover:bg-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all cursor-pointer shadow-xs text-xs"
                  title="Add Prerequisite"
                >
                  <Plus className="h-3 w-3 stroke-[2.25px]" />
                </button>

                {/* Absolute dropdown for linking */}
                {activeDropdownCommId === comm.id && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-1.5 w-[220px] bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 overflow-y-auto max-h-[160px] z-[70] animate-in fade-in slide-in-from-top-1 duration-100"
                  >
                    <div className="px-2.5 py-1.5 text-[8.5px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider border-b border-neutral-100 dark:border-zinc-900 mb-1">
                      Link Prerequisite Task
                    </div>
                    {otherNodes
                      .filter(node => !comm.dependsOn?.includes(node.id))
                      .map(node => (
                        <button
                          key={node.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddDependency(comm.id, node.id);
                            setActiveDropdownCommId(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-[10.5px] font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-emerald-100/40 dark:hover:bg-emerald-950/30 hover:text-emerald-900 dark:hover:text-emerald-400 transition-colors truncate cursor-pointer block"
                        >
                          {node.title}
                        </button>
                      ))}
                    {otherNodes.filter(node => !comm.dependsOn?.includes(node.id)).length === 0 && (
                      <span className="text-[10px] text-neutral-400 dark:text-zinc-500 px-2.5 py-1.5 italic block">All linked</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {(!comm.dependsOn || comm.dependsOn.length === 0) && otherNodes.length === 0 && (
              <span className="text-[10px] text-neutral-400 dark:text-zinc-500 italic leading-none">Immediate start (No prerequisites)</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 dark:bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Delete Confirmation Dialog Modal - Rendered at top level to avoid clipping in flex/overflow containers */}
      <AnimatePresence>
        {deleteConfirmNodeId && (() => {
          const node = localCommitments.find(c => c.id === deleteConfirmNodeId);
          if (!node) return null;
          const dependentsCount = localCommitments.filter(c => c.dependsOn?.includes(deleteConfirmNodeId)).length;

          return (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmNodeId(null);
              }}
              className="fixed inset-0 bg-neutral-950/40 dark:bg-black/60 backdrop-blur-xs z-[90] flex items-center justify-center p-4 cursor-default"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 w-full max-w-sm rounded-xl shadow-xl overflow-hidden p-5 flex flex-col gap-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                    Remove Task Node?
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    Are you sure you want to remove <strong className="text-neutral-800 dark:text-zinc-200">"{node.title}"</strong> from the execution graph?
                  </p>
                  {dependentsCount > 0 && (
                    <p className="text-[10.5px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-2 mt-3 font-medium">
                      ⚠️ This will also sever prerequisites for {dependentsCount} dependent task(s).
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setDeleteConfirmNodeId(null)}
                    className="px-3.5 py-1.5 border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-850 rounded-lg text-xs font-semibold text-neutral-600 dark:text-zinc-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteNodeDirectly(deleteConfirmNodeId)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Remove Node
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      <div className="bg-white dark:bg-[#131415] border border-neutral-200 dark:border-zinc-800 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[850px] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-zinc-850 flex items-start justify-between shrink-0 bg-neutral-50/50 dark:bg-zinc-900/10 gap-4 text-left">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-xs shrink-0 mt-0.5">
              <Target className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title Input with clear editability affordance */}
              <div className="flex items-center gap-2.5 flex-wrap md:flex-nowrap w-full">
                <div className="relative group/title flex-1 max-w-md">
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    onBlur={() => handleFieldUpdate({ title: goalTitle })}
                    placeholder="Enter Goal Title..."
                    className="text-sm font-bold text-neutral-950 dark:text-neutral-50 bg-neutral-50/50 dark:bg-zinc-900/25 border border-neutral-200/40 dark:border-zinc-800/40 hover:border-neutral-300 dark:hover:border-zinc-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-950 focus:outline-none transition-all pl-2.5 pr-8 py-1 rounded-lg w-full font-sans tracking-tight cursor-text"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50 group-hover/title:opacity-100 transition-all pointer-events-none">
                    <Pencil className="h-3 w-3 text-neutral-400 dark:text-zinc-500" />
                    <span className="text-[8px] font-mono font-bold text-neutral-450 dark:text-zinc-500 uppercase tracking-wider hidden group-hover/title:inline">Edit</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                  {isNewGoalFlow ? 'Drafting' : 'Active Plan'}
                </span>
              </div>

              {/* Description Input with clear editability affordance */}
              <div className="w-full relative group/desc max-w-xl">
                <input
                  type="text"
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  onBlur={() => handleFieldUpdate({ description: goalDesc })}
                  placeholder="Describe what success looks like..."
                  className="text-[11px] text-neutral-500 dark:text-zinc-400 bg-neutral-50/30 dark:bg-zinc-900/15 border border-neutral-200/30 dark:border-zinc-800/20 hover:border-neutral-300 dark:hover:border-zinc-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-950 focus:outline-none transition-all pl-2.5 pr-8 py-1 rounded-lg w-full cursor-text"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 group-hover/desc:opacity-100 transition-all pointer-events-none">
                  <Pencil className="h-2.5 w-2.5 text-neutral-400 dark:text-zinc-500" />
                  <span className="text-[8px] font-mono font-bold text-neutral-450 dark:text-zinc-500 uppercase tracking-wider hidden group-hover/desc:inline">Edit</span>
                </div>
              </div>

              {/* Metadata Row: Area & Deadline */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 flex-wrap pt-0.5">
                <span className="flex items-center gap-1.5 bg-neutral-100/60 dark:bg-zinc-900/40 hover:bg-neutral-200/50 dark:hover:bg-zinc-800/50 px-2.5 py-0.5 rounded-md border border-neutral-200/65 dark:border-zinc-800/65 hover:border-neutral-300 dark:hover:border-zinc-700 transition-all cursor-pointer group/area">
                  <Folder className="h-3 w-3 text-neutral-400 group-hover/area:text-indigo-500 transition-colors" />
                  <select
                    value={goalArea}
                    onChange={(e) => {
                      setGoalArea(e.target.value);
                      handleFieldUpdate({ area: e.target.value });
                    }}
                    className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none font-sans text-[10.5px] text-neutral-600 dark:text-zinc-300 font-semibold cursor-pointer"
                  >
                    <option value="Career">Career & Focus</option>
                    <option value="Travel">Travel & Leisure</option>
                    <option value="Health">Health & Wellbeing</option>
                    <option value="Personal">Personal Projects</option>
                    <option value="Finance">Financial Independence</option>
                  </select>
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-neutral-450 dark:text-zinc-500 font-mono text-[10.5px] shrink-0">Target:</span>
                  <CustomDatePicker
                    value={goalDeadline}
                    onChange={(val) => {
                      setGoalDeadline(val);
                      handleFieldUpdate({ deadline: val });
                    }}
                    className="w-[120px]"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-900 transition-all text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Main Workspace Layout Wrapper to allow fixed children on top */}
        <div className="flex-1 min-h-0 relative flex flex-col">
          {/* Top Right Floating Badge - Pinned at top-right of visible canvas, not scrolling */}
          <div className="absolute top-4 right-4 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-1.5 border border-neutral-200/80 dark:border-zinc-800 rounded-lg text-[10.5px] font-mono font-bold text-neutral-500 dark:text-zinc-400 shadow-xs select-none pointer-events-none">
            {localCommitments.length} {localCommitments.length === 1 ? 'Node' : 'Nodes'}
          </div>

          {/* Warning / Error / Info Dynamic Banner */}
          {errorMessage && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[80] max-w-md w-[calc(100%-32px)] border rounded-xl p-3 shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
              errorSeverity === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40'
                : errorSeverity === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30'
                : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-250 dark:border-indigo-900/30'
            }`}>
              {errorSeverity === 'error' && (
                <AlertCircle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              {errorSeverity === 'warning' && (
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              {errorSeverity === 'info' && (
                <Info className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 text-left">
                <h4 className={`text-xs font-bold ${
                  errorSeverity === 'error'
                    ? 'text-rose-900 dark:text-rose-300'
                    : errorSeverity === 'warning'
                    ? 'text-amber-950 dark:text-amber-300'
                    : 'text-indigo-950 dark:text-indigo-300'
                }`}>
                  {errorTitle}
                </h4>
                <p className={`text-[10.5px] mt-0.5 leading-relaxed font-sans font-medium ${
                  errorSeverity === 'error'
                    ? 'text-rose-800/90 dark:text-rose-400/90'
                    : errorSeverity === 'warning'
                    ? 'text-amber-900/95 dark:text-amber-400/90'
                    : 'text-indigo-900/90 dark:text-indigo-400/90'
                }`}>
                  {errorMessage}
                </p>
              </div>
              <button 
                onClick={() => setErrorMessage(null)}
                className={`transition-colors p-0.5 ${
                  errorSeverity === 'error'
                    ? 'text-rose-400 hover:text-rose-600 dark:hover:text-rose-300'
                    : errorSeverity === 'warning'
                    ? 'text-amber-400 hover:text-amber-600 dark:hover:text-amber-300'
                    : 'text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                }`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Create Node Inline Panel (Pinned at Top-Left, non-scrolling) */}
          <AnimatePresence>
            {isAddingNode && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()} 
                className="absolute top-4 left-4 z-50 w-[320px] bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-4 rounded-xl shadow-lg"
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-zinc-800/80 mb-3">
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wide font-mono">
                    New Task Node Specification
                  </h4>
                  <button 
                    onClick={() => setIsAddingNode(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <form onSubmit={handleAddCommitment} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Task Objective</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Gather document scans"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:border-neutral-800 dark:focus:border-zinc-500 dark:text-neutral-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Type</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as CommitmentType)}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-850 rounded-lg focus:outline-none dark:text-neutral-100"
                      >
                        <option value="TASK">Task</option>
                        <option value="EVENT">Event</option>
                        <option value="FOCUS_BLOCK">Focus Block</option>
                        <option value="APPOINTMENT">Appointment</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Constraint</label>
                      <select
                        value={newConstraint}
                        onChange={(e) => setNewConstraint(e.target.value as CommitmentConstraint)}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-850 rounded-lg focus:outline-none dark:text-neutral-100"
                      >
                        <option value="FLEXIBLE">Flexible</option>
                        <option value="FIXED">Fixed</option>
                        <option value="OPTIONAL">Optional</option>
                      </select>
                    </div>
                  </div>

                  {/* Start Date & End Date */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Start Date</label>
                      <CustomDatePicker
                        value={newDate}
                        onChange={(val) => {
                          const oldDate = newDate;
                          setNewDate(val);
                          if (newEndDateStr === oldDate || newEndDateStr < val) {
                            setNewEndDateStr(val);
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase font-mono">End Date</label>
                      <CustomDatePicker
                        value={newEndDateStr}
                        onChange={(val) => setNewEndDateStr(val)}
                      />
                    </div>
                  </div>

                  {/* Start Time & End Time */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Start Time</label>
                      <CustomTimePicker
                        value={newStartTime}
                        onChange={(val) => setNewStartTime(val)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase font-mono">End Time</label>
                      <CustomTimePicker
                        value={newEndTime}
                        onChange={(val) => setNewEndTime(val)}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNode(false)}
                      className="px-3 py-1.5 text-xs border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-850 rounded-lg text-neutral-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs bg-neutral-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-lg font-bold"
                    >
                      Add to Canvas
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Workspace Layout (Canvas Area) */}
          <div 
            className="flex-1 overflow-auto relative bg-[#f8fafc] dark:bg-[#070809] text-zinc-300 dark:text-zinc-800" 
            ref={containerRef}
            onClick={() => setActiveDropdownCommId(null)}
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1.2px, transparent 1.2px)',
              backgroundSize: '18px 18px'
            }}
          >
            {localCommitments.length > 0 ? (
              <div 
                ref={canvasRef}
                className={`relative p-8 flex gap-12 select-none items-start z-10 mx-auto ${
                  levels.length > 2 
                    ? 'justify-start min-w-max' 
                    : 'justify-center min-w-full'
                }`}
              >
                {/* Connection lines drawn as background vectors */}
                {renderSVGConnections()}

                {levels.map((level) => {
                  const columnNodes = columns[level] || [];

                  return (
                    <div key={level} className="flex-1 max-w-[280px] min-w-[250px] flex flex-col gap-3.5 relative z-10">
                      <AnimatePresence mode="popLayout">
                        {columnNodes.map(comm => renderNodeCard(comm))}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-neutral-500 dark:text-zinc-500 min-h-[500px] relative z-10">
                <GitBranch className="h-10 w-10 text-neutral-300 dark:text-zinc-700 mb-3 animate-pulse" />
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Execution Graph Empty</h3>
                <p className="text-xs text-neutral-500 mt-1 mb-4">Add your first task node to start designing visual execution sequences.</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCommitment(null);
                    setIsAddingNode(true);
                  }}
                  className="px-4 py-2 bg-neutral-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-xl text-xs font-semibold hover:scale-[1.01] transition-all cursor-pointer shadow-xs"
                >
                  Create Initial Task
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-100 dark:border-zinc-850 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-zinc-900/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingCommitment(null);
              setIsAddingNode(!isAddingNode);
            }}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            title="Create new task node"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Add Task Node
          </button>

          <button
            onClick={handleSaveWorkspace}
            disabled={!goalTitle.trim() || localCommitments.length === 0}
            className="px-5 py-2 bg-neutral-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-xl text-xs font-bold shadow-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isNewGoalFlow ? 'Initiate Goal & Sequence' : 'Save & Exit Workspace'}
          </button>
        </div>

      </div>
    </div>
  );
};
