import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
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
import { EffetAttenduService } from '@/backend/shared/effet-attendu/effet-attendu.service';
import { ThematiqueService } from '@/backend/shared/thematiques/thematique.service';
import { uniqBy } from 'es-toolkit';
import { validateFiche } from './fiche-validator';
import { ValidationContext } from './validation-context';

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
}): Promise<Result<true, ValidationError>> {
  const axes = uniqBy(
    plan.fiches.map((fiche) => fiche.axisPath),
    (axis) => axis.join(',')
  );

  const context = new ValidationContext(
    collectiviteId,
    memberService,
    tagService,
    thematiqueService,
    effetAttenduService
  );

  const planValidation = validatePlanData(plan);
  if (!planValidation.success) {
    return planValidation;
  }

  // Validate fiches
  const ficheResults = await Promise.all(
    plan.fiches.map((fiche) => validateFiche(fiche, context))
  );
  const ficheValidation = combineResults(ficheResults);
  if (!ficheValidation.success) {
    return failure(ficheValidation.error);
  }

  return success(true);
}
