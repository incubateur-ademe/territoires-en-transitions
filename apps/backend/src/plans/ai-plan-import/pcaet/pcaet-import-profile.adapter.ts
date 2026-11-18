import { Injectable } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { AiPlanImportProfileEnum, PlanType } from '@tet/domain/plans';
import { AiPlanImportError } from '../ai-plan-import.errors';
import {
  GENERIC_IMPORT_CONTRACT_VERSION,
  resolveImportProfile,
} from '../models/import-profile';
import {
  isSupportedGenericImport,
  parseImportCheckpoint,
  type ImportCheckpoint,
} from '../models/import-checkpoint';
import { genericImportContractSchema } from '../pipeline/pipeline-checkpoint';
import { BaseImportProfileAdapter } from '../validate-import-profile/base-import-profile.adapter';
import {
  ImportAdmission,
  ImportAdmissionInput,
} from '../validate-import-profile/import-admission.types';
import { PcaetImportRules } from './pcaet-import.rules';

/** Règles du profil PCAET, partagées par les capacités et le lancement. */
@Injectable()
export class PcaetImportProfileAdapter extends BaseImportProfileAdapter {
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
    const profile = resolveImportProfile(options.profile);
    if (profile !== this.profile && profile !== AiPlanImportProfileEnum.GENERIC)
      return failure('UNKNOWN_IMPORT_PROFILE');
    if (options.planType !== undefined && !planType)
      return failure('UNKNOWN_PLAN_TYPE');
    const isPcaet = planType !== undefined && this.appliesTo(planType);
    if (profile === AiPlanImportProfileEnum.PCAET && !isPcaet) {
      return failure('IMPORT_PROFILE_PLAN_TYPE_MISMATCH');
    }
    // Les anciens clients peuvent envoyer generic, mais le type doit être PCAET.
    if (!isPcaet) return failure('IMPORT_PLAN_TYPE_NOT_SUPPORTED');
    return success({
      options: {
        instructions: options.instructions,
        planName: options.planName,
        planType: options.planType,
        withVerifications: options.withVerifications,
        withSousActions: options.withSousActions,
        disabledFields: options.disabledFields,
        origine: options.origine,
        demarcheId: options.demarcheId,
        profile,
        contractVersion: GENERIC_IMPORT_CONTRACT_VERSION,
        catalogueVersion: null,
        withSecteurs: true,
      },
      createProvisionalPlan: true,
    });
  }

  /** Aucun prérequis supplémentaire : disponibilité, source et reprise par défaut. */
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
