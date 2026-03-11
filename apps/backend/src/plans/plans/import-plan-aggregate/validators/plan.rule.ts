import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { ImportPlanInput } from '../import-plan.input';
import {
  ImportErrors,
  InvalidPlanType,
  ParentActionNotFound,
} from '../import.errors';
import {
  ImportActionOrSousAction,
  isSousAction,
} from '../schemas/import-action.input';
import { getActionKey } from '../../create-plan-aggregate/create-plan-aggregate.rule';
import { validateAction } from './action.validator';

const validateParentActionsExist = (
  actions: ImportActionOrSousAction[]
): Result<true, ImportErrors> => {
  const normalActionKeys = new Set(
    actions
      .filter((a) => !isSousAction(a))
      .map((a) => getActionKey(a.titre, a.axisPath))
  );

  const missingSousActions = actions
    .filter(isSousAction)
    .filter(
      (a) =>
        !normalActionKeys.has(getActionKey(a.parentActionTitre, a.axisPath))
    );

  if (missingSousActions.length > 0) {
    return failure(
      new ParentActionNotFound(missingSousActions)
    );
  }

  return success(true);
};

export function validateImportPlanInput(
  plan: ImportPlanInput
): Result<true, ImportErrors> {
  if (
    plan.typeId !== undefined &&
    (!Number.isInteger(plan.typeId) || plan.typeId < 0)
  ) {
    return failure(new InvalidPlanType(plan.typeId));
  }

  const actionResults = plan.actions.map((action) => validateAction(action));
  const actionValidation = combineResults(actionResults);
  if (!actionValidation.success) {
    return failure(actionValidation.error);
  }

  const parentValidation = validateParentActionsExist(plan.actions);
  if (!parentValidation.success) {
    return parentValidation;
  }

  return success(true);
}
