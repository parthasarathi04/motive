import { Goal, Commitment, Relationship } from '../types';

export const BusinessEngine = {
  /**
   * Calculates progress for a goal based on connected commitments
   */
  calculateGoalProgress(goalId: string, commitments: Commitment[], relationships: Relationship[]): number {
    const connectedCommitmentIds = relationships
      .filter(r => r.goalId === goalId)
      .map(r => r.commitmentId);

    if (connectedCommitmentIds.length === 0) {
      return 0;
    }

    const connectedCommitments = commitments.filter(c => connectedCommitmentIds.includes(c.id));
    if (connectedCommitments.length === 0) {
      return 0;
    }

    const completed = connectedCommitments.filter(c => c.status === 'COMPLETED').length;
    return Math.round((completed / connectedCommitments.length) * 100);
  },

  /**
   * Calculates momentum based on progress and recent completions
   */
  calculateGoalMomentum(goalId: string, commitments: Commitment[], relationships: Relationship[]): number {
    const connectedCommitmentIds = relationships
      .filter(r => r.goalId === goalId)
      .map(r => r.commitmentId);

    if (connectedCommitmentIds.length === 0) {
      return 40; // Default baseline momentum for new goals
    }

    const connectedCommitments = commitments.filter(c => connectedCommitmentIds.includes(c.id));
    if (connectedCommitments.length === 0) {
      return 40;
    }

    const total = connectedCommitments.length;
    const completed = connectedCommitments.filter(c => c.status === 'COMPLETED').length;
    
    // Base momentum is percentage completed
    const baseMomentum = (completed / total) * 100;

    // Add bonus for recently updated or active commitments
    const activeBonus = connectedCommitments.some(c => c.status === 'IN_PROGRESS' || c.status === 'SCHEDULED') ? 15 : 0;
    
    // Limit to 100 and floor at 10
    return Math.max(15, Math.min(100, Math.round(baseMomentum * 0.7 + activeBonus + 30)));
  },

  /**
   * Deterministically calculates risk level for a goal based on deadlines and overdue tasks
   */
  calculateGoalRisk(goal: Goal, commitments: Commitment[], relationships: Relationship[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    const connectedCommitmentIds = relationships
      .filter(r => r.goalId === goal.id)
      .map(r => r.commitmentId);

    const connectedCommitments = commitments.filter(c => connectedCommitmentIds.includes(c.id));
    
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const msToDeadline = deadline.getTime() - now.getTime();
    const daysToDeadline = msToDeadline / (1000 * 60 * 60 * 24);

    const progress = this.calculateGoalProgress(goal.id, commitments, relationships);

    // 1. Check for overdue active commitments
    const hasOverdueCommitment = connectedCommitments.some(c => {
      if (c.status !== 'COMPLETED' && c.status !== 'CANCELLED' && c.startTime) {
        const commitmentTime = new Date(c.startTime);
        return commitmentTime < now;
      }
      return false;
    });

    if (hasOverdueCommitment) {
      return 'HIGH';
    }

    // 2. Deadline-based risk calculation
    if (daysToDeadline < 0 && progress < 100) {
      return 'HIGH'; // Past deadline and incomplete
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
  },

  /**
   * Detects scheduling conflicts between commitments
   */
  detectConflicts(commitments: Commitment[]): Array<{ c1: Commitment; c2: Commitment }> {
    const scheduled = commitments.filter(
      c => (c.status === 'SCHEDULED' || c.status === 'IN_PROGRESS') && c.startTime && c.endTime
    );

    const conflicts: Array<{ c1: Commitment; c2: Commitment }> = [];

    for (let i = 0; i < scheduled.length; i++) {
      for (let j = i + 1; j < scheduled.length; j++) {
        const s1 = new Date(scheduled[i].startTime!).getTime();
        const e1 = new Date(scheduled[i].endTime!).getTime();
        const s2 = new Date(scheduled[j].startTime!).getTime();
        const e2 = new Date(scheduled[j].endTime!).getTime();

        // Check intersection
        if (s1 < e2 && s2 < e1) {
          conflicts.push({ c1: scheduled[i], c2: scheduled[j] });
        }
      }
    }

    return conflicts;
  }
};
