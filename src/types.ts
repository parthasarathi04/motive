export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
  timezone: string;
  createdAt: string;
  lastLogin: string;
}

export type GoalPlanningStatus = 'NOT_PLANNED' | 'PARTIALLY_PLANNED' | 'PLANNED' | 'EXECUTING' | 'COMPLETED';
export type GoalHealthStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category?: string;
  area?: string; // compatibility
  deadline: string;
  planningStatus?: GoalPlanningStatus;
  goalHealth?: GoalHealthStatus;
  status: 'DRAFT' | 'PLANNING' | 'ACTIVE' | 'BLOCKED' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  
  // compatibility
  momentum?: number;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type CommitmentType = 'EVENT' | 'TASK' | 'FOCUS_BLOCK' | 'APPOINTMENT';
export type CommitmentConstraint = 'FIXED' | 'FLEXIBLE' | 'OPTIONAL';
export type CommitmentOrigin = 'GOOGLE' | 'USER' | 'MOTIVE' | 'SYSTEM';
export type CommitmentStatus = 'DISCOVERED' | 'PLANNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'BLOCKED';

export interface Commitment {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: CommitmentType;
  source: CommitmentOrigin;
  accountId: string | null;
  goalLinks: string[]; // references to goal IDs
  dependencies: string[]; // references to commitment IDs
  constraint: CommitmentConstraint;
  importance: 'LOW' | 'MEDIUM' | 'HIGH';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  energy: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedDuration: number; // in minutes
  scheduledStart: string | null; // ISO string
  scheduledEnd: string | null; // ISO string
  completedAt?: string | null; // ISO string
  status: CommitmentStatus;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  priorityScore?: number;

  // Compatibility aliases
  origin?: CommitmentOrigin;
  startTime?: string;
  endTime?: string;
  calendarEventId?: string;
  emailMessageId?: string;
  dependsOn?: string[];
  isRepeating?: boolean;
  repeatDays?: number[];
  repeatType?: 'DAILY' | 'WEEKLY' | 'NONE';
  isAllDay?: boolean;
  endDateStr?: string;
  energyRequired?: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedImpact?: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedFocus?: 'DEEP' | 'NORMAL' | 'LIGHT';
}

export interface CalendarAccount {
  id: string; // Google Account ID
  userId: string;
  email: string;
  displayName: string;
  avatar: string;
  status: 'ACTIVE' | 'INACTIVE';
  syncToken: string | null;
  lastSync: string | null;
  isPrimary: boolean;
}

export interface CalendarEventCache {
  id: string; // Google Event ID
  calendarId: string;
  accountId: string;
  userId: string;
  summary: string;
  description: string;
  start: string; // ISO string
  end: string; // ISO string
  status: string;
  eTag: string;
  updated: string;
  deleted: boolean;
}

export interface TimelineEntry {
  id: string;
  userId: string;
  type: string;
  entityId: string;
  summary: string;
  createdAt: string;
}

export interface LinkedAccount {
  email: string;
  name: string;
  photoUrl?: string;
  isPrimary: boolean;
  linkedAt: string;
}

export interface Relationship {
  id: string;
  userId: string;
  goalId: string;
  commitmentId: string;
  confidence: number;
  source: string;
  reason: string;
}

export interface UserSettings {
  userId: string;
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  calendarSync: boolean;
  emailSync: boolean;
  focusBlockSync: boolean;
  notifications: boolean;
  linkedAccounts?: LinkedAccount[];
  logoFont?: 'plaster' | 'protest-gorilla' | 'emblema-one' | 'keania-one' | 'kenia';
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

export interface ProposedAction {
  id: string;
  type: 'CREATE_GOAL' | 'CREATE_COMMITMENT' | 'RESCHEDULE_COMMITMENT' | 'DELETE_COMMITMENT';
  description: string;
  data: any;
  status: 'PENDING' | 'EXECUTED' | 'REJECTED';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actions?: ProposedAction[];
}

export interface GoalHealthDetails {
  score: number;
  status: GoalHealthStatus;
  reason: string;
}

export interface PlannerResult {
  executionMomentum: number;
  executionMomentumDetails?: {
    score: number;
    previousScore: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    reason: string;
  };
  goalHealthMap: Record<string, GoalHealthDetails>;
  todayCommitments: Commitment[];
  recommendations: {
    id: string;
    title: string;
    reason: string;
    impact: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    confidence?: number;
    action?: string;
    expectedBenefit?: string;
  }[];
  conflicts: {
    id: string;
    title: string;
    reason: string;
    commitmentIds: string[];
    type?: 'OVERLAP' | 'DEPENDENCY_VIOLATION' | 'DEADLINE_COLLISION' | 'DOUBLE_BOOKED';
  }[];
  availableFocusSlots: {
    start: string;
    end: string;
    duration: number; // in minutes
    suggestedEnergyLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    suggestedCommitmentId?: string;
  }[];
  upcomingDeadlines: {
    goalId: string;
    goalTitle: string;
    daysLeft: number;
    deadline: string;
  }[];
  generatedTimestamp: string;
  plannerVersion: string;
}

export type PlannerCommandType = 
  | 'CREATE_GOAL'
  | 'UPDATE_GOAL'
  | 'DELETE_GOAL'
  | 'CREATE_COMMITMENT'
  | 'UPDATE_COMMITMENT'
  | 'DELETE_COMMITMENT'
  | 'COMPLETE_COMMITMENT'
  | 'RESCHEDULE_COMMITMENT'
  | 'LINK_GOAL'
  | 'UNLINK_GOAL'
  | 'CREATE_FOCUS_BLOCK'
  | 'GOOGLE_SYNC';

export interface PlannerCommand {
  id: string;
  userId: string;
  type: PlannerCommandType;
  payload: any;
  createdAt: string;
}

export interface PlanningContext {
  currentUser: UserProfile | null;
  currentTime: string; // ISO string
  connectedAccounts: CalendarAccount[];
  goals: Goal[];
  commitments: Commitment[];
  calendarEvents: CalendarEventCache[];
  settings: UserSettings | null;
}

