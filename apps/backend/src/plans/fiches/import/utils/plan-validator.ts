import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
import {
  AxeImport,
  PlanImport,
} from '@/backend/plans/fiches/import/import-plan.dto';
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
import { EffetAttenduService } from '@/backend/shared/effet-attendu/effet-attendu.service';
import { ThematiqueService } from '@/backend/shared/thematiques/thematique.service';
import { validateFiche } from './fiche-validator';
import { ValidationContext } from './validation-context';

/**
 * Validate plan level data
 */
function validatePlanData(plan: PlanImport): Result<void, ValidationError> {
  // Validate plan name
  if (!plan.nom?.trim()) {
    return failure({
      code: ValidationErrorCode.INVALID_PLAN_NAME,
      message: 'Le nom du plan est obligatoire',
      field: 'nom',
    });
  }

  // Validate plan type if provided
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

  return success(undefined);
}

/**
 * Validate axe data
 */
async function validateAxe(
  axe: AxeImport,
  parent: PlanImport | AxeImport,
  context: ValidationContext
): Promise<Result<void, ValidationError>> {
  try {
    // Validate axe name
    if (!axe.nom?.trim()) {
      return failure({
        code: ValidationErrorCode.MISSING_REQUIRED_FIELD,
        message: "Le nom de l'axe est obligatoire",
        field: 'nom',
      });
    }

    // Check for duplicate axes under the same parent
    const siblings = parent.enfants;
    const duplicates = Array.from(siblings).filter(
      (sibling) => sibling !== axe && sibling.nom === axe.nom
    );
    if (duplicates.length > 0) {
      return failure({
        code: ValidationErrorCode.DUPLICATE_AXE,
        message: `L'axe "${axe.nom}" existe déjà à ce niveau`,
        field: 'nom',
        details: { duplicateNames: duplicates.map((d) => d.nom) },
      });
    }

    // Validate child axes recursively
    const childResults = await Promise.all(
      Array.from(axe.enfants).map((child) => validateAxe(child, axe, context))
    );
    const childValidation = combineResults(childResults);
    if (!childValidation.success) {
      return childValidation;
    }

    // Validate fiches
    const ficheResults = await Promise.all(
      axe.fiches.map((fiche) => validateFiche(fiche, context))
    );
    const ficheValidation = combineResults(ficheResults);
    if (!ficheValidation.success) {
      return ficheValidation;
    }

    return success(undefined);
  } catch (error) {
    return failure({
      code: ValidationErrorCode.UNKNOWN_ERROR,
      message: `Erreur lors de la validation de l'axe : ${error}`,
    });
  }
}

/**
 * Validate plan data before import
 */
export async function validatePlan({
  plan,
  collectiviteId,
  memberService,
  tagService,
  thematiqueService,
  effetAttenduService,
}: {
  plan: PlanImport;
  collectiviteId: number;
  memberService: CollectiviteMembresService;
  tagService: TagService;
  thematiqueService: ThematiqueService;
  effetAttenduService: EffetAttenduService;
}): Promise<Result<void, ValidationError>> {
  const context = new ValidationContext(
    collectiviteId,
    memberService,
    tagService,
    thematiqueService,
    effetAttenduService
  );

  try {
    // Validate plan level data
    const planValidation = validatePlanData(plan);
    if (!planValidation.success) {
      return planValidation;
    }

    // Validate axes
    const axeResults = await Promise.all(
      Array.from(plan.enfants).map((axe) => validateAxe(axe, plan, context))
    );
    const axeValidation = combineResults(axeResults);
    if (!axeValidation.success) {
      return failure(axeValidation.error);
    }

    // Validate fiches
    const ficheResults = await Promise.all(
      plan.fiches.map((fiche) => validateFiche(fiche, context))
    );
    const ficheValidation = combineResults(ficheResults);
    if (!ficheValidation.success) {
      return failure(ficheValidation.error);
    }

    return success(undefined);
  } catch (error) {
    console.error('Error validating plan:', error);
    return failure({
      code: ValidationErrorCode.UNKNOWN_ERROR,
      message: `Une erreur est survenue lors de la validation : ${error}`,
    });
  }
}
