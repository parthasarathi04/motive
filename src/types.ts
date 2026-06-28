export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
  timezone: string;
  createdAt: string;
  lastLogin: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string;
  momentum: number; // 0 to 100
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'DRAFT' | 'PLANNING' | 'ACTIVE' | 'BLOCKED' | 'COMPLETED' | 'ARCHIVED';
  area: string; // e.g. Travel, Career, Personal, Health
  createdAt: string;
  updatedAt: string;
}

export type CommitmentType = 'EVENT' | 'TASK' | 'FOCUS_BLOCK' | 'APPOINTMENT';
export type CommitmentConstraint = 'FIXED' | 'FLEXIBLE' | 'OPTIONAL';
export type CommitmentOrigin = 'USER' | 'CALENDAR' | 'GMAIL' | 'AI';
export type CommitmentStatus = 'DISCOVERED' | 'PLANNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Commitment {
  id: string;
  userId: string;
  type: CommitmentType;
  title: string;
  description?: string;
  constraint: CommitmentConstraint;
  origin: CommitmentOrigin;
  status: CommitmentStatus;
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  estimatedDuration: number; // in minutes
  calendarEventId?: string;
  gmailMessageId?: string;
  dependsOn?: string[]; // IDs of commitments this commitment depends on
  isRepeating?: boolean;
  repeatDays?: number[]; // 0 to 6 (Sun-Sat)
  repeatType?: 'DAILY' | 'WEEKLY' | 'NONE';
  isAllDay?: boolean;
  endDateStr?: string; // e.g. '2026-07-03' for multi-day events
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  userId: string;
  goalId: string;
  commitmentId: string;
  confidence: number; // 0 to 1
  source: 'USER' | 'AI' | 'IMPORTED';
  reason: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  title: string;
  reason: string;
  impact: string; // e.g. "+12 Momentum"
  confidence: number; // 0 to 100
  estimatedMinutes: number;
  goalId?: string;
  status: 'ACTIVE' | 'ACCEPTED' | 'DISMISSED';
  createdAt: string;
}

export type TimelineEventType = 
  | 'GOAL_CREATED'
  | 'GOAL_COMPLETED'
  | 'COMMITMENT_COMPLETED'
  | 'COMMITMENT_CREATED'
  | 'RECOMMENDATION_ACCEPTED'
  | 'CALENDAR_IMPORTED'
  | 'EMAIL_DISCOVERED'
  | 'RELATIONSHIP_ADDED';

export interface TimelineEntry {
  id: string;
  userId: string;
  type: TimelineEventType;
  entityId: string;
  summary: string;
  createdAt: string;
}

export interface Artifact {
  id: string;
  userId: string;
  type: 'EMAIL' | 'CALENDAR';
  source: 'GMAIL' | 'GOOGLE_CALENDAR';
  title: string;
  summary: string;
  receivedAt: string;
  link?: string;
  category?: string;
  confidence?: number;
  suggestedGoalId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DISMISSED';
}

export interface UserSettings {
  userId: string;
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  calendarSync: boolean;
  gmailSync: boolean;
  focusBlockSync: boolean;
  notifications: boolean;
}

export interface DailyBrief {
  greeting: string;
  summary: string;
  focusAreas: string[];
  recommendation: string;
  closingMessage: string;
}

export interface WeeklyReview {
  wins: string[];
  missedOpportunities: string[];
  biggestRisk: string;
  nextWeekFocus: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
