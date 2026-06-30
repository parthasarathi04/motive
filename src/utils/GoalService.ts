import { GoalRepository } from '../repositories/GoalRepository';
import { TimelineRepository } from '../repositories/TimelineRepository';
import { CommitmentRepository } from '../repositories/CommitmentRepository';
import { Goal, Commitment } from '../types';
import { CommitmentFactory } from './CommitmentFactory';

export const GoalService = {
  async createGoal(userId: string, payload: any): Promise<Goal> {
    const goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      title: payload.title,
      description: payload.description || '',
      category: payload.category || 'Personal',
      area: payload.category || 'Personal', // compatibility
      deadline: payload.deadline,
      planningStatus: 'NOT_PLANNED',
      goalHealth: 'ON_TRACK',
      status: payload.status || 'PLANNING',
      momentum: 70, // compatibility
      risk: 'LOW' // compatibility
    };

    const freshGoal = await GoalRepository.createGoal(goalData);

    await TimelineRepository.createTimelineEntry({
      userId,
      type: 'GOAL_CREATED',
      entityId: freshGoal.id,
      summary: `Established objective: "${freshGoal.title}".`
    });

    // Handle custom commitments if supplied
    if (payload.customCommitments && payload.customCommitments.length > 0) {
      const idMap: Record<string, string> = {};

      for (const comm of payload.customCommitments) {
        // Construct using CommitmentFactory
        const commitmentPayload = CommitmentFactory.create({
          userId,
          type: comm.type || 'TASK',
          title: comm.title,
          description: comm.description || '',
          goalLinks: [freshGoal.id],
          dependencies: [],
          constraint: comm.constraint || 'FLEXIBLE',
          source: comm.source || 'USER',
          accountId: null,
          importance: comm.importance || 'MEDIUM',
          urgency: comm.urgency || 'MEDIUM',
          impact: comm.impact || comm.estimatedImpact || 'MEDIUM',
          energy: comm.energy || comm.energyRequired || 'MEDIUM',
          estimatedDuration: comm.estimatedDuration || 30,
          scheduledStart: comm.scheduledStart || null,
          scheduledEnd: comm.scheduledEnd || null,
          completedAt: comm.completedAt || null,
          status: comm.status || 'PLANNED',
          metadata: comm.metadata || {}
        });

        const freshComm = await CommitmentRepository.createCommitment(commitmentPayload);
        idMap[comm.id] = freshComm.id;
      }

      // Link dependencies
      for (const comm of payload.customCommitments) {
        const realId = idMap[comm.id];
        if (!realId) continue;

        const mappedDependsOn = comm.dependsOn?.map((oldId: string) => idMap[oldId]).filter(Boolean) as string[] || [];
        if (mappedDependsOn.length > 0) {
          await CommitmentRepository.updateCommitment(userId, realId, {
            dependencies: mappedDependsOn,
          });
        }
      }
    }

    return freshGoal;
  },

  async updateGoal(userId: string, id: string, updates: Partial<Goal>): Promise<void> {
    await GoalRepository.updateGoal(userId, id, updates);
  },

  async deleteGoal(userId: string, id: string): Promise<void> {
    await GoalRepository.deleteGoal(userId, id);
  }
};
