import { PlanImport } from '@tet/backend/plans/fiches/import/import-plan.dto';
import {
  ImportErrors,
  InvalidPlanType,
} from '@tet/backend/plans/fiches/import/import.errors';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/shared/types/result';
import { validateFiche } from './fiche.validator';

function validatePlanData(plan: PlanImport): Result<true, ImportErrors> {
  if (
    plan.typeId !== undefined &&
    (!Number.isInteger(plan.typeId) || plan.typeId < 0)
  ) {
    return failure(new InvalidPlanType(plan.typeId));
  }

  return success(true);
}

export async function validateImportedPlan(
  plan: PlanImport
): Promise<Result<true, ImportErrors>> {
  const planValidation = validatePlanData(plan);
  if (!planValidation.success) {
    return planValidation;
  }

  const ficheResults = await Promise.all(
    plan.fiches.map((fiche) => validateFiche(fiche))
  );
  const ficheValidation = combineResults(ficheResults);
  if (!ficheValidation.success) {
    return failure(ficheValidation.error);
  }

  return success(true);
}
