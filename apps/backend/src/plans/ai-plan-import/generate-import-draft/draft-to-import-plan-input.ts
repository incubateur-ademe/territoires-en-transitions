import { ImportPlanInput } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.input';
import { extractedActionToImportActions } from '../adapters/extracted-action-to-import-action';
import { ExtractedAction } from '../models/extracted-action';

export const draftToImportPlanInput = (input: {
  actions: ExtractedAction[];
  planName: string;
  planType?: number;
}): ImportPlanInput => ({
  nom: input.planName,
  typeId: input.planType,
  actions: input.actions.flatMap(extractedActionToImportActions),
});
