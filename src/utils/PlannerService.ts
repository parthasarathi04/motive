import { GoalRepository } from '../repositories/GoalRepository';
import { CommitmentRepository } from '../repositories/CommitmentRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { PlannerResultRepository } from '../repositories/PlannerResultRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AccountRepository } from '../repositories/AccountRepository';
import { CalendarRepository } from '../repositories/CalendarRepository';
import { Planner } from './Planner';
import { PlannerResult, PlanningContext } from '../types';

export const PlannerService = {
  /**
   * Triggers a new planning cycle, calculating a fresh PlannerResult.
   * Leverages the immutable PlanningContext pattern.
   */
  async runPlanningCycle(userId: string): Promise<PlannerResult> {
    const [user, accounts, goals, commitments, calendarEvents, settings] = await Promise.all([
      UserRepository.getUser(userId),
      AccountRepository.getAccounts(userId),
      GoalRepository.getGoals(userId),
      CommitmentRepository.getCommitments(userId),
      CalendarRepository.getEvents(userId),
      SettingsRepository.getSettings(userId)
    ]);

    // Create immutable PlanningContext
    const context: PlanningContext = {
      currentUser: user,
      currentTime: new Date().toISOString(),
      connectedAccounts: accounts,
      goals,
      commitments,
      calendarEvents,
      settings
    };

    // Perform deterministic calculation using Planner
    const result = Planner.plan(context);

    // Persist PlannerResult
    await PlannerResultRepository.saveResult(userId, result);

    return result;
  }
};
