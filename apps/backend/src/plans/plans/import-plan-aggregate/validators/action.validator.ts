import { Result, failure, success } from '@tet/backend/utils/result.type';
import { isNil } from 'es-toolkit';
import {
  ImportErrors,
  InvalidActionTitre,
  InvalidBudget,
  InvalidDateRange,
} from '../import.errors';
import { ImportActionOrSousAction } from '../schemas/import-action.input';

export function validateAction(
  action: ImportActionOrSousAction
): Result<true, ImportErrors> {
  if (!action.titre?.trim()) {
    return failure(new InvalidActionTitre(action.titre || ''));
  }

  if (action.dateDebut && action.dateFin && action.dateDebut > action.dateFin) {
    return failure(new InvalidDateRange(action.dateDebut, action.dateFin));
  }

  if (isNil(action.budget) === false && action.budget < 0) {
    return failure(
      new InvalidBudget(action.budget, 'Le budget ne peut pas être négatif')
    );
  }

  const MAX_BUDGET = 999_999_999_999;
  if (isNil(action.budget) === false && action.budget > MAX_BUDGET) {
    return failure(
      new InvalidBudget(
        action.budget,
        `Le budget dépasse la valeur maximale autorisée (${MAX_BUDGET}). Vérifiez que la colonne budget ne contient pas une date ou une valeur erronée.`
      )
    );
  }
  return success(true);
}
