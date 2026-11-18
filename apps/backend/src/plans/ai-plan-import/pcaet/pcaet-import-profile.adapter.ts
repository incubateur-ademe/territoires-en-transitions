import { Injectable } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { AiPlanImportProfileEnum, PlanType } from '@tet/domain/plans';
import { AiPlanImportError } from '../ai-plan-import.errors';
import { resolveImportProfile } from '../models/import-profile';
import { DocumentImportProfileAdapter } from '../validate-import-profile/document-import-profile.adapter';
import {
  ImportAdmission,
  ImportAdmissionInput,
} from '../validate-import-profile/import-admission.types';
import { PcaetImportRules } from './pcaet-import.rules';

/** Règles du profil PCAET, partagées par les capacités et le lancement. */
@Injectable()
export class PcaetImportProfileAdapter extends DocumentImportProfileAdapter {
  readonly profile = AiPlanImportProfileEnum.PCAET;

  appliesTo(planType: PlanType): boolean {
    return PcaetImportRules.appliesTo(planType);
  }

  async authorizeAdmission({
    options,
    planType,
  }: ImportAdmissionInput): Promise<
    Result<ImportAdmission, AiPlanImportError>
  > {
    if (resolveImportProfile(options.profile) !== this.profile)
      return failure('UNKNOWN_IMPORT_PROFILE');
    if (options.planType !== undefined && !planType)
      return failure('UNKNOWN_PLAN_TYPE');
    if (!planType || !this.appliesTo(planType))
      return failure('IMPORT_PROFILE_PLAN_TYPE_MISMATCH');
    return success(this.admit(options, { withSecteurs: true }));
  }
}
