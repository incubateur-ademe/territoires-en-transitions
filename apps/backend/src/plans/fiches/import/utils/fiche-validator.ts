import { TagEnum } from '@/backend/collectivites/tags/tag.table-base';
import { FicheImport } from '@/backend/plans/fiches/import/schemas/import.schema';
import {
  Result,
  failure,
  success,
} from '@/backend/plans/fiches/import/types/result';
import {
  ValidationError,
  ValidationErrorCode,
} from '@/backend/plans/fiches/import/types/validation-error';
import { ValidationContext } from './validation-context';

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

/**
 * Validate members (pilotes or referents)
 */
const validateMembers = async (
  members: Array<string> | undefined,
  context: ValidationContext,
  errorCode: ValidationErrorCode,
  field: string
): Promise<Result<true, ValidationError>> => {
  if (members?.length === 0) return success(true);

  const validUserIds = members
    .map((m) => m.userId)
    .filter((id): id is string => typeof id === 'string');

  const memberResults = await Promise.all(
    validUserIds.map((id) => context.getMemberId(id))
  );

  const isValid = memberResults.every(
    (result) => result.success && result.data
  );
  return isValid
    ? success(undefined)
    : failure({
        code: errorCode,
        message: `Un ou plusieurs ${field} sont invalides`,
        field,
      });
};

interface TagValidationParams {
  tags: { nom: string }[] | undefined;
  context: ValidationContext;
  tagType: (typeof TagEnum)[keyof typeof TagEnum];
  errorCode: ValidationErrorCode;
  field: string;
}

/**
 * Validate tags (structures, services, financeurs)
 */
const validateTags = async ({
  tags,
  context,
  tagType,
  errorCode,
  field,
}: TagValidationParams): Promise<Result<void, ValidationError>> => {
  if (!tags?.length) return success(undefined);

  const tagResults = await Promise.all(
    tags.map((tag) => context.hasTag(tag.nom, tagType))
  );

  const isValid = tagResults.every((result) => result.success && result.data);
  return isValid
    ? success(undefined)
    : failure({
        code: errorCode,
        message: `Un ou plusieurs ${field} sont invalides`,
        field,
      });
};

/**
 * Validate all aspects of a fiche
 */
export async function validateFiche(
  fiche: FicheImport,
  context: ValidationContext
): Promise<Result<void, ValidationError>> {
  try {
    // Validate basic fields first
    const basicResult = validateBasicFields(fiche);
    if (!basicResult.success) return basicResult;

    // Define all reference validations
    const referenceValidations = [
      // Members
      validateMembers(
        fiche.pilotes,
        context,
        ValidationErrorCode.INVALID_PILOTE,
        'pilotes'
      ),
      validateMembers(
        fiche.referents,
        context,
        ValidationErrorCode.INVALID_REFERENT,
        'referents'
      ),
      // Tags
      validateTags({
        tags: fiche.structures,
        context,
        tagType: TagEnum.Structure,
        errorCode: ValidationErrorCode.INVALID_STRUCTURE,
        field: 'structures',
      }),
      validateTags({
        tags: fiche.services,
        context,
        tagType: TagEnum.Service,
        errorCode: ValidationErrorCode.INVALID_SERVICE,
        field: 'services',
      }),
      validateTags({
        tags: fiche.financeurs?.map((f) => f.nom),
        context,
        tagType: TagEnum.Financeur,
        errorCode: ValidationErrorCode.INVALID_FINANCEUR,
        field: 'financeurs',
      }),
    ];

    const results = await Promise.all(referenceValidations);
    const error = results.find((result) => !result.success);
    return error || success(undefined);
  } catch (error) {
    return failure({
      code: ValidationErrorCode.UNKNOWN_ERROR,
      message: `Erreur lors de la validation de la fiche : ${error}`,
    });
  }
}
