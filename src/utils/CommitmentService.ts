import { CommitmentRepository } from '../repositories/CommitmentRepository';
import { TimelineRepository } from '../repositories/TimelineRepository';
import { Commitment } from '../types';
import { CommitmentFactory } from './CommitmentFactory';

export const CommitmentService = {
  async createCommitment(userId: string, payload: any): Promise<Commitment> {
    const commitmentPayload = CommitmentFactory.create({
      userId,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      source: payload.source,
      accountId: payload.accountId,
      goalLinks: payload.goalLinks,
      dependencies: payload.dependencies,
      constraint: payload.constraint,
      importance: payload.importance,
      urgency: payload.urgency,
      impact: payload.impact,
      energy: payload.energy,
      estimatedDuration: payload.estimatedDuration,
      scheduledStart: payload.scheduledStart,
      scheduledEnd: payload.scheduledEnd,
      completedAt: payload.completedAt,
      status: payload.status,
      metadata: payload.metadata
    });

    const freshComm = await CommitmentRepository.createCommitment(commitmentPayload);

    await TimelineRepository.createTimelineEntry({
      userId,
      type: 'COMMITMENT_CREATED',
      entityId: freshComm.id,
      summary: `Created commitment "${freshComm.title}".`
    });

    return freshComm;
  },

  async updateCommitment(userId: string, id: string, updates: Partial<Commitment>): Promise<void> {
    await CommitmentRepository.updateCommitment(userId, id, updates);
  },

  async deleteCommitment(userId: string, id: string): Promise<void> {
    const target = await CommitmentRepository.getCommitments(userId).then(list => list.find(c => c.id === id));
    if (target) {
      if (target.status === 'CANCELLED') {
        await CommitmentRepository.deleteCommitment(userId, id);
      } else {
        await CommitmentRepository.updateCommitment(userId, id, { status: 'CANCELLED' });
      }
    }
  },

  async completeCommitment(userId: string, id: string): Promise<void> {
    const commitments = await CommitmentRepository.getCommitments(userId);
    const target = commitments.find(c => c.id === id);
    if (target) {
      const isCompleting = target.status !== 'COMPLETED';
      const newStatus = isCompleting ? 'COMPLETED' : 'PLANNED';
      const now = new Date().toISOString();
      await CommitmentRepository.updateCommitment(userId, id, {
        status: newStatus,
        completedAt: isCompleting ? now : null
      });

      if (isCompleting) {
        await TimelineRepository.createTimelineEntry({
          userId,
          type: 'COMMITMENT_COMPLETED',
          entityId: id,
          summary: `Marked commitment "${target.title}" as completed.`
        });
      }
    }
  },

  async rescheduleCommitment(userId: string, id: string, scheduledStart: string | null, scheduledEnd: string | null): Promise<void> {
    await CommitmentRepository.updateCommitment(userId, id, {
      scheduledStart,
      scheduledEnd,
      startTime: scheduledStart || undefined, // compatibility
      endTime: scheduledEnd || undefined, // compatibility
      status: scheduledStart ? 'SCHEDULED' : 'PLANNED'
    });
  },

  async linkGoal(userId: string, commitmentId: string, goalId: string): Promise<void> {
    const commitments = await CommitmentRepository.getCommitments(userId);
    const target = commitments.find(c => c.id === commitmentId);
    if (target) {
      const links = target.goalLinks || [];
      if (!links.includes(goalId)) {
        await CommitmentRepository.updateCommitment(userId, commitmentId, {
          goalLinks: [...links, goalId]
        });
      }
    }
  },

  async unlinkGoal(userId: string, commitmentId: string, goalId: string): Promise<void> {
    const commitments = await CommitmentRepository.getCommitments(userId);
    const target = commitments.find(c => c.id === commitmentId);
    if (target) {
      const links = target.goalLinks || [];
      await CommitmentRepository.updateCommitment(userId, commitmentId, {
        goalLinks: links.filter(gId => gId !== goalId)
      });
    }
  },

  async createFocusBlock(userId: string, payload: any): Promise<void> {
    const commitmentPayload = CommitmentFactory.create({
      userId,
      title: payload.title,
      description: payload.description || 'Dedicated Deep Work block.',
      type: 'FOCUS_BLOCK',
      source: 'MOTIVE',
      accountId: null,
      goalLinks: payload.goalLinks || [],
      dependencies: [],
      constraint: 'FLEXIBLE',
      importance: 'HIGH',
      urgency: 'MEDIUM',
      impact: 'HIGH',
      energy: 'HIGH',
      estimatedDuration: payload.duration || 90,
      scheduledStart: payload.scheduledStart || null,
      scheduledEnd: payload.scheduledEnd || null,
      completedAt: null,
      status: payload.scheduledStart ? 'SCHEDULED' : 'PLANNED',
      metadata: {}
    });

    await CommitmentRepository.createCommitment(commitmentPayload);
  }
};
