import { FicheImport } from '@/backend/plans/fiches/import/schemas/fiche-import.schema';
import {
  ValidationError,
  ValidationErrorCode,
} from '@/backend/plans/fiches/import/types/validation-error';
import { Result, failure, success } from '@/backend/shared/types/result';

/**
 * Validate basic fields (title, dates, budget)
 */
const validateBasicFields = (
  fiche: FicheImport
): Result<true, ValidationError> => {
  const validations = [
    // Title validation
    !fiche.titre?.trim() && {
      code: ValidationErrorCode.INVALID_FICHE_TITLE,
      message: 'Le titre de la fiche est obligatoire',
      field: 'titre',
    },
    // Date validation
    fiche.dateDebut &&
      fiche.dateFin &&
      fiche.dateDebut > fiche.dateFin && {
        code: ValidationErrorCode.INVALID_DATE_RANGE,
        message: 'La date de début doit être antérieure à la date de fin',
        field: 'dateDebut',
        details: { dateDebut: fiche.dateDebut, dateFin: fiche.dateFin },
      },
    // Budget validation
    fiche.budget !== undefined &&
      fiche.budget < 0 && {
        code: ValidationErrorCode.INVALID_BUDGET,
        message: 'Le budget ne peut pas être négatif',
        field: 'budget',
        details: { providedBudget: fiche.budget },
      },
  ];

  const error = validations.find(Boolean);
  return error ? failure(error) : success(true);
};

export async function validateFiche(
  fiche: FicheImport
): Promise<Result<void, ValidationError>> {
  const basicResult = validateBasicFields(fiche);
  if (!basicResult.success) return basicResult;

  return success(undefined);
}
