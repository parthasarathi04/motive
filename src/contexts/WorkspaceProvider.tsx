import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  Goal, 
  Commitment, 
  TimelineEntry, 
  UserSettings, 
  DailyBrief, 
  ChatMessage,
  PlannerResult,
  CalendarAccount,
  CalendarEventCache,
  UserProfile
} from '../types';
import { GoalRepository } from '../repositories/GoalRepository';
import { CommitmentRepository } from '../repositories/CommitmentRepository';
import { TimelineRepository } from '../repositories/TimelineRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { AccountRepository } from '../repositories/AccountRepository';
import { PlannerResultRepository } from '../repositories/PlannerResultRepository';
import { CalendarRepository } from '../repositories/CalendarRepository';
import { ActionDispatcher } from '../utils/ActionDispatcher';
import { Planner } from '../utils/Planner';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

// --- Types & Interfaces ---
export interface Relationship {
  id: string;
  userId: string;
  goalId: string;
  commitmentId: string;
  confidence: number;
  source: 'USER' | 'AI' | 'IMPORTED';
  reason: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  title: string;
  reason: string;
  impact: string;
  confidence: number;
  estimatedMinutes: number;
  goalId?: string;
  status: 'ACTIVE' | 'ACCEPTED' | 'DISMISSED';
  createdAt: string;
}

export interface Artifact {
  id: string;
  userId: string;
  type: 'EMAIL' | 'CALENDAR';
  source: 'EMAIL' | 'GOOGLE_CALENDAR';
  title: string;
  summary: string;
  receivedAt: string;
  link?: string;
  category?: string;
  confidence?: number;
  suggestedGoalId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DISMISSED';
}

export interface WorkspaceState {
  // Authentication & Session
  currentUser: UserProfile | null;
  userId: string;
  userProfile: { name: string; email: string; photoUrl: string } | null;
  authLoading: boolean;
  isSandbox: boolean;

  // Domain Objects
  goals: Goal[];
  commitments: Commitment[];
  relationships: Relationship[];
  recommendations: Recommendation[];
  timeline: TimelineEntry[];
  artifacts: Artifact[];
  accounts: CalendarAccount[];
  settings: UserSettings | null;

  // Planner Outputs
  plannerResult: PlannerResult;
  resolvedTheme: 'LIGHT' | 'DARK';
  dailyBrief: DailyBrief | null;
  weeklyReview: any | null;

  // Workspace UI State
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  isSyncing: boolean;
  activeView: 'dashboard' | 'goals' | 'calendar' | 'commitments' | 'settings';
  setActiveView: (view: 'dashboard' | 'goals' | 'calendar' | 'commitments' | 'settings') => void;
  isAiSidebarOpen: boolean;
  setIsAiSidebarOpen: (isOpen: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (isOpen: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;

  // Action Methods
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  enterSandboxMode: () => void;
  
  addGoal: (title: string, description: string, deadline: string, area: string, customCommitments?: Commitment[]) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  addCommitment: (commitment: Omit<Commitment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, goalId?: string) => Promise<Commitment>;
  updateCommitment: (id: string, updates: Partial<Commitment>) => Promise<void>;
  deleteCommitment: (id: string) => Promise<void>;
  toggleCommitmentComplete: (id: string) => Promise<void>;
  
  acceptRecommendation: (rec: any) => Promise<void>;
  dismissRecommendation: (id: string) => Promise<void>;
  
  acceptArtifact: (artifact: Artifact) => Promise<void>;
  dismissArtifact: (id: string) => Promise<void>;
  
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  sendChatMessage: (text: string) => Promise<void>;
  syncGoogleCalendar: (start?: string, end?: string) => Promise<void>;
  syncEmail: () => Promise<void>;
  generateNewRecommendation: () => Promise<void>;
  clearAllData: () => void;
}

// Sub-Contexts for Modular Design
interface GoalContextProps {
  goals: Goal[];
  addGoal: (title: string, description: string, deadline: string, area: string, customCommitments?: Commitment[]) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

interface CommitmentContextProps {
  commitments: Commitment[];
  addCommitment: (commitment: Omit<Commitment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, goalId?: string) => Promise<Commitment>;
  updateCommitment: (id: string, updates: Partial<Commitment>) => Promise<void>;
  deleteCommitment: (id: string) => Promise<void>;
  toggleCommitmentComplete: (id: string) => Promise<void>;
}

interface CalendarContextProps {
  accounts: CalendarAccount[];
  isSyncing: boolean;
  syncGoogleCalendar: (start?: string, end?: string) => Promise<void>;
}

interface PlannerContextProps {
  plannerResult: PlannerResult;
  dailyBrief: DailyBrief | null;
  weeklyReview: any | null;
  generateNewRecommendation: () => Promise<void>;
}

interface SettingsContextProps {
  settings: UserSettings | null;
  resolvedTheme: 'LIGHT' | 'DARK';
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

const GoalContext = createContext<GoalContextProps | undefined>(undefined);
const CommitmentContext = createContext<CommitmentContextProps | undefined>(undefined);
const CalendarContext = createContext<CalendarContextProps | undefined>(undefined);
const PlannerContext = createContext<PlannerContextProps | undefined>(undefined);
const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

const DEFAULT_USER_ID = 'partha_bhunia_user_id';

// --- Unified Workspace Provider ---

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; photoUrl: string } | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSandbox, setIsSandbox] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('motive_sandbox_mode') === 'true' : false;
  });

  // Sidebar and UI state
  const [activeView, setActiveView] = useState<'dashboard' | 'goals' | 'calendar' | 'commitments' | 'settings'>('dashboard');
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('motive_sidebar_collapsed') === 'true' : false;
  });

  const setIsSidebarCollapsed = (isCollapsed: boolean) => {
    setIsSidebarCollapsedState(isCollapsed);
    localStorage.setItem('motive_sidebar_collapsed', String(isCollapsed));
  };

  // Timeline & Chat
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', text: 'Hello! I am Mo, your AI execution companion. I have synced your commitments and calendar. How can we optimize your roadmap today?', timestamp: new Date().toISOString() }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [systemDark, setSystemDark] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const resolvedTheme = useMemo<'LIGHT' | 'DARK'>(() => {
    const themeSetting = settings?.theme || 'SYSTEM';
    if (themeSetting === 'SYSTEM') {
      return systemDark ? 'DARK' : 'LIGHT';
    }
    return themeSetting;
  }, [settings?.theme, systemDark]);

  const applyTheme = (theme: 'LIGHT' | 'DARK' | 'SYSTEM') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'DARK') {
      root.classList.add('dark');
    } else if (theme === 'LIGHT') {
      root.classList.add('light');
    } else {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isSystemDark ? 'dark' : 'light');
    }
  };

  useEffect(() => {
    if (!userId) return;
    SettingsRepository.getSettings(userId).then(s => {
      let updated = { ...s };
      if (userProfile && userProfile.email) {
        const hasLoginAccount = updated.linkedAccounts?.some(acc => acc.email.toLowerCase() === userProfile.email.toLowerCase());
        if (!hasLoginAccount) {
          const loginAcc = {
            email: userProfile.email,
            name: userProfile.name,
            photoUrl: userProfile.photoUrl,
            isPrimary: true,
            linkedAt: new Date().toISOString()
          };
          const existing = updated.linkedAccounts ? updated.linkedAccounts.map(acc => ({ ...acc, isPrimary: false })) : [];
          updated.linkedAccounts = [loginAcc, ...existing];
          SettingsRepository.updateSettings(userId, { linkedAccounts: updated.linkedAccounts });
        }
      }
      setSettings(updated);
      applyTheme(updated.theme);
    });

    const onSettingsUpdate = () => {
      SettingsRepository.getSettings(userId).then(s => {
        setSettings(s);
        applyTheme(s.theme);
      });
    };
    window.addEventListener('motive_settings_updated', onSettingsUpdate);
    return () => window.removeEventListener('motive_settings_updated', onSettingsUpdate);
  }, [userId, userProfile]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!userId) return;
    const current = settings || {
      userId,
      theme: 'SYSTEM',
      calendarSync: true,
      emailSync: true,
      focusBlockSync: true,
      notifications: true
    };
    const updated = { ...current, ...updates };
    setSettings(updated);
    applyTheme(updated.theme);
    await ActionDispatcher.dispatch(userId, { type: 'UPDATE_SETTINGS' as any, payload: updates });
  };

  // Goals state
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      return;
    }
    const unsub = GoalRepository.subscribeGoals(userId, setGoals);
    return () => unsub();
  }, [userId]);

  const addGoal = async (title: string, description: string, deadline: string, area: string, customCommitments?: Commitment[]): Promise<Goal> => {
    const updatedResult = await ActionDispatcher.dispatch(userId, {
      type: 'CREATE_GOAL',
      payload: { title, description, deadline, category: area, customCommitments }
    });
    const freshGoals = await GoalRepository.getGoals(userId);
    setGoals(freshGoals);
    return freshGoals[0] || { id: 'fallback', userId, title, description, deadline, status: 'PLANNING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    await ActionDispatcher.dispatch(userId, { type: 'UPDATE_GOAL', payload: { id, updates } });
  };

  const deleteGoal = async (id: string) => {
    await ActionDispatcher.dispatch(userId, { type: 'DELETE_GOAL', payload: { id } });
  };

  // Commitments state
  const [commitments, setCommitments] = useState<Commitment[]>([]);

  useEffect(() => {
    if (!userId) {
      setCommitments([]);
      return;
    }
    const unsub = CommitmentRepository.subscribeCommitments(userId, setCommitments);
    return () => unsub();
  }, [userId]);

  const addCommitment = async (commitment: Omit<Commitment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, goalId?: string): Promise<Commitment> => {
    const goalLinks = goalId ? [goalId] : [];
    await ActionDispatcher.dispatch(userId, {
      type: 'CREATE_COMMITMENT',
      payload: { ...commitment, goalLinks }
    });
    const freshComms = await CommitmentRepository.getCommitments(userId);
    setCommitments(freshComms);
    return freshComms[0] || { id: 'fallback', userId, title: commitment.title, type: commitment.type, source: commitment.source, constraint: commitment.constraint, status: commitment.status, accountId: null, goalLinks: [], dependencies: [], importance: 'MEDIUM', urgency: 'MEDIUM', impact: 'MEDIUM', energy: 'MEDIUM', estimatedDuration: 30, scheduledStart: null, scheduledEnd: null, completedAt: null, metadata: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  };

  const updateCommitment = async (id: string, updates: Partial<Commitment>) => {
    await ActionDispatcher.dispatch(userId, { type: 'UPDATE_COMMITMENT', payload: { id, updates } });
  };

  const deleteCommitment = async (id: string) => {
    await ActionDispatcher.dispatch(userId, { type: 'DELETE_COMMITMENT', payload: { id } });
  };

  const toggleCommitmentComplete = async (id: string) => {
    await ActionDispatcher.dispatch(userId, { type: 'COMPLETE_COMMITMENT', payload: { id } });
  };

  // Calendar Provider state
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!userId) {
      setAccounts([]);
      return;
    }
    AccountRepository.getAccounts(userId).then(list => {
      if (list.length === 0 && isSandbox) {
        const defaultAccount: CalendarAccount = {
          id: 'cal-primary',
          userId,
          email: 'parthabhunia2001@gmail.com',
          displayName: 'Partha Sarathi Bhunia',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          status: 'ACTIVE',
          syncToken: null,
          lastSync: new Date().toISOString(),
          isPrimary: true
        };
        AccountRepository.saveAccount(defaultAccount).then(() => {
          setAccounts([defaultAccount]);
        });
      } else {
        setAccounts(list);
      }
    });
  }, [userId, isSandbox]);

  const syncGoogleCalendar = async (start?: string, end?: string) => {
    setIsSyncing(true);
    try {
      await ActionDispatcher.dispatch(userId, { type: 'SYNC_CALENDAR', payload: { start, end } });
    } catch (e) {
      console.error('Calendar sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Planner and recommendations state
  const [dailyBrief, setDailyBrief] = useState<DailyBrief | null>(null);
  const [weeklyReview, setWeeklyReview] = useState<any | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventCache[]>([]);

  useEffect(() => {
    if (!userId) {
      setCalendarEvents([]);
      return;
    }
    CalendarRepository.getEvents(userId).then(setCalendarEvents);
  }, [userId, commitments]);

  const plannerResult = useMemo<PlannerResult>(() => {
    return Planner.plan({
      currentUser: null,
      currentTime: new Date().toISOString(),
      connectedAccounts: accounts,
      goals,
      commitments,
      calendarEvents,
      settings
    });
  }, [goals, commitments, accounts, calendarEvents, settings]);

  useEffect(() => {
    if (userId && plannerResult) {
      PlannerResultRepository.saveResult(userId, plannerResult);
    }
  }, [plannerResult, userId]);

  useEffect(() => {
    if (goals.length === 0) return;
    
    // Daily brief
    fetch('/api/ai/daily-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals, commitments })
    }).then(async res => {
      if (res.ok) setDailyBrief(await res.json());
    }).catch(e => console.error('Daily brief fetch error:', e));

    // Weekly review
    fetch('/api/ai/weekly-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals, commitments })
    }).then(async res => {
      if (res.ok) setWeeklyReview(await res.json());
    }).catch(e => console.error('Weekly review fetch error:', e));
  }, [goals, commitments]);

  const generateNewRecommendation = async () => {
    if (!userId) return;
    const events = await CalendarRepository.getEvents(userId);
    const freshResult = Planner.plan({
      currentUser: null,
      currentTime: new Date().toISOString(),
      connectedAccounts: accounts,
      goals,
      commitments,
      calendarEvents: events,
      settings
    });
    await PlannerResultRepository.saveResult(userId, freshResult);
  };

  // Derived state (computed synchronously on render to avoid hook rule violation in consumer callback)
  const relationships = useMemo<Relationship[]>(() => {
    const list: Relationship[] = [];
    commitments.forEach(c => {
      if (c.goalLinks) {
        c.goalLinks.forEach(gId => {
          list.push({
            id: `rel-${c.id}-${gId}`,
            userId: c.userId,
            goalId: gId,
            commitmentId: c.id,
            confidence: 1.0,
            source: 'USER',
            reason: 'Explicitly linked'
          });
        });
      }
    });
    return list;
  }, [commitments]);

  const recommendations = useMemo<Recommendation[]>(() => {
    return plannerResult.recommendations.map((r, idx) => ({
      id: r.id || `derived-rec-${idx}`,
      userId,
      title: r.title,
      reason: r.reason,
      impact: r.impact,
      confidence: r.severity === 'CRITICAL' ? 95 : (r.severity === 'WARNING' ? 70 : 45),
      estimatedMinutes: 30,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    }));
  }, [plannerResult.recommendations, userId]);

  const artifacts: Artifact[] = [];

  const acceptRecommendation = async (rec: any) => {
    const matched = commitments.find(c => c.title.toLowerCase().includes(rec.title.split(' ')[0].toLowerCase()));
    if (matched) {
      await toggleCommitmentComplete(matched.id);
    }
  };

  const dismissRecommendation = async (id: string) => {};
  const acceptArtifact = async (artifact: Artifact) => {};
  const dismissArtifact = async (id: string) => {};
  const syncEmail = async () => {};

  // Auth changed subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const profile = {
          uid: user.uid,
          name: user.displayName || user.email || 'User',
          email: user.email || '',
          photoUrl: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        setUserId(user.uid);
        setCurrentUser(profile);
        setUserProfile({
          name: profile.name,
          email: profile.email,
          photoUrl: profile.photoUrl
        });
        setIsSandbox(false);
        localStorage.removeItem('motive_sandbox_mode');
        localStorage.setItem('motive_use_cloud', 'true');
      } else {
        const isSandboxActive = localStorage.getItem('motive_sandbox_mode') === 'true';
        if (isSandboxActive) {
          setUserId(DEFAULT_USER_ID);
          setCurrentUser(null);
          setUserProfile({
            name: 'Guest Pilot',
            email: 'sandbox@motive.ai',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
          });
          setIsSandbox(true);
        } else {
          setUserId('');
          setCurrentUser(null);
          setUserProfile(null);
          setIsSandbox(false);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync timeline
  useEffect(() => {
    if (!userId) {
      setTimeline([]);
      return;
    }
    
    if (!localStorage.getItem('motive_initialized')) {
      seedDefaultDemoData();
      localStorage.setItem('motive_initialized', 'true');
    }

    const unsubTimeline = TimelineRepository.subscribeTimeline(userId, setTimeline);
    return () => unsubTimeline();
  }, [userId]);

  const signInWithGoogle = async () => {
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar');
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Sign in failed:", e);
      setAuthLoading(false);
    }
  };

  const signOutUser = async () => {
    setAuthLoading(true);
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign out failed:", e);
    } finally {
      localStorage.removeItem('motive_sandbox_mode');
      localStorage.removeItem('motive_use_cloud');
      localStorage.removeItem('motive_initialized');
      setUserId('');
      setCurrentUser(null);
      setUserProfile(null);
      setIsSandbox(false);
      setAuthLoading(false);
      window.location.reload();
    }
  };

  const enterSandboxMode = () => {
    localStorage.setItem('motive_sandbox_mode', 'true');
    localStorage.removeItem('motive_use_cloud');
    setUserId(DEFAULT_USER_ID);
    setUserProfile({
      name: 'Guest Pilot',
      email: 'sandbox@motive.ai',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    });
    setIsSandbox(true);
  };

  const seedDefaultDemoData = () => {
    const now = new Date();
    
    const visaDeadline = new Date();
    visaDeadline.setDate(now.getDate() + 20);
    const visaGoal: Goal = {
      id: 'g-france-visa',
      userId: DEFAULT_USER_ID,
      title: 'Get France Visa',
      description: 'Prepare documents, scan passports, and attend consulate interview to get Schengen visa.',
      deadline: visaDeadline.toISOString().split('T')[0],
      category: 'Travel',
      status: 'ACTIVE',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    const promoDeadline = new Date();
    promoDeadline.setDate(now.getDate() + 60);
    const promoGoal: Goal = {
      id: 'g-promotion',
      userId: DEFAULT_USER_ID,
      title: 'Prepare for Promotion',
      description: 'Review roadmap, complete system design reviews, update achievements tracker, and practice presentations.',
      deadline: promoDeadline.toISOString().split('T')[0],
      category: 'Career',
      status: 'PLANNING',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    localStorage.setItem(`motive_goals_${DEFAULT_USER_ID}`, JSON.stringify([visaGoal, promoGoal]));

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(11, 0, 0, 0);

    const scanTime = new Date();
    scanTime.setDate(now.getDate() + 2);
    scanTime.setHours(14, 0, 0, 0);
    const scanTimeEnd = new Date(scanTime);
    scanTimeEnd.setHours(14, 30, 0, 0);

    const seededCommitments: Commitment[] = [
      {
        id: 'c-passport-scan',
        userId: DEFAULT_USER_ID,
        type: 'TASK',
        title: 'Scan and Upload Passport Details',
        description: 'Scan all visa pages and main info page in high resolution.',
        goalLinks: ['g-france-visa'],
        dependencies: [],
        constraint: 'FLEXIBLE',
        source: 'USER',
        origin: 'USER',
        accountId: null,
        importance: 'HIGH',
        urgency: 'MEDIUM',
        impact: 'HIGH',
        energy: 'MEDIUM',
        status: 'PLANNED',
        estimatedDuration: 15,
        scheduledStart: scanTime.toISOString(),
        scheduledEnd: scanTimeEnd.toISOString(),
        startTime: scanTime.toISOString(),
        endTime: scanTimeEnd.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metadata: {}
      },
      {
        id: 'c-bank-statement',
        userId: DEFAULT_USER_ID,
        type: 'TASK',
        title: 'Compile Bank Statements & Finances',
        description: 'Export last 3 months of bank statements and print out.',
        goalLinks: ['g-france-visa'],
        dependencies: [],
        constraint: 'FLEXIBLE',
        source: 'USER',
        origin: 'USER',
        accountId: null,
        importance: 'HIGH',
        urgency: 'HIGH',
        impact: 'HIGH',
        energy: 'HIGH',
        status: 'PLANNED',
        estimatedDuration: 45,
        scheduledStart: null,
        scheduledEnd: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metadata: {}
      },
      {
        id: 'c-visa-app',
        userId: DEFAULT_USER_ID,
        type: 'TASK',
        title: 'Schedule Visa Appointment',
        description: 'Find slot at VFS global visa appointment website.',
        goalLinks: ['g-france-visa'],
        dependencies: [],
        constraint: 'FIXED',
        source: 'USER',
        origin: 'USER',
        accountId: null,
        importance: 'HIGH',
        urgency: 'HIGH',
        impact: 'HIGH',
        energy: 'LOW',
        status: 'COMPLETED',
        estimatedDuration: 20,
        scheduledStart: null,
        scheduledEnd: null,
        completedAt: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metadata: {}
      },
      {
        id: 'c-sys-design',
        userId: DEFAULT_USER_ID,
        type: 'FOCUS_BLOCK',
        title: 'System Design Interview Prep',
        description: 'Focus on distributed caching, rate limiters, and queue designs.',
        goalLinks: ['g-promotion'],
        dependencies: [],
        constraint: 'FLEXIBLE',
        source: 'SYSTEM',
        origin: 'SYSTEM',
        accountId: null,
        importance: 'HIGH',
        urgency: 'LOW',
        impact: 'MEDIUM',
        energy: 'HIGH',
        status: 'PLANNED',
        estimatedDuration: 90,
        scheduledStart: null,
        scheduledEnd: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metadata: {}
      },
      {
        id: 'c-team-sync',
        userId: DEFAULT_USER_ID,
        type: 'EVENT',
        title: 'Vite & React Project Team Sync',
        description: 'Align on launch deliverables and next milestone schedule.',
        goalLinks: [],
        dependencies: [],
        constraint: 'FIXED',
        source: 'GOOGLE',
        origin: 'GOOGLE',
        accountId: 'cal-primary',
        importance: 'MEDIUM',
        urgency: 'HIGH',
        impact: 'LOW',
        energy: 'MEDIUM',
        status: 'SCHEDULED',
        scheduledStart: tomorrow.toISOString(),
        scheduledEnd: tomorrowEnd.toISOString(),
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
        estimatedDuration: 60,
        calendarEventId: 'cal-event-1',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metadata: {}
      }
    ];

    localStorage.setItem(`motive_commitments_${DEFAULT_USER_ID}`, JSON.stringify(seededCommitments));

    const seededTimeline: TimelineEntry[] = [
      { id: 't-1', userId: DEFAULT_USER_ID, type: 'GOAL_CREATED', entityId: 'g-france-visa', summary: 'Established new Travel goal: "Get France Visa" with target of July 15.', createdAt: now.toISOString() },
      { id: 't-2', userId: DEFAULT_USER_ID, type: 'COMMITMENT_COMPLETED', entityId: 'c-visa-app', summary: 'Successfully scheduled official Visa consulate appointment.', createdAt: now.toISOString() }
    ];
    localStorage.setItem(`motive_timeline_${DEFAULT_USER_ID}`, JSON.stringify(seededTimeline));
  };

  const clearAllData = () => {
    localStorage.removeItem(`motive_goals_${userId}`);
    localStorage.removeItem(`motive_commitments_${userId}`);
    localStorage.removeItem(`motive_timeline_${userId}`);
    localStorage.removeItem(`motive_planner_result_${userId}`);
    localStorage.setItem('motive_initialized', 'empty');
    window.location.reload();
  };

  const sendChatMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: chatMessages })
      });
      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: 'ai',
          text: data.text,
          actions: data.actions,
          timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, aiMsg]);
      }
    } catch (e) {
      console.error("Chat failure", e);
    } finally {
      setIsChatLoading(false);
    }
  };

  const value: WorkspaceState = {
    currentUser,
    userId,
    userProfile,
    authLoading,
    isSandbox,
    goals,
    commitments,
    relationships,
    recommendations,
    timeline,
    artifacts,
    accounts,
    settings,
    plannerResult,
    resolvedTheme,
    dailyBrief,
    weeklyReview,
    chatMessages,
    isChatLoading,
    isSyncing,
    activeView,
    setActiveView,
    isAiSidebarOpen,
    setIsAiSidebarOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,

    signInWithGoogle,
    signOutUser,
    enterSandboxMode,
    addGoal,
    updateGoal,
    deleteGoal,
    addCommitment,
    updateCommitment,
    deleteCommitment,
    toggleCommitmentComplete,
    acceptRecommendation,
    dismissRecommendation,
    acceptArtifact,
    dismissArtifact,
    updateSettings,
    sendChatMessage,
    syncGoogleCalendar,
    syncEmail,
    generateNewRecommendation,
    clearAllData
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useMotive = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useMotive must be used within a WorkspaceProvider');
  }
  return context;
};

// For compatibility with old code
export const MotiveProvider = WorkspaceProvider;
export const MotiveContext = WorkspaceContext;
