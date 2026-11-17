import { electrificationImportStepStates } from '@tet/backend/plans/plans/electrification/config/electrification-import.config';
import { ElectrificationDataService } from '@tet/backend/plans/plans/electrification/publish-electrification-data/electrification-data.service';
import { Injectable } from '@nestjs/common';
import {
  CheckElectrificationEligibilityService,
  ElectrificationEligibilityDecision,
} from '@tet/backend/plans/plans/electrification/check-electrification-eligibility/check-electrification-eligibility.service';
import { ListPlanTypesService } from '@tet/backend/plans/plans/list-plan-types/list-plan-types.service';
import { CheckElectrificationCreationService } from '@tet/backend/plans/plans/electrification/check-electrification-creation.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { AiPlanImportProfileEnum, PlanType } from '@tet/domain/plans';
import { AiPlanImportError } from '../../ai-plan-import.errors';
import { DOCX_MIME } from '../../enqueue-import/detect-source-mime-type';
import {
  ImportAdmission,
  ImportAdmissionInput,
} from '../../validate-import-profile/import-admission.types';
import {
  ELECTRIFICATION_CHECKPOINT_VERSION,
  ElectrificationExtractionCheckpoint,
} from '../extract-plan/electrification-extraction-checkpoint.schema';
import { electrificationDocumentTemplate } from '@tet/backend/plans/plans/electrification/config/electrification-document-template.constants';
import { ResolveElectrificationFichesRules } from '../resolve-fiches/resolve-electrification-fiches.rules';
import { ElectrificationImportContractRules } from './electrification-import-contract.rules';
import type { ImportProfileAdapter } from '../../validate-import-profile/import-profile-adapter.interface';

type ElectrificationImportConfiguration = {
  profile: typeof AiPlanImportProfileEnum.ELECTRIFICATION;
  planType: number;
  schemaVersion: number;
  catalogueVersion: string;
  templateVersion: string;
  eligibility: ElectrificationEligibilityDecision;
};

/** Règles du profil, partagées par l'admission et la revalidation des jobs. */
@Injectable()
export class ElectrificationImportProfileAdapter
  implements ImportProfileAdapter
{
  readonly profile = AiPlanImportProfileEnum.ELECTRIFICATION;
  readonly profileMismatchError =
    'ELECTRIFICATION_REQUIRES_DEDICATED_IMPORT' as const;

  constructor(
    private readonly creation: CheckElectrificationCreationService,
    private readonly eligibility: CheckElectrificationEligibilityService,
    private readonly listPlanTypes: ListPlanTypesService,
    private readonly data: ElectrificationDataService
  ) {}

  appliesTo(planType: PlanType): boolean {
    return this.creation.appliesTo(planType);
  }

  async checkAvailability(
    input: { collectiviteId: number },
    context: ServiceSecondArg
  ): Promise<Result<void, AiPlanImportError>> {
    const configuration = await this.getAdmissionConfiguration(input, context);
    return configuration.success ? success(undefined) : configuration;
  }

  isSupportedImport(options: unknown): boolean {
    return ElectrificationImportContractRules.isSupportedImport(options);
  }

  parseCheckpoint(
    checkpoint: unknown,
    options: unknown
  ): Result<ElectrificationExtractionCheckpoint, AiPlanImportError> {
    return ElectrificationImportContractRules.parseCheckpoint(
      checkpoint,
      options
    );
  }

  private async getAdmissionConfiguration(
    input: { collectiviteId: number },
    context: ServiceSecondArg
  ): Promise<Result<ElectrificationImportConfiguration, AiPlanImportError>> {
    const configuration = await this.getConfiguration(input, context);
    if (!configuration.success) return configuration;
    const enabled = await this.creation.isEnabled(input, context);
    return enabled ? configuration : failure('IMPORT_PROFILE_UNAVAILABLE');
  }

  async authorizeAdmission(
    { collectiviteId, options }: ImportAdmissionInput,
    context: ServiceSecondArg
  ): Promise<Result<ImportAdmission, AiPlanImportError>> {
    const configuration = await this.getAdmissionConfiguration(
      { collectiviteId },
      context
    );
    if (!configuration.success) return configuration;
    if (options.planType !== configuration.data.planType) {
      return failure('UNKNOWN_PLAN_TYPE');
    }
    return success({
      options: {
        ...options,
        ...configuration.data,
        contractVersion: undefined,
        withSecteurs: false,
      },
      createProvisionalPlan: false,
      initialStepStates: { ...electrificationImportStepStates },
    });
  }

  validateSource(mimeType: string): Result<void, AiPlanImportError> {
    return mimeType === DOCX_MIME
      ? success(undefined)
      : failure('ELECTRIFICATION_REQUIRES_DOCX');
  }

  /** Une fermeture du flag ne révoque pas les jobs déjà admis. */
  async authorizeExistingImport(
    { collectiviteId, options }: ImportAdmissionInput,
    context: ServiceSecondArg
  ): Promise<Result<void, AiPlanImportError>> {
    if (!this.isSupportedImport(options) || !options.catalogueVersion)
      return failure('UNSUPPORTED_IMPORT_CONTRACT');
    const configuration = await this.getConfiguration(
      {
        collectiviteId,
        catalogueVersion: options.catalogueVersion,
      },
      context
    );
    if (!configuration.success) return configuration;
    return options.planType === configuration.data.planType
      ? success(undefined)
      : failure('UNSUPPORTED_IMPORT_CONTRACT');
  }

  private async getConfiguration(
    {
      collectiviteId,
      catalogueVersion,
    }: { collectiviteId: number; catalogueVersion?: string },
    context: ServiceSecondArg
  ): Promise<Result<ElectrificationImportConfiguration, AiPlanImportError>> {
    const eligibility = await this.eligibility.check(
      { collectiviteId },
      context
    );
    if (!eligibility.success) {
      return failure(
        eligibility.error === 'UNAUTHORIZED'
          ? 'UNAUTHORIZED'
          : 'IMPORT_PROFILE_UNAVAILABLE'
      );
    }
    if (!eligibility.data.eligible)
      return failure('IMPORT_PROFILE_UNAVAILABLE');
    const catalogue = await this.data.getCatalogue(catalogueVersion);
    if (
      !catalogue.success ||
      !ResolveElectrificationFichesRules.isCatalogueValid(catalogue.data)
    ) {
      return failure('IMPORT_PROFILE_UNAVAILABLE');
    }
    const planTypes = await this.listPlanTypes.listPlanTypes();
    const matchingTypes = planTypes.filter((planType) =>
      this.creation.appliesTo(planType)
    );
    if (matchingTypes.length !== 1)
      return failure('IMPORT_PROFILE_UNAVAILABLE');
    return success({
      profile: AiPlanImportProfileEnum.ELECTRIFICATION,
      planType: matchingTypes[0].id,
      schemaVersion: ELECTRIFICATION_CHECKPOINT_VERSION,
      catalogueVersion: catalogue.data.version,
      templateVersion: electrificationDocumentTemplate.version,
      eligibility: eligibility.data,
    });
  }
}
