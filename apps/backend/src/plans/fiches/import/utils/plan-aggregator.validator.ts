import { PlanImport } from '@/backend/plans/fiches/import/import-plan.dto';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@/backend/plans/fiches/import/types/result';
import {
  ValidationError,
  ValidationErrorCode,
} from '@/backend/plans/fiches/import/types/validation-error';
import { validateFiche } from './fiche-validator';

function validatePlanData(plan: PlanImport): Result<true, ValidationError> {
  if (
    plan.typeId !== undefined &&
    (!Number.isInteger(plan.typeId) || plan.typeId < 0)
  ) {
    return failure({
      code: ValidationErrorCode.INVALID_PLAN_TYPE,
      message: 'Le type de plan est invalide',
      field: 'typeId',
      details: { providedType: plan.typeId },
    });
  }

  return success(true);
}

export async function validatePlan(
  plan: PlanImport
): Promise<Result<true, ValidationError>> {
  const planValidation = validatePlanData(plan);
  if (!planValidation.success) {
    return planValidation;
  }

  // Validate fiches
  const ficheResults = await Promise.all(
    plan.fiches.map((fiche) => validateFiche(fiche))
  );
  const ficheValidation = combineResults(ficheResults);
  if (!ficheValidation.success) {
    return failure(ficheValidation.error);
  }

  return success(true);
}
