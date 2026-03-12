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
import { ImportFicheInput } from '../schemas/import-fiche.input';
import { validateFiche } from './fiche.validator';

const axisKey = (axisPath: string[] | undefined) =>
  (axisPath ?? []).join('::');

const validateParentActionsExist = (
  fiches: ImportFicheInput[]
): Result<true, ImportErrors> => {
  const normalFicheKeys = new Set(
    fiches
      .filter((f) => f.sousTitreAction == null)
      .map((f) => `${axisKey(f.axisPath)}::${f.titre}`)
  );

  const missingSousAction = fiches.find(
    (f) =>
      f.sousTitreAction != null &&
      !normalFicheKeys.has(`${axisKey(f.axisPath)}::${f.titre}`)
  );

  if (missingSousAction) {
    return failure(
      new ParentActionNotFound(
        missingSousAction.sousTitreAction ?? '',
        missingSousAction.titre
      )
    );
  }

  return success(true);
};

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

  const parentValidation = validateParentActionsExist(plan.fiches);
  if (!parentValidation.success) {
    return parentValidation;
  }

  return success(true);
}
