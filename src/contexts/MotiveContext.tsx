import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Goal, 
  Commitment, 
  Relationship, 
  Recommendation, 
  TimelineEntry, 
  Artifact, 
  UserSettings, 
  DailyBrief, 
  ChatMessage 
} from '../types';
import { GoalRepository } from '../repositories/GoalRepository';
import { CommitmentRepository } from '../repositories/CommitmentRepository';
import { RelationshipRepository } from '../repositories/RelationshipRepository';
import { RecommendationRepository } from '../repositories/RecommendationRepository';
import { TimelineRepository } from '../repositories/TimelineRepository';
import { ArtifactRepository } from '../repositories/ArtifactRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { BusinessEngine } from '../utils/BusinessEngine';

interface MotiveContextType {
  userId: string;
  userProfile: { name: string; email: string; photoUrl: string } | null;
  goals: Goal[];
  commitments: Commitment[];
  relationships: Relationship[];
  recommendations: Recommendation[];
  timeline: TimelineEntry[];
  artifacts: Artifact[];
  settings: UserSettings | null;
  dailyBrief: DailyBrief | null;
  weeklyReview: any | null;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  isSyncing: boolean;
  activeView: 'dashboard' | 'goals' | 'calendar' | 'commitments' | 'insights';
  setActiveView: (view: 'dashboard' | 'goals' | 'calendar' | 'commitments' | 'insights') => void;
  isAiSidebarOpen: boolean;
  setIsAiSidebarOpen: (isOpen: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (isOpen: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  
  // Actions
  addGoal: (title: string, description: string, deadline: string, area: string, customCommitments?: Commitment[]) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  addCommitment: (commitment: Omit<Commitment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, goalId?: string) => Promise<Commitment>;
  updateCommitment: (id: string, updates: Partial<Commitment>) => Promise<void>;
  deleteCommitment: (id: string) => Promise<void>;
  toggleCommitmentComplete: (id: string) => Promise<void>;
  
  acceptRecommendation: (rec: Recommendation) => Promise<void>;
  dismissRecommendation: (id: string) => Promise<void>;
  
  acceptArtifact: (artifact: Artifact) => Promise<void>;
  dismissArtifact: (id: string) => Promise<void>;
  
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  sendChatMessage: (text: string) => Promise<void>;
  syncGoogleCalendar: () => Promise<void>;
  syncGmail: () => Promise<void>;
  generateNewRecommendation: () => Promise<void>;
  clearAllData: () => void;
}

const MotiveContext = createContext<MotiveContextType | undefined>(undefined);

const DEFAULT_USER_ID = 'partha_bhunia_user_id';

export const MotiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string>(DEFAULT_USER_ID);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; photoUrl: string } | null>({
    name: 'Partha Bhunia',
    email: 'parthabhunia2001@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  });
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  
  const [dailyBrief, setDailyBrief] = useState<DailyBrief | null>(null);
  const [weeklyReview, setWeeklyReview] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', text: 'Hello Partha! I am your chief of staff. I have synced your commitments and calendar. How can we optimize your roadmap today?', timestamp: new Date().toISOString() }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'goals' | 'calendar' | 'commitments' | 'insights'>('dashboard');
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem('motive_sidebar_collapsed') === 'true';
  });

  const setIsSidebarCollapsed = (isCollapsed: boolean) => {
    setIsSidebarCollapsedState(isCollapsed);
    localStorage.setItem('motive_sidebar_collapsed', String(isCollapsed));
  };

  // Initialize and Subscribe to Repositories
  useEffect(() => {
    // Check local storage for initial preferences or set cloud defaults if firebase-applet-config is loaded
    if (!localStorage.getItem('motive_initialized')) {
      // Seed default mock goals and commitments for standard preview on first load
      seedDefaultDemoData();
      localStorage.setItem('motive_initialized', 'true');
    }

    // Subscribe to Goal Repository
    const unsubGoals = GoalRepository.subscribeGoals(userId, (newGoals) => {
      setGoals(newGoals);
    });

    // Subscribe to Commitment Repository
    const unsubCommitments = CommitmentRepository.subscribeCommitments(userId, (newComms) => {
      setCommitments(newComms);
    });

    // Subscribe to Relationship Repository
    const unsubRels = RelationshipRepository.subscribeRelationships(userId, (newRels) => {
      setRelationships(newRels);
    });

    // Subscribe to Recommendation Repository
    const unsubRecs = RecommendationRepository.subscribeRecommendations(userId, (newRecs) => {
      setRecommendations(newRecs);
    });

    // Subscribe to Timeline Repository
    const unsubTimeline = TimelineRepository.subscribeTimeline(userId, (newTimeline) => {
      setTimeline(newTimeline);
    });

    // Subscribe to Artifact Repository
    const unsubArtifacts = ArtifactRepository.subscribeArtifacts(userId, (newArts) => {
      setArtifacts(newArts);
    });

    // Load User Settings
    SettingsRepository.getSettings(userId).then(s => {
      setSettings(s);
      applyTheme(s.theme);
    });

    // Listen for setting changes
    const onSettingsUpdate = () => {
      SettingsRepository.getSettings(userId).then(s => {
        setSettings(s);
        applyTheme(s.theme);
      });
    };
    window.addEventListener('motive_settings_updated', onSettingsUpdate);

    return () => {
      unsubGoals();
      unsubCommitments();
      unsubRels();
      unsubRecs();
      unsubTimeline();
      unsubArtifacts();
      window.removeEventListener('motive_settings_updated', onSettingsUpdate);
    };
  }, [userId]);

  // Recalculate and generate daily brief or recommendations when goals / commitments load
  useEffect(() => {
    if (goals.length > 0) {
      // Generate daily brief
      fetchDailyBrief();
      // Generate weekly review
      fetchWeeklyReview();
    }
  }, [goals, commitments]);

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

  const seedDefaultDemoData = () => {
    // 1. Initial Goals
    const now = new Date();
    
    // France Visa Goal
    const visaDeadline = new Date();
    visaDeadline.setDate(now.getDate() + 20); // 20 days away
    const visaGoal: Goal = {
      id: 'g-france-visa',
      userId: DEFAULT_USER_ID,
      title: 'Get France Visa',
      description: 'Prepare documents, scan passports, and attend consulate interview to get Schengen visa.',
      deadline: visaDeadline.toISOString().split('T')[0],
      momentum: 75,
      risk: 'MEDIUM',
      status: 'ACTIVE',
      area: 'Travel',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Promotion Goal
    const promoDeadline = new Date();
    promoDeadline.setDate(now.getDate() + 60); // 60 days away
    const promoGoal: Goal = {
      id: 'g-promotion',
      userId: DEFAULT_USER_ID,
      title: 'Prepare for Promotion',
      description: 'Review roadmap, complete system design reviews, update achievements tracker, and practice presentations.',
      deadline: promoDeadline.toISOString().split('T')[0],
      momentum: 40,
      risk: 'LOW',
      status: 'PLANNING',
      area: 'Career',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    localStorage.setItem(`motive_goals_${DEFAULT_USER_ID}`, JSON.stringify([visaGoal, promoGoal]));

    // 2. Initial Commitments
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

    const commitments: Commitment[] = [
      {
        id: 'c-passport-scan',
        userId: DEFAULT_USER_ID,
        type: 'TASK',
        title: 'Scan and Upload Passport Details',
        constraint: 'FLEXIBLE',
        origin: 'USER',
        status: 'PLANNED',
        estimatedDuration: 15,
        startTime: scanTime.toISOString(),
        endTime: scanTimeEnd.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      {
        id: 'c-bank-statement',
        userId: DEFAULT_USER_ID,
        type: 'TASK',
        title: 'Compile Bank Statements & Finances',
        constraint: 'FLEXIBLE',
        origin: 'USER',
        status: 'PLANNED',
        estimatedDuration: 45,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      {
        id: 'c-visa-app',
        userId: DEFAULT_USER_ID,
        type: 'TASK',
        title: 'Schedule Visa Appointment',
        constraint: 'FIXED',
        origin: 'USER',
        status: 'COMPLETED',
        estimatedDuration: 20,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      {
        id: 'c-sys-design',
        userId: DEFAULT_USER_ID,
        type: 'FOCUS_BLOCK',
        title: 'System Design Interview Prep',
        constraint: 'FLEXIBLE',
        origin: 'AI',
        status: 'PLANNED',
        estimatedDuration: 90,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      {
        id: 'c-team-sync',
        userId: DEFAULT_USER_ID,
        type: 'EVENT',
        title: 'Vite & React Project Team Sync',
        constraint: 'FIXED',
        origin: 'CALENDAR',
        status: 'SCHEDULED',
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
        estimatedDuration: 60,
        calendarEventId: 'cal-event-1',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ];

    localStorage.setItem(`motive_commitments_${DEFAULT_USER_ID}`, JSON.stringify(commitments));

    // 3. Initial Relationships
    const relationships: Relationship[] = [
      { id: 'r-1', userId: DEFAULT_USER_ID, goalId: 'g-france-visa', commitmentId: 'c-passport-scan', confidence: 1.0, source: 'USER', reason: 'Directly required for consulate appointment' },
      { id: 'r-2', userId: DEFAULT_USER_ID, goalId: 'g-france-visa', commitmentId: 'c-bank-statement', confidence: 0.95, source: 'AI', reason: 'Required financial support artifact' },
      { id: 'r-3', userId: DEFAULT_USER_ID, goalId: 'g-france-visa', commitmentId: 'c-visa-app', confidence: 1.0, source: 'USER', reason: 'Unlocks actual visa processing' },
      { id: 'r-4', userId: DEFAULT_USER_ID, goalId: 'g-promotion', commitmentId: 'c-sys-design', confidence: 0.9, source: 'AI', reason: 'Required technical validation review' }
    ];
    localStorage.setItem(`motive_relationships_${DEFAULT_USER_ID}`, JSON.stringify(relationships));

    // 4. Initial Timeline entries
    const timeline: TimelineEntry[] = [
      { id: 't-1', userId: DEFAULT_USER_ID, type: 'GOAL_CREATED', entityId: 'g-france-visa', summary: 'Established new Travel goal: "Get France Visa" with target of July 15.', createdAt: now.toISOString() },
      { id: 't-2', userId: DEFAULT_USER_ID, type: 'COMMITMENT_COMPLETED', entityId: 'c-visa-app', summary: 'Successfully scheduled official Visa consulate appointment.', createdAt: now.toISOString() }
    ];
    localStorage.setItem(`motive_timeline_${DEFAULT_USER_ID}`, JSON.stringify(timeline));

    // 5. Initial Recommendations
    const recommendations: Recommendation[] = [
      {
        id: 'rec-1',
        userId: DEFAULT_USER_ID,
        title: 'Upload Passport Details',
        reason: 'Unlocks consulate schedule flow. Completing your scanned copy today prevents a critical bottleneck for your France Visa.',
        impact: '+12 Momentum',
        confidence: 94,
        estimatedMinutes: 15,
        goalId: 'g-france-visa',
        status: 'ACTIVE',
        createdAt: now.toISOString()
      }
    ];
    localStorage.setItem(`motive_recommendations_${DEFAULT_USER_ID}`, JSON.stringify(recommendations));
  };

  const fetchDailyBrief = async () => {
    try {
      const res = await fetch('/api/ai/daily-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals, commitments })
      });
      if (res.ok) {
        const brief = await res.json();
        setDailyBrief(brief);
      }
    } catch (e) {
      console.error("Failed to fetch daily brief", e);
    }
  };

  const fetchWeeklyReview = async () => {
    try {
      const res = await fetch('/api/ai/weekly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals, commitments })
      });
      if (res.ok) {
        const review = await res.json();
        setWeeklyReview(review);
      }
    } catch (e) {
      console.error("Failed to fetch weekly review", e);
    }
  };

  // Actions implementation
  const addGoal = async (title: string, description: string, deadline: string, area: string, customCommitments?: Commitment[]): Promise<Goal> => {
    const freshGoal = await GoalRepository.createGoal({
      userId,
      title,
      description,
      deadline,
      momentum: 40,
      risk: 'LOW',
      status: 'PLANNING',
      area
    });

    // Create a timeline entry
    await TimelineRepository.createTimelineEntry({
      userId,
      type: 'GOAL_CREATED',
      entityId: freshGoal.id,
      summary: `Created active Goal: "${title}" in category "${area}".`
    });

    // Check if we have pre-designed custom commitments
    if (customCommitments && customCommitments.length > 0) {
      const idMap: { [key: string]: string } = {};

      try {
        // 1. Create all commitments first and build the id mapping
        for (const comm of customCommitments) {
          const freshComm = await CommitmentRepository.createCommitment({
            userId,
            type: comm.type,
            title: comm.title,
            constraint: comm.constraint,
            origin: 'USER',
            status: comm.status || 'PLANNED',
            estimatedDuration: comm.estimatedDuration
          });
          idMap[comm.id] = freshComm.id;
        }

        // 2. Link them via Relationships to the goal AND update their dependsOn field with the mapped real IDs
        for (const comm of customCommitments) {
          const realId = idMap[comm.id];
          if (!realId) continue;
          
          // Map dependsOn IDs
          const mappedDependsOn = comm.dependsOn?.map(oldId => idMap[oldId]).filter(Boolean) as string[] || [];
          if (mappedDependsOn.length > 0) {
            await CommitmentRepository.updateCommitment(userId, realId, { dependsOn: mappedDependsOn });
          }

          await RelationshipRepository.createRelationship(
            userId,
            freshGoal.id,
            realId,
            1.0,
            'USER',
            'Defined via interactive execution graph'
          );
        }

        // Add to timeline
        await TimelineRepository.createTimelineEntry({
          userId,
          type: 'RELATIONSHIP_ADDED',
          entityId: freshGoal.id,
          summary: `Created custom execution plan with ${customCommitments.length} interactive dependencies.`
        });
      } catch (e) {
        console.error("Failed to save custom commitments and dependencies", e);
      }
    } else {
      // Request AI expansion/planning from express backend
      try {
        const res = await fetch('/api/ai/plan-goal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goalTitle: title, description, deadline, area })
        });
        if (res.ok) {
          const data = await res.json();
          
          // Add AI commitments and link them via Relationships
          for (const comm of data.commitments) {
            const freshComm = await CommitmentRepository.createCommitment({
              userId,
              type: comm.type,
              title: comm.title,
              constraint: comm.constraint,
              origin: 'AI',
              status: 'PLANNED',
              estimatedDuration: comm.estimatedDuration
            });

            await RelationshipRepository.createRelationship(
              userId,
              freshGoal.id,
              freshComm.id,
              0.9,
              'AI',
              'Discovered during goal definition expansion'
            );
          }

          // Add to timeline
          await TimelineRepository.createTimelineEntry({
            userId,
            type: 'RELATIONSHIP_ADDED',
            entityId: freshGoal.id,
            summary: `Motive AI auto-expanded "${title}" into ${data.commitments.length} structured commitments.`
          });
        }
      } catch (e) {
        console.error("Failed to auto-expand goal commitments", e);
      }
    }

    generateNewRecommendation();
    return freshGoal;
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    await GoalRepository.updateGoal(userId, id, updates);
    generateNewRecommendation();
  };

  const deleteGoal = async (id: string) => {
    await GoalRepository.deleteGoal(userId, id);
    generateNewRecommendation();
  };

  const addCommitment = async (commitment: Omit<Commitment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, goalId?: string): Promise<Commitment> => {
    const comm = await CommitmentRepository.createCommitment({
      ...commitment,
      userId
    });
    
    await TimelineRepository.createTimelineEntry({
      userId,
      type: 'COMMITMENT_CREATED',
      entityId: comm.id,
      summary: `Manually added commitment "${comm.title}".`
    });

    if (goalId) {
      await RelationshipRepository.createRelationship(
        userId,
        goalId,
        comm.id,
        1.0,
        'USER',
        'Manually linked commitment to goal during creation'
      );
      
      // Update goal momentum/risk immediately
      const currentGoal = goals.find(g => g.id === goalId);
      if (currentGoal) {
        const currentRels = await RelationshipRepository.getRelationships(userId);
        const freshComms = await CommitmentRepository.getCommitments(userId);
        const progress = BusinessEngine.calculateGoalProgress(goalId, freshComms, currentRels);
        const momentum = BusinessEngine.calculateGoalMomentum(goalId, freshComms, currentRels);
        const risk = BusinessEngine.calculateGoalRisk(currentGoal, freshComms, currentRels);
        await GoalRepository.updateGoal(userId, goalId, { momentum, risk });
      }
    }

    generateNewRecommendation();
    return comm;
  };

  const updateCommitment = async (id: string, updates: Partial<Commitment>) => {
    await CommitmentRepository.updateCommitment(userId, id, updates);
    
    // Recalculate deterministic Goal properties (Momentum, Progress, Risk) based on changed commitments
    const currentRels = await RelationshipRepository.getRelationships(userId);
    const linkedGoalIds = currentRels.filter(r => r.commitmentId === id).map(r => r.goalId);

    const freshComms = await CommitmentRepository.getCommitments(userId);
    
    for (const gId of linkedGoalIds) {
      const currentGoal = goals.find(g => g.id === gId);
      if (currentGoal) {
        const progress = BusinessEngine.calculateGoalProgress(gId, freshComms, currentRels);
        const momentum = BusinessEngine.calculateGoalMomentum(gId, freshComms, currentRels);
        const risk = BusinessEngine.calculateGoalRisk(currentGoal, freshComms, currentRels);
        
        await GoalRepository.updateGoal(userId, gId, { 
          momentum, 
          risk,
          status: progress === 100 ? 'COMPLETED' : currentGoal.status
        });
      }
    }

    generateNewRecommendation();
  };

  const deleteCommitment = async (id: string) => {
    const target = commitments.find(c => c.id === id);
    if (target && target.status === 'CANCELLED') {
      await CommitmentRepository.deleteCommitment(userId, id);
    } else {
      await updateCommitment(id, { status: 'CANCELLED' });
    }
    generateNewRecommendation();
  };

  const toggleCommitmentComplete = async (id: string) => {
    const target = commitments.find(c => c.id === id);
    if (!target) return;

    const newStatus = target.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';
    await updateCommitment(id, { status: newStatus });

    if (newStatus === 'COMPLETED') {
      await TimelineRepository.createTimelineEntry({
        userId,
        type: 'COMMITMENT_COMPLETED',
        entityId: id,
        summary: `Marked commitment "${target.title}" as completed.`
      });
    }
  };

  const acceptRecommendation = async (rec: Recommendation) => {
    // Complete the associated commitment or goal
    const matchedCommitment = commitments.find(c => c.title.toLowerCase().includes(rec.title.split(' ')[0].toLowerCase()));
    
    if (matchedCommitment) {
      await toggleCommitmentComplete(matchedCommitment.id);
    }

    // Update recommendation status
    await RecommendationRepository.updateRecommendation(userId, rec.id, { status: 'ACCEPTED' });

    await TimelineRepository.createTimelineEntry({
      userId,
      type: 'RECOMMENDATION_ACCEPTED',
      entityId: rec.id,
      summary: `Accepted top recommendation: "${rec.title}".`
    });

    generateNewRecommendation();
  };

  const dismissRecommendation = async (id: string) => {
    await RecommendationRepository.updateRecommendation(userId, id, { status: 'DISMISSED' });
    generateNewRecommendation();
  };

  const generateNewRecommendation = async () => {
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals, commitments })
      });
      if (res.ok) {
        const data = await res.json();
        
        // Archive older recommendations and add new one
        const active = recommendations.filter(r => r.status === 'ACTIVE');
        for (const act of active) {
          await RecommendationRepository.updateRecommendation(userId, act.id, { status: 'DISMISSED' });
        }

        await RecommendationRepository.createRecommendation({
          userId,
          title: data.title,
          reason: data.reason,
          impact: data.impact,
          confidence: data.confidence,
          estimatedMinutes: data.estimatedMinutes,
          goalId: data.goalId,
          status: 'ACTIVE'
        });
      }
    } catch (e) {
      console.error("Failed to generate recommendation", e);
    }
  };

  const acceptArtifact = async (art: Artifact) => {
    // 1. Convert discovered artifact into a solid commitment
    const commType = art.type === 'EMAIL' ? 'TASK' : 'EVENT';
    const freshComm = await CommitmentRepository.createCommitment({
      userId,
      type: commType,
      title: art.title,
      constraint: 'FLEXIBLE',
      origin: art.source === 'GMAIL' ? 'GMAIL' : 'CALENDAR',
      status: 'PLANNED',
      estimatedDuration: 30
    });

    // 2. Link to suggested goal if present
    if (art.suggestedGoalId) {
      await RelationshipRepository.createRelationship(
        userId,
        art.suggestedGoalId,
        freshComm.id,
        art.confidence || 0.9,
        'AI',
        `Discovered from ${art.source}: "${art.summary}"`
      );
    }

    // 3. Mark artifact as accepted
    await ArtifactRepository.updateArtifact(userId, art.id, { status: 'ACCEPTED' });

    await TimelineRepository.createTimelineEntry({
      userId,
      type: 'RELATIONSHIP_ADDED',
      entityId: freshComm.id,
      summary: `Approved discovery queue item: "${art.title}" linked to active goal.`
    });

    generateNewRecommendation();
  };

  const dismissArtifact = async (id: string) => {
    await ArtifactRepository.updateArtifact(userId, id, { status: 'DISMISSED' });
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    const currentSettings = settings || {
      userId,
      theme: 'LIGHT',
      calendarSync: true,
      gmailSync: true,
      focusBlockSync: true,
      notifications: true
    };
    const updated = { ...currentSettings, ...updates };
    setSettings(updated);
    applyTheme(updated.theme);
    await SettingsRepository.updateSettings(userId, updates);
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
        body: JSON.stringify({ message: text, history: chatMessages, goals, commitments })
      });
      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: 'ai',
          text: data.text,
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

  const syncGoogleCalendar = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/calendar');
      if (res.ok) {
        const events = await res.json();
        
        let importedCount = 0;
        for (const ev of events) {
          // Check if already exists to prevent duplicate insertion
          const exists = commitments.some(c => c.title === ev.title && c.startTime === ev.startTime);
          if (!exists) {
            await CommitmentRepository.createCommitment({
              userId,
              type: ev.type,
              title: ev.title,
              constraint: ev.constraint,
              origin: ev.origin,
              status: ev.status,
              startTime: ev.startTime,
              endTime: ev.endTime,
              estimatedDuration: ev.estimatedDuration
            });
            importedCount++;
          }
        }

        if (importedCount > 0) {
          await TimelineRepository.createTimelineEntry({
            userId,
            type: 'CALENDAR_IMPORTED',
            entityId: userId,
            summary: `Google Calendar synced. Discovered & imported ${importedCount} upcoming events.`
          });
        }
      }
    } catch (e) {
      console.error("Calendar sync failure", e);
    } finally {
      setIsSyncing(false);
      generateNewRecommendation();
    }
  };

  const syncGmail = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/gmail');
      if (res.ok) {
        const emails = await res.json();
        let queueCount = 0;

        for (const mail of emails) {
          const exists = artifacts.some(a => a.title === mail.title);
          if (!exists) {
            // Automatically suggest relating to France Visa goal or Career goal based on text
            let suggestedGoalId = '';
            if (mail.category.toLowerCase().includes('visa')) {
              suggestedGoalId = goals.find(g => g.title.toLowerCase().includes('visa'))?.id || '';
            } else if (mail.category.toLowerCase().includes('interview')) {
              suggestedGoalId = goals.find(g => g.title.toLowerCase().includes('interview'))?.id || '';
            }

            await ArtifactRepository.createArtifact({
              userId,
              type: mail.type,
              source: mail.source,
              title: mail.title,
              summary: mail.summary,
              receivedAt: mail.receivedAt,
              link: mail.link,
              category: mail.category,
              confidence: mail.confidence,
              suggestedGoalId,
              status: 'PENDING'
            });
            queueCount++;
          }
        }

        if (queueCount > 0) {
          await TimelineRepository.createTimelineEntry({
            userId,
            type: 'EMAIL_DISCOVERED',
            entityId: userId,
            summary: `GMail synced. Extracted ${queueCount} critical action items into the discovery review queue.`
          });
        }
      }
    } catch (e) {
      console.error("GMail sync failure", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearAllData = () => {
    localStorage.removeItem(`motive_goals_${userId}`);
    localStorage.removeItem(`motive_commitments_${userId}`);
    localStorage.removeItem(`motive_relationships_${userId}`);
    localStorage.removeItem(`motive_timeline_${userId}`);
    localStorage.removeItem(`motive_recommendations_${userId}`);
    localStorage.removeItem(`motive_artifacts_${userId}`);
    localStorage.removeItem('motive_initialized');
    window.location.reload();
  };

  return (
    <MotiveContext.Provider value={{
      userId,
      userProfile,
      goals,
      commitments,
      relationships,
      recommendations,
      timeline,
      artifacts,
      settings,
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
      syncGmail,
      generateNewRecommendation,
      clearAllData
    }}>
      {children}
    </MotiveContext.Provider>
  );
};

export const useMotive = () => {
  const context = useContext(MotiveContext);
  if (context === undefined) {
    throw new Error('useMotive must be used within a MotiveProvider');
  }
  return context;
};
