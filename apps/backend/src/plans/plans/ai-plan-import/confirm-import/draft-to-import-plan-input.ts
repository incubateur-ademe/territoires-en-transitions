import { ImportPlanInput } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.input';
import { validateAction } from '@tet/backend/plans/plans/import-plan-aggregate/validators/action.validator';
import { extractedActionToImportActions } from '../adapters/extracted-action-to-import-action';
import { ExtractedAction } from '../models/extracted-action';

export type LineValidationError = {
  actionIndex: number;
  titre: string;
  message: string;
};

export const draftToImportPlanInput = (input: {
  actions: ExtractedAction[];
  planName: string;
  planType?: number;
}): ImportPlanInput => ({
  nom: input.planName,
  typeId: input.planType,
  actions: input.actions.flatMap(extractedActionToImportActions),
});

export const draftValidationErrors = (
  actions: ExtractedAction[]
): LineValidationError[] =>
  actions.flatMap((action, actionIndex) =>
    extractedActionToImportActions(action)
      .map((row) => validateAction(row))
      .flatMap((result) =>
        result.success
          ? []
          : [{ actionIndex, titre: action.titre, message: result.error.message }]
      )
  );
