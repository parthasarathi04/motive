import { 
  Goal, 
  Commitment, 
  UserSettings, 
  PlannerResult, 
  GoalHealthDetails, 
  GoalPlanningStatus, 
  GoalHealthStatus, 
  Relationship,
  PlanningContext
} from '../types';

export class Planner {
  /**
   * Deterministic master planning calculator using PlanningContext.
   * Produces a unified, explainable PlannerResult.
   */
  static plan(context: PlanningContext): PlannerResult {
    const currentTime = new Date(context.currentTime);
    const todayStr = currentTime.toISOString().split('T')[0];

    const { goals, commitments, settings } = context;

    // --- 1. GOAL HEALTH CALCULATION ---
    // Calculate Goal Health first so we can use it in Commitment Priority calculation.
    const goalHealthMap: Record<string, GoalHealthDetails> = {};
    const upcomingDeadlines: { goalId: string; goalTitle: string; daysLeft: number; deadline: string }[] = [];

    goals.forEach(goal => {
      // Linked commitments
      const linkedComms = commitments.filter(c => c.goalLinks && c.goalLinks.includes(goal.id));
      const totalLinked = linkedComms.length;
      const completedLinked = linkedComms.filter(c => c.status === 'COMPLETED').length;
      const blockedLinked = linkedComms.filter(c => c.status === 'BLOCKED').length;

      const progress = totalLinked > 0 ? Math.round((completedLinked / totalLinked) * 100) : 0;

      // Determine planning completeness
      let planningStatus: GoalPlanningStatus = 'NOT_PLANNED';
      if (goal.status === 'COMPLETED') {
        planningStatus = 'COMPLETED';
      } else if (totalLinked >= 3) {
        planningStatus = 'PLANNED';
      } else if (totalLinked > 0) {
        planningStatus = 'PARTIALLY_PLANNED';
      }

      // Calculate deadline distance
      const deadlineDate = new Date(goal.deadline);
      const daysLeft = Math.ceil((deadlineDate.getTime() - currentTime.getTime()) / (24 * 60 * 60 * 1000));

      if (daysLeft >= 0 && daysLeft <= 7 && goal.status !== 'COMPLETED') {
        upcomingDeadlines.push({
          goalId: goal.id,
          goalTitle: goal.title,
          daysLeft,
          deadline: goal.deadline
        });
      }

      // Deterministic scoring algorithm
      let score = 80; // neutral base
      score += Math.round(progress * 0.25); // Up to +25 for execution progress

      if (planningStatus === 'NOT_PLANNED') {
        score -= 20;
      } else if (planningStatus === 'PARTIALLY_PLANNED') {
        score -= 10;
      }

      if (blockedLinked > 0) {
        score -= Math.min(25, blockedLinked * 8);
      }

      // Deadline proximity adjustments
      if (daysLeft < 0 && goal.status !== 'COMPLETED') {
        score = 15; // Past deadline but incomplete
      } else if (daysLeft <= 3 && progress < 50) {
        score = Math.max(10, score - 35);
      } else if (daysLeft <= 7 && progress < 25) {
        score = Math.max(20, score - 20);
      }

      score = Math.max(5, Math.min(100, score));

      let status: GoalHealthStatus = 'ON_TRACK';
      if (score < 45) {
        status = 'OFF_TRACK';
      } else if (score < 75) {
        status = 'AT_RISK';
      }

      // Standard explainability metadata
      let reason = 'Goal is progressing normally with stable indicators.';
      if (goal.status === 'COMPLETED') {
        reason = 'Goal successfully completed.';
      } else if (daysLeft < 0) {
        reason = 'Objective deadline has expired with incomplete commitments.';
      } else if (daysLeft <= 3 && progress < 50) {
        reason = 'Critical deadline approaching with under 50% completion.';
      } else if (daysLeft <= 7 && progress < 25) {
        reason = 'Approaching deadline with limited milestone planning progress.';
      } else if (blockedLinked > 0) {
        reason = `Contains ${blockedLinked} blocked tasks in the dependency graph.`;
      } else if (planningStatus === 'NOT_PLANNED') {
        reason = 'No active commitments have been allocated to this objective yet.';
      } else if (progress > 80) {
        reason = 'Goal is near total completion and execution is highly stable.';
      }

      goalHealthMap[goal.id] = { score, status, reason };

      // Sync back fields for legacy UI compatibility
      goal.planningStatus = planningStatus;
      goal.goalHealth = status;
      goal.momentum = score;
      goal.risk = status === 'ON_TRACK' ? 'LOW' : (status === 'AT_RISK' ? 'MEDIUM' : 'HIGH');
    });


    // --- 2. DYNAMIC COMMITMENT PRIORITY CALCULATION ---
    // Recalculated every single cycle and never persisted.
    commitments.forEach(comm => {
      if (comm.status === 'COMPLETED' || comm.status === 'CANCELLED') {
        comm.priorityScore = 0;
        return;
      }

      let priority = 30; // standard base

      // Factors: Importance, Urgency, Impact
      const impWeight = comm.importance === 'HIGH' ? 25 : (comm.importance === 'MEDIUM' ? 12 : 3);
      const urgWeight = comm.urgency === 'HIGH' ? 25 : (comm.urgency === 'MEDIUM' ? 12 : 3);
      const impctWeight = comm.impact === 'HIGH' ? 15 : (comm.impact === 'MEDIUM' ? 8 : 2);
      priority += impWeight + urgWeight + impctWeight;

      // Factors: Constraint (FIXED commitments must be protected, OPTIONAL can be skipped)
      if (comm.constraint === 'FIXED') {
        priority += 15;
      } else if (comm.constraint === 'FLEXIBLE') {
        priority += 5;
      } else {
        priority -= 10; // OPTIONAL
      }

      // Factors: Goal Health & Proximity
      if (comm.goalLinks && comm.goalLinks.length > 0) {
        let maxGoalBonus = 0;
        comm.goalLinks.forEach(gId => {
          const health = goalHealthMap[gId];
          if (health) {
            if (health.status === 'OFF_TRACK') {
              maxGoalBonus = Math.max(maxGoalBonus, 15);
            } else if (health.status === 'AT_RISK') {
              maxGoalBonus = Math.max(maxGoalBonus, 8);
            } else {
              maxGoalBonus = Math.max(maxGoalBonus, 3);
            }
          }
        });
        priority += maxGoalBonus;
      }

      // Dependency influences:
      // If other uncompleted commitments depend on this one, boost its priority
      const downstreamCount = commitments.filter(other => 
        other.status !== 'COMPLETED' && 
        other.status !== 'CANCELLED' && 
        other.dependencies && 
        other.dependencies.includes(comm.id)
      ).length;
      priority += downstreamCount * 8;

      // If it has outstanding dependencies itself, penalize its active priority to focus on prerequisites
      const hasUncompletedPrereqs = comm.dependencies && comm.dependencies.some(pId => {
        const prereq = commitments.find(c => c.id === pId);
        return prereq && prereq.status !== 'COMPLETED';
      });
      if (hasUncompletedPrereqs) {
        priority -= 20;
      }

      // Energy check - lightweight tasks are easily actionable, give minor boost
      if (comm.energy === 'LOW') {
        priority += 4;
      }

      comm.priorityScore = Math.max(0, Math.min(100, Math.round(priority)));
    });


    // --- 3. EXECUTION MOMENTUM CALCULATION ---
    // Belongs to user. Calculated dynamically from local execution consistency.
    let executionMomentum = 60; // neutral base
    const oneWeekAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);

    const pastWeekComms = commitments.filter(c => {
      const date = c.scheduledStart ? new Date(c.scheduledStart) : (c.startTime ? new Date(c.startTime) : null);
      return date && date >= oneWeekAgo && date <= currentTime;
    });

    let completedCount = 0;
    let missedCount = 0;
    let focusCompleted = 0;
    let skippedCount = 0;
    let reschedulesCount = 0;

    pastWeekComms.forEach(c => {
      if (c.status === 'COMPLETED') {
        completedCount++;
        if (c.type === 'FOCUS_BLOCK') {
          focusCompleted++;
        }
        // Completed early / on time bonus
        if (c.completedAt && c.scheduledStart) {
          const completedTime = new Date(c.completedAt);
          const schedTime = new Date(c.scheduledStart);
          if (completedTime <= schedTime) {
            executionMomentum += 5;
          }
        }
      } else if (c.status === 'CANCELLED') {
        skippedCount++;
      } else if (c.status !== 'DISCOVERED') {
        missedCount++;
      }

      if (c.metadata?.rescheduleCount && typeof c.metadata.rescheduleCount === 'number') {
        reschedulesCount += c.metadata.rescheduleCount;
      }
    });

    executionMomentum += completedCount * 5;
    executionMomentum += focusCompleted * 10;
    executionMomentum -= missedCount * 8;
    executionMomentum -= skippedCount * 4;
    executionMomentum -= reschedulesCount * 2;

    // Consistency Streak Check
    let consistentDays = 0;
    for (let i = 0; i < 3; i++) {
      const checkDayStr = new Date(currentTime.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const hasCompletion = commitments.some(c => {
        const complDate = c.completedAt ? c.completedAt.split('T')[0] : '';
        return c.status === 'COMPLETED' && complDate === checkDayStr;
      });
      if (hasCompletion) consistentDays++;
    }
    if (consistentDays >= 2) {
      executionMomentum += 15;
    } else {
      executionMomentum -= 10; // broken streak penalty
    }

    executionMomentum = Math.max(0, Math.min(100, executionMomentum));

    // Dynamic Previous Score and Trend Calculation
    // Today's specific impact
    const todayCompletions = commitments.filter(c => {
      const dateStr = c.completedAt ? c.completedAt.split('T')[0] : '';
      return dateStr === todayStr && c.status === 'COMPLETED';
    }).length;

    const previousScore = Math.max(10, Math.min(100, executionMomentum - (todayCompletions * 3) + 5));
    const trend: 'UP' | 'DOWN' | 'STABLE' = executionMomentum > previousScore ? 'UP' : (executionMomentum < previousScore ? 'DOWN' : 'STABLE');

    let momentumReason = 'Execution velocity is steady. Maintain consistency with today\'s focus slots.';
    if (executionMomentum < 45) {
      momentumReason = 'Execution velocity has slowed. Completing an unscheduled high impact item will boost momentum.';
    } else if (executionMomentum > 80) {
      momentumReason = 'Superb execution velocity! Multiple key milestones achieved ahead of schedule.';
    }


    // --- 4. TODAY'S COMMITMENTS FILTER ---
    const todayCommitments = commitments.filter(c => {
      const dateStr = c.scheduledStart ? c.scheduledStart.split('T')[0] : (c.startTime ? c.startTime.split('T')[0] : null);
      return dateStr === todayStr && c.status !== 'CANCELLED';
    }).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));


    // --- 5. CONFLICT DETECTION ---
    const conflicts: { id: string; title: string; reason: string; commitmentIds: string[]; type: 'OVERLAP' | 'DEPENDENCY_VIOLATION' | 'DEADLINE_COLLISION' | 'DOUBLE_BOOKED' }[] = [];

    const activeScheduled = commitments.filter(c => {
      if (c.status === 'COMPLETED' || c.status === 'CANCELLED') return false;
      return !!(c.scheduledStart && c.scheduledEnd);
    });

    // Overlaps and Double Bookings
    for (let i = 0; i < activeScheduled.length; i++) {
      const c1 = activeScheduled[i];
      const s1 = new Date(c1.scheduledStart!).getTime();
      const e1 = new Date(c1.scheduledEnd!).getTime();

      for (let j = i + 1; j < activeScheduled.length; j++) {
        const c2 = activeScheduled[j];
        const s2 = new Date(c2.scheduledStart!).getTime();
        const e2 = new Date(c2.scheduledEnd!).getTime();

        if (s1 < e2 && s2 < e1) {
          const type = (c1.source === 'GOOGLE' || c2.source === 'GOOGLE') ? 'DOUBLE_BOOKED' : 'OVERLAP';
          conflicts.push({
            id: `conflict-overlap-${c1.id}-${c2.id}`,
            title: type === 'DOUBLE_BOOKED' ? 'Google Calendar Collision' : 'Schedule Overlap',
            reason: `"${c1.title}" overlaps with "${c2.title}" between ${new Date(Math.max(s1, s2)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} and ${new Date(Math.min(e1, e2)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`,
            commitmentIds: [c1.id, c2.id],
            type
          });
        }
      }
    }

    // Dependency Violations
    commitments.forEach(c => {
      if (c.status === 'COMPLETED' || c.status === 'CANCELLED' || !c.dependencies) return;

      c.dependencies.forEach(pId => {
        const prereq = commitments.find(p => p.id === pId);
        if (!prereq || prereq.status === 'COMPLETED' || prereq.status === 'CANCELLED') return;

        // If downstream is scheduled but prerequisite is NOT scheduled or scheduled LATER
        if (c.scheduledStart) {
          const dsStart = new Date(c.scheduledStart).getTime();

          if (!prereq.scheduledStart) {
            conflicts.push({
              id: `conflict-dep-unregistered-${c.id}-${pId}`,
              title: 'Dependency Sequence Broken',
              reason: `"${c.title}" is scheduled, but its prerequisite "${prereq.title}" remains unscheduled.`,
              commitmentIds: [c.id, prereq.id],
              type: 'DEPENDENCY_VIOLATION'
            });
          } else {
            const prEnd = new Date(prereq.scheduledEnd || prereq.scheduledStart).getTime();
            if (prEnd > dsStart) {
              conflicts.push({
                id: `conflict-dep-sequence-${c.id}-${pId}`,
                title: 'Invalid Dependency Timing',
                reason: `"${c.title}" is scheduled to start before its prerequisite "${prereq.title}" finishes.`,
                commitmentIds: [c.id, prereq.id],
                type: 'DEPENDENCY_VIOLATION'
              });
            }
          }
        }
      });
    });

    // Deadline Collisions
    goals.forEach(goal => {
      if (goal.status === 'COMPLETED') return;
      const gDeadline = new Date(goal.deadline).getTime();

      const goalComms = commitments.filter(c => c.goalLinks && c.goalLinks.includes(goal.id));
      goalComms.forEach(c => {
        if (c.status === 'COMPLETED' || c.status === 'CANCELLED') return;

        if (c.scheduledStart) {
          const sTime = new Date(c.scheduledStart).getTime();
          if (sTime > gDeadline) {
            conflicts.push({
              id: `conflict-deadline-${c.id}-${goal.id}`,
              title: 'Goal Deadline Collision',
              reason: `"${c.title}" is scheduled after the deadline of its objective "${goal.title}".`,
              commitmentIds: [c.id],
              type: 'DEADLINE_COLLISION'
            });
          }
        }
      });
    });


    // --- 6. FOCUS SLOT DETECTION ---
    // Scan 9 AM to 6 PM today to find empty slots.
    const workStart = new Date(currentTime);
    workStart.setHours(9, 0, 0, 0);
    const workEnd = new Date(currentTime);
    workEnd.setHours(18, 0, 0, 0);

    const todayEvents = todayCommitments.filter(c => c.scheduledStart && c.scheduledEnd)
      .map(c => ({
        id: c.id,
        start: new Date(c.scheduledStart!),
        end: new Date(c.scheduledEnd!)
      })).sort((a, b) => a.start.getTime() - b.start.getTime());

    const availableFocusSlots: { start: string; end: string; duration: number; suggestedEnergyLevel?: 'LOW' | 'MEDIUM' | 'HIGH'; suggestedCommitmentId?: string }[] = [];
    let currentMarker = workStart.getTime();

    const addSlot = (startMs: number, endMs: number) => {
      const duration = Math.round((endMs - startMs) / (60 * 1000));
      if (duration >= 30) {
        let suggestedEnergyLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (duration >= 90) {
          suggestedEnergyLevel = 'HIGH';
        } else if (duration >= 60) {
          suggestedEnergyLevel = 'MEDIUM';
        }

        // Suggest an uncompleted, unscheduled, or flexible commitment matching energy & duration
        const candidate = commitments.find(c => 
          c.status !== 'COMPLETED' && 
          c.status !== 'CANCELLED' && 
          !c.scheduledStart && 
          c.estimatedDuration <= duration &&
          (c.energy === suggestedEnergyLevel || suggestedEnergyLevel === 'HIGH' || c.energy === 'LOW')
        );

        availableFocusSlots.push({
          start: new Date(startMs).toISOString(),
          end: new Date(endMs).toISOString(),
          duration,
          suggestedEnergyLevel,
          suggestedCommitmentId: candidate?.id
        });
      }
    };

    todayEvents.forEach(evt => {
      const evtStart = evt.start.getTime();
      const evtEnd = evt.end.getTime();

      if (evtStart > currentMarker) {
        addSlot(currentMarker, evtStart);
      }
      if (evtEnd > currentMarker) {
        currentMarker = evtEnd;
      }
    });

    if (workEnd.getTime() > currentMarker) {
      addSlot(currentMarker, workEnd.getTime());
    }


    // --- 7. DETECT RECOMMENDATIONS (Deterministic Engine) ---
    const recommendations: { id: string; title: string; reason: string; impact: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; confidence?: number; action?: string; expectedBenefit?: string }[] = [];

    // Check for overlapping slots
    conflicts.forEach((conf, idx) => {
      if (conf.type === 'OVERLAP' || conf.type === 'DOUBLE_BOOKED') {
        const freeSlot = availableFocusSlots[0];
        const targetCommId = conf.commitmentIds[0];
        const targetComm = commitments.find(c => c.id === targetCommId);

        if (freeSlot && targetComm) {
          const slotTimeStr = new Date(freeSlot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          recommendations.push({
            id: `rec-resolve-${conf.id}`,
            title: `Reschedule "${targetComm.title}"`,
            reason: conf.reason,
            impact: 'Stabilizes execution calendar & clears time conflict',
            severity: 'CRITICAL',
            confidence: 94,
            action: 'RESCHEDULE_COMMITMENT',
            expectedBenefit: `Clears overlap conflict and reserves dedicated focus at ${slotTimeStr}`
          });
        }
      }
    });

    // Check for goal health issues
    goals.forEach(goal => {
      const health = goalHealthMap[goal.id];
      if (health && health.status === 'OFF_TRACK') {
        recommendations.push({
          id: `rec-harden-${goal.id}`,
          title: `Harden Planning for "${goal.title}"`,
          reason: `Objective is OFF_TRACK with low milestone planning progress.`,
          impact: '+25 Objective Progress',
          severity: 'CRITICAL',
          confidence: 91,
          action: 'CREATE_COMMITMENT',
          expectedBenefit: 'Schedules a deep work focus block to resolve immediate sequence bottleneck'
        });
      } else if (health && health.status === 'AT_RISK') {
        recommendations.push({
          id: `rec-atrisk-${goal.id}`,
          title: `Schedule Next Step for "${goal.title}"`,
          reason: `Objective is approaching deadline with unfinished requirements.`,
          impact: '+12 Objective Progress',
          severity: 'WARNING',
          confidence: 85,
          action: 'RESCHEDULE_COMMITMENT',
          expectedBenefit: 'Locks in next immediate milestone action to secure the target deadline'
        });
      }
    });

    // Momentum warning
    if (executionMomentum < 50) {
      const easyWin = commitments.find(c => c.status !== 'COMPLETED' && c.status !== 'CANCELLED' && c.energy === 'LOW' && c.impact === 'HIGH');
      recommendations.push({
        id: 'rec-momentum-boost',
        title: easyWin ? `Complete Easy Win: "${easyWin.title}"` : 'Schedule Deep Work Session',
        reason: 'Execution momentum has fallen below 50. Achieving a simple milestone now will restore focus.',
        impact: '+15 Execution Momentum',
        severity: 'WARNING',
        confidence: 88,
        action: 'COMPLETE_COMMITMENT',
        expectedBenefit: 'Restores high performance consistency and boosts momentum'
      });
    }

    // Default if clean
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'rec-steady',
        title: 'Maintain Consistency',
        reason: 'All execution indicators look stable. Follow your current schedule to maintain momentum.',
        impact: 'High Consistency Streak',
        severity: 'INFO',
        confidence: 99,
        expectedBenefit: 'Maintains elite high performance consistency score'
      });
    }


    return {
      executionMomentum,
      executionMomentumDetails: {
        score: executionMomentum,
        previousScore,
        trend,
        reason: momentumReason
      },
      goalHealthMap,
      todayCommitments,
      recommendations,
      conflicts,
      availableFocusSlots,
      upcomingDeadlines,
      generatedTimestamp: currentTime.toISOString(),
      plannerVersion: '1.1.0'
    };
  }

  /**
   * For backward compatibility, map direct properties to PlanningContext and run plan.
   */
  static calculate(
    goals: Goal[],
    commitments: Commitment[],
    settings: UserSettings | null,
    currentTime: Date = new Date()
  ): PlannerResult {
    return this.plan({
      currentUser: null,
      currentTime: currentTime.toISOString(),
      connectedAccounts: [],
      goals,
      commitments,
      calendarEvents: [],
      settings
    });
  }

  /**
   * Calculates progress for a goal based on connected commitments.
   */
  static calculateGoalProgress(goalId: string, commitments: Commitment[], relationships: Relationship[]): number {
    const directlyLinked = commitments.filter(c => c.goalLinks && c.goalLinks.includes(goalId));
    if (directlyLinked.length === 0) return 0;
    const completed = directlyLinked.filter(c => c.status === 'COMPLETED').length;
    return Math.round((completed / directlyLinked.length) * 100);
  }

  /**
   * Calculates momentum based on progress and recent completions.
   */
  static calculateGoalMomentum(goalId: string, commitments: Commitment[], relationships: Relationship[]): number {
    const directlyLinked = commitments.filter(c => c.goalLinks && c.goalLinks.includes(goalId));
    if (directlyLinked.length === 0) {
      return 40; // Default baseline momentum for new goals
    }
    const total = directlyLinked.length;
    const completed = directlyLinked.filter(c => c.status === 'COMPLETED').length;
    const baseMomentum = (completed / total) * 100;
    const activeBonus = directlyLinked.some(c => c.status === 'IN_PROGRESS' || c.status === 'SCHEDULED') ? 15 : 0;
    return Math.max(15, Math.min(100, Math.round(baseMomentum * 0.7 + activeBonus + 30)));
  }

  /**
   * Deterministically calculates risk level for a goal based on deadlines and overdue tasks.
   */
  static calculateGoalRisk(goal: Goal, commitments: Commitment[], relationships: Relationship[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    const directlyLinked = commitments.filter(c => c.goalLinks && c.goalLinks.includes(goal.id));
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const msToDeadline = deadline.getTime() - now.getTime();
    const daysToDeadline = msToDeadline / (1000 * 60 * 60 * 24);

    const progress = this.calculateGoalProgress(goal.id, commitments, relationships);

    // 1. Check for overdue active commitments
    const hasOverdueCommitment = directlyLinked.some(c => {
      if (c.status !== 'COMPLETED' && c.status !== 'CANCELLED') {
        const cTime = c.scheduledStart || c.startTime;
        if (cTime) {
          const commitmentTime = new Date(cTime);
          return commitmentTime < now;
        }
      }
      return false;
    });

    if (hasOverdueCommitment) {
      return 'HIGH';
    }

    if (daysToDeadline < 0 && progress < 100) {
      return 'HIGH';
    }
    if (daysToDeadline <= 3) {
      return progress < 60 ? 'HIGH' : 'MEDIUM';
    }
    if (daysToDeadline <= 7) {
      return progress < 40 ? 'HIGH' : progress < 80 ? 'MEDIUM' : 'LOW';
    }
    if (daysToDeadline <= 14) {
      return progress < 20 ? 'MEDIUM' : 'LOW';
    }
    return 'LOW';
  }

  /**
   * Detects scheduling conflicts between commitments.
   */
  static detectConflicts(commitments: Commitment[]): Array<{ c1: Commitment; c2: Commitment }> {
    const scheduled = commitments.filter(
      c => (c.status === 'SCHEDULED' || c.status === 'IN_PROGRESS') && 
           (c.scheduledStart || c.startTime) && 
           (c.scheduledEnd || c.endTime)
    );

    const conflicts: Array<{ c1: Commitment; c2: Commitment }> = [];

    for (let i = 0; i < scheduled.length; i++) {
      for (let j = i + 1; j < scheduled.length; j++) {
        const startStr1 = scheduled[i].scheduledStart || scheduled[i].startTime!;
        const endStr1 = scheduled[i].scheduledEnd || scheduled[i].endTime!;
        const startStr2 = scheduled[j].scheduledStart || scheduled[j].startTime!;
        const endStr2 = scheduled[j].scheduledEnd || scheduled[j].endTime!;

        const s1 = new Date(startStr1).getTime();
        const e1 = new Date(endStr1).getTime();
        const s2 = new Date(startStr2).getTime();
        const e2 = new Date(endStr2).getTime();

        if (s1 < e2 && s2 < e1) {
          conflicts.push({ c1: scheduled[i], c2: scheduled[j] });
        }
      }
    }

    return conflicts;
  }
}

// For backwards compatibility, export BusinessEngine mapping directly to Planner!
export const BusinessEngine = {
  calculateGoalProgress: Planner.calculateGoalProgress.bind(Planner),
  calculateGoalMomentum: Planner.calculateGoalMomentum.bind(Planner),
  calculateGoalRisk: Planner.calculateGoalRisk.bind(Planner),
  detectConflicts: Planner.detectConflicts.bind(Planner)
};
