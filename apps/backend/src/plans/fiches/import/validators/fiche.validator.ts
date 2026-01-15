import {
  ImportErrors,
  InvalidBudget,
  InvalidDateRange,
  InvalidFicheTitre,
} from '@tet/backend/plans/fiches/import/import.errors';
import { FicheImport } from '@tet/backend/plans/fiches/import/schemas/fiche-import.schema';
import { Result, failure, success } from '@tet/backend/shared/types/result';
import { isNil } from 'es-toolkit';

const validateBasicFields = (
  fiche: FicheImport
): Result<true, ImportErrors> => {
  // Title validation
  if (!fiche.titre?.trim()) {
    return failure(new InvalidFicheTitre(fiche.titre || ''));
  }

  // Date validation
  if (fiche.dateDebut && fiche.dateFin && fiche.dateDebut > fiche.dateFin) {
    return failure(new InvalidDateRange(fiche.dateDebut, fiche.dateFin));
  }

  // Budget validation
  if (isNil(fiche.budget) === false && fiche.budget < 0) {
    return failure(
      new InvalidBudget(fiche.budget, 'Le budget ne peut pas être négatif')
    );
  }

  return success(true);
};

export async function validateFiche(
  fiche: FicheImport
): Promise<Result<void, ImportErrors>> {
  const basicResult = validateBasicFields(fiche);
  if (!basicResult.success) return basicResult;

  return success(undefined);
}
