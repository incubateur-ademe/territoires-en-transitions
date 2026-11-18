import { failure, Result, success } from '@tet/backend/utils/result.type';
import { AiPlanImportProfileEnum } from '@tet/domain/plans';
import { AiPlanImportError } from '../ai-plan-import.errors';
import { AiPlanImportJobOptions } from '../models/ai-plan-import-job';
import {
  isSupportedGenericImport,
  parseImportCheckpoint,
  type ImportCheckpoint,
} from '../models/import-checkpoint';
import {
  GENERIC_IMPORT_CONTRACT_VERSION,
  resolveImportProfile,
} from '../models/import-profile';
import { genericImportContractSchema } from '../pipeline/pipeline-checkpoint';
import { BaseImportProfileAdapter } from './base-import-profile.adapter';
import { ImportAdmission } from './import-admission.types';

/**
 * Profils servis par le moteur documentaire commun : mêmes options stockées,
 * plan créé dès l'enfilement, même contrat de reprise. Seule l'admission
 * diffère d'un profil à l'autre.
 */
export abstract class DocumentImportProfileAdapter extends BaseImportProfileAdapter {
  abstract override readonly profile:
    | typeof AiPlanImportProfileEnum.GENERIC
    | typeof AiPlanImportProfileEnum.PCAET;

  protected admit(
    options: AiPlanImportJobOptions,
    { withSecteurs }: { withSecteurs: boolean }
  ): ImportAdmission {
    return {
      options: {
        instructions: options.instructions,
        planName: options.planName,
        planType: options.planType,
        withVerifications: options.withVerifications,
        withSousActions: options.withSousActions,
        disabledFields: options.disabledFields,
        origine: options.origine,
        demarcheId: options.demarcheId,
        profile: this.profile,
        contractVersion: GENERIC_IMPORT_CONTRACT_VERSION,
        catalogueVersion: null,
        withSecteurs,
      },
      createProvisionalPlan: true,
    };
  }

  isSupportedImport(options: unknown): boolean {
    return isSupportedGenericImport(options);
  }

  parseCheckpoint(
    checkpoint: unknown,
    options: unknown
  ): Result<ImportCheckpoint, AiPlanImportError> {
    const contract = genericImportContractSchema.safeParse(options);
    const parsed = parseImportCheckpoint(checkpoint);
    return contract.success &&
      parsed.success &&
      resolveImportProfile(parsed.data.profile) ===
        resolveImportProfile(contract.data.profile)
      ? success(parsed.data)
      : failure('INVALID_CHECKPOINT');
  }
}
