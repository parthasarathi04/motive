import { Commitment, CommitmentType, CommitmentConstraint, CommitmentOrigin, CommitmentStatus } from '../types';

export const CommitmentFactory = {
  /**
   * Standardizes the creation of all Commitment objects in Motive.
   * Ensures consistent constraint assignment, status detection, and default metadata.
   */
  create(payload: {
    userId: string;
    title: string;
    description?: string;
    type?: CommitmentType;
    source?: CommitmentOrigin;
    accountId?: string | null;
    goalLinks?: string[];
    dependencies?: string[];
    constraint?: CommitmentConstraint;
    importance?: 'LOW' | 'MEDIUM' | 'HIGH';
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
    impact?: 'LOW' | 'MEDIUM' | 'HIGH';
    energy?: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedDuration?: number;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
    completedAt?: string | null;
    status?: CommitmentStatus;
    metadata?: any;
    calendarEventId?: string;
  }): Omit<Commitment, 'id' | 'createdAt' | 'updatedAt'> {
    const type = payload.type || 'TASK';
    const source = payload.source || 'USER';
    
    // Auto-determine constraint based on type if not explicitly supplied
    let constraint: CommitmentConstraint = payload.constraint || 'FLEXIBLE';
    if (type === 'EVENT' || type === 'APPOINTMENT') {
      constraint = 'FIXED';
    }

    // Auto-determine status based on schedule parameters
    let status: CommitmentStatus = payload.status || 'PLANNED';
    if (payload.completedAt) {
      status = 'COMPLETED';
    } else if (payload.scheduledStart) {
      status = 'SCHEDULED';
    }

    const estimatedDuration = payload.estimatedDuration || 
      (payload.scheduledStart && payload.scheduledEnd 
        ? Math.round((new Date(payload.scheduledEnd).getTime() - new Date(payload.scheduledStart).getTime()) / (60 * 1000))
        : 30);

    return {
      userId: payload.userId,
      title: payload.title || 'Untitled Commitment',
      description: payload.description || '',
      type,
      source,
      accountId: payload.accountId || null,
      goalLinks: payload.goalLinks || [],
      dependencies: payload.dependencies || [],
      constraint,
      importance: payload.importance || 'MEDIUM',
      urgency: payload.urgency || 'MEDIUM',
      impact: payload.impact || 'MEDIUM',
      energy: payload.energy || 'MEDIUM',
      estimatedDuration: estimatedDuration > 0 ? estimatedDuration : 30,
      scheduledStart: payload.scheduledStart || null,
      scheduledEnd: payload.scheduledEnd || null,
      completedAt: payload.completedAt || null,
      status,
      metadata: payload.metadata || {},
      
      // Compatibility fields
      origin: source,
      startTime: payload.scheduledStart || undefined,
      endTime: payload.scheduledEnd || undefined,
      calendarEventId: payload.calendarEventId
    };
  }
};
