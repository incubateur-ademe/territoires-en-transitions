import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { ImportPlanInput } from '../import-plan.input';
import { ImportErrors, InvalidPlanType } from '../import.errors';
import { validateFiche } from './fiche.validator';

export async function validateImportPlanInput(
  plan: ImportPlanInput
): Promise<Result<true, ImportErrors>> {
  if (
    plan.typeId !== undefined &&
    (!Number.isInteger(plan.typeId) || plan.typeId < 0)
  ) {
    return failure(new InvalidPlanType(plan.typeId));
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
