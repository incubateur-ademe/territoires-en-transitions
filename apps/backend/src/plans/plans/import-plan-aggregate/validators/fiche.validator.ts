import { Result, failure, success } from '@tet/backend/utils/result.type';
import { isNil } from 'es-toolkit';
import {
  ImportErrors,
  InvalidBudget,
  InvalidDateRange,
  InvalidFicheTitre,
} from '../import.errors';
import { ImportFicheInput } from '../schemas/import-fiche.input';

const validateBasicFields = (
  fiche: ImportFicheInput
): Result<true, ImportErrors> => {
  if (!fiche.titre?.trim()) {
    return failure(new InvalidFicheTitre(fiche.titre || ''));
  }

  if (fiche.dateDebut && fiche.dateFin && fiche.dateDebut > fiche.dateFin) {
    return failure(new InvalidDateRange(fiche.dateDebut, fiche.dateFin));
  }

  if (isNil(fiche.budget) === false && fiche.budget < 0) {
    return failure(
      new InvalidBudget(fiche.budget, 'Le budget ne peut pas être négatif')
    );
  }

  return success(true);
};

export async function validateFiche(
  fiche: ImportFicheInput
): Promise<Result<void, ImportErrors>> {
  const basicResult = validateBasicFields(fiche);
  if (!basicResult.success) return basicResult;

  return success(undefined);
}
