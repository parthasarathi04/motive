import { PlannerResult } from '../types';
import { StorageProvider } from '../lib/StorageProvider';

const COLLECTION = 'planner_results';

export const PlannerResultRepository = {
  async getResult(userId: string): Promise<PlannerResult | null> {
    return StorageProvider.getProvider().get<PlannerResult>(COLLECTION, userId);
  },

  async saveResult(userId: string, result: PlannerResult): Promise<void> {
    await StorageProvider.getProvider().set<PlannerResult>(COLLECTION, userId, result);
    window.dispatchEvent(new CustomEvent('motive_planner_result_updated', { detail: result }));
  }
};
