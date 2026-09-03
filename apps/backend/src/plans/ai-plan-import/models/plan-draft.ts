import { ExtractedAction } from './extracted-action';

export type PlanDraft = {
  actions: ExtractedAction[];
  qualitativeReview: string | null;
};
