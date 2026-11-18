import { Injectable } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { AiPlanImportProfileEnum } from '@tet/domain/plans';
import { AiPlanImportError } from '../ai-plan-import.errors';
import { resolveImportProfile } from '../models/import-profile';
import { PcaetImportRules } from '../pcaet/pcaet-import.rules';
import { DocumentImportProfileAdapter } from '../validate-import-profile/document-import-profile.adapter';
import {
  ImportAdmission,
  ImportAdmissionInput,
} from '../validate-import-profile/import-admission.types';

/** Profil de repli : tout type de plan qui n'impose pas son propre parcours. */
@Injectable()
export class GenericImportProfileAdapter extends DocumentImportProfileAdapter {
  readonly profile = AiPlanImportProfileEnum.GENERIC;

  /** Ne revendique aucun type : un type sans profil dédié arrive ici. */
  appliesTo(): boolean {
    return false;
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
    // Un PCAET importé par ce profil (anciens clients) garde ses secteurs.
    const withSecteurs =
      planType !== undefined && PcaetImportRules.appliesTo(planType);
    return success(this.admit(options, { withSecteurs }));
  }
}
