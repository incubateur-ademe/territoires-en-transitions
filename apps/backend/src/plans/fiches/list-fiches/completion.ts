import {
  Completion,
  FicheWithRelations,
} from './fiche-action-with-relations.dto';

type FicheWithoutCompletion = Omit<FicheWithRelations, 'completion'>;

/**
 * In october 2025, product team defined these fields have to be completed to consider a fiche as completed.
 */
const REQUIRED_FIELDS = [
  'titre',
  'description',
  'statut',
  'pilotes',
] as const satisfies Array<keyof FicheWithRelations>;

/**
 * Check the completion of a list of fiches
 * Returns for each fiche:
 * - ficheId
 * - fields: list of all required fields with their completion status
 * - isCompleted: true if all required fields are completed
 */
export function checkCompletion(
  fiches: FicheWithoutCompletion[]
): Completion[] {
  return fiches.map((fiche) => {
    const fields = REQUIRED_FIELDS.map((field) => {
      const value = fiche[field];
      const isCompleted = isFieldCompleted(value);
      return {
        field,
        isCompleted,
      };
    });

    const isCompleted = fields.every((field) => field.isCompleted);

    return {
      ficheId: fiche.id,
      fields,
      isCompleted,
    };
  });
}

/**
 * Check if a field is completed according to the defined rules
 */
export function isFieldCompleted(
  value: FicheWithoutCompletion[keyof FicheWithoutCompletion]
): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'string' && value === '') {
    return false;
  }

  return true;
}
