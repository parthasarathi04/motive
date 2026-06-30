import { GoalService } from './GoalService';
import { CommitmentService } from './CommitmentService';
import { CalendarSyncService } from './CalendarSyncService';
import { SettingsService } from './SettingsService';
import { PlannerService } from './PlannerService';
import { PlannerResult } from '../types';

export type ActionType =
  | 'CREATE_GOAL'
  | 'UPDATE_GOAL'
  | 'DELETE_GOAL'
  | 'CREATE_COMMITMENT'
  | 'UPDATE_COMMITMENT'
  | 'DELETE_COMMITMENT'
  | 'COMPLETE_COMMITMENT'
  | 'RESCHEDULE_COMMITMENT'
  | 'SYNC_CALENDAR'
  | 'CONNECT_ACCOUNT'
  | 'DISCONNECT_ACCOUNT'
  | 'UPDATE_SETTINGS';

export interface Action {
  type: ActionType;
  payload: any;
}

export const ActionDispatcher = {
  /**
   * Dispatches and processes an Action through the execution pipeline.
   * Flow: Action -> ActionDispatcher -> Domain Service -> Planning Cycle (PlannerService) -> PlannerResult
   */
  async dispatch(userId: string, action: Action): Promise<PlannerResult> {
    const actionId = 'act-' + Math.random().toString(36).substring(2, 11);
    console.log(`[ActionDispatcher] Dispatching action: ${action.type} (${actionId})`, action.payload);

    // Route to correct domain service
    switch (action.type) {
      case 'UPDATE_SETTINGS':
        await SettingsService.updateSettings(userId, action.payload);
        break;

      case 'CREATE_GOAL':
        await GoalService.createGoal(userId, action.payload);
        break;

      case 'UPDATE_GOAL':
        await GoalService.updateGoal(userId, action.payload.id, action.payload.updates);
        break;

      case 'DELETE_GOAL':
        await GoalService.deleteGoal(userId, action.payload.id);
        break;

      case 'CREATE_COMMITMENT':
        await CommitmentService.createCommitment(userId, action.payload);
        break;

      case 'UPDATE_COMMITMENT':
        await CommitmentService.updateCommitment(userId, action.payload.id, action.payload.updates);
        break;

      case 'DELETE_COMMITMENT':
        await CommitmentService.deleteCommitment(userId, action.payload.id);
        break;

      case 'COMPLETE_COMMITMENT':
        await CommitmentService.completeCommitment(userId, action.payload.id);
        break;

      case 'RESCHEDULE_COMMITMENT':
        await CommitmentService.rescheduleCommitment(
          userId, 
          action.payload.id, 
          action.payload.scheduledStart, 
          action.payload.scheduledEnd
        );
        break;

      case 'SYNC_CALENDAR':
        await CalendarSyncService.sync(userId, action.payload?.start, action.payload?.end);
        break;

      case 'CONNECT_ACCOUNT':
        await SettingsService.connectAccount(userId, action.payload.account);
        break;

      case 'DISCONNECT_ACCOUNT':
        await SettingsService.disconnectAccount(userId, action.payload.accountId);
        break;

      default:
        throw new Error(`[ActionDispatcher] Unknown action type: ${(action as any).type}`);
    }

    // Every important Action triggers a Planning Cycle
    console.log(`[ActionDispatcher] Triggering Planning Cycle for: ${action.type}`);
    const plannerResult = await PlannerService.runPlanningCycle(userId);
    return plannerResult;
  }
};

// Compatibility export
export const Pipeline = {
  async executeCommand(userId: string, type: any, payload: any): Promise<PlannerResult> {
    return ActionDispatcher.dispatch(userId, { type: type as ActionType, payload });
  }
};
