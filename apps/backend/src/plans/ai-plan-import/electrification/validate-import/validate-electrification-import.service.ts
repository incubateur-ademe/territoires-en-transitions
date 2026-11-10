import { Inject, Injectable } from '@nestjs/common';
import {
  CheckElectrificationEligibilityService,
  ElectrificationEligibilityDecision,
} from '@tet/backend/plans/plans/check-electrification-eligibility/check-electrification-eligibility.service';
import { ListPlanTypesService } from '@tet/backend/plans/plans/list-plan-types/list-plan-types.service';
import { CheckElectrificationCreationService } from '@tet/backend/plans/plans/electrification/check-electrification-creation.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  AiPlanImportProfileEnum,
  electrificationConfigSchema,
  PlanType,
} from '@tet/domain/plans';
import { AiPlanImportError } from '../../ai-plan-import.errors';
import { DOCX_MIME } from '../../enqueue-import/detect-source-mime-type';
import { ImportAdmission } from '../../validate-import-profile/import-admission.types';
import { AiPlanImportJobOptions } from '../../models/ai-plan-import-job';
import { ELECTRIFICATION_CONFIG } from '../electrification.constants';
import {
  ELECTRIFICATION_CHECKPOINT_VERSION,
  ElectrificationExtractionCheckpoint,
} from '../extract-plan/electrification-extraction-checkpoint.schema';
import { electrificationDocumentTemplate } from '../extract-plan/electrification-document-template.constants';
import { ResolveElectrificationFichesRules } from '../resolve-fiches/resolve-electrification-fiches.rules';
import { ElectrificationImportContractRules } from './electrification-import-contract.rules';

type ElectrificationImportConfiguration = {
  profile: typeof AiPlanImportProfileEnum.ELECTRIFICATION;
  planType: number;
  schemaVersion: number;
  catalogueVersion: string;
  templateVersion: string;
  eligibility: ElectrificationEligibilityDecision;
};

type ImportInput = { collectiviteId: number; options: AiPlanImportJobOptions };

/** Règles du profil, partagées par l'admission et la revalidation des jobs. */
@Injectable()
export class ValidateElectrificationImportService {
  constructor(
    private readonly creation: CheckElectrificationCreationService,
    private readonly eligibility: CheckElectrificationEligibilityService,
    private readonly listPlanTypes: ListPlanTypesService,
    @Inject(ELECTRIFICATION_CONFIG) private readonly catalogue: unknown
  ) {}

  isSupportedImport(options: unknown): boolean {
    return ElectrificationImportContractRules.isSupportedImport(
      options,
      this.catalogue
    );
  }

  parseCheckpoint(
    checkpoint: unknown,
    options: unknown
  ): Result<ElectrificationExtractionCheckpoint, AiPlanImportError> {
    return ElectrificationImportContractRules.parseCheckpoint(
      checkpoint,
      options,
      this.catalogue
    );
  }

  async getAdmissionConfiguration(
    input: { collectiviteId: number },
    context: ServiceSecondArg
  ): Promise<Result<ElectrificationImportConfiguration, AiPlanImportError>> {
    const configuration = await this.getConfiguration(input, context);
    if (!configuration.success) return configuration;
    const enabled = await this.creation.isEnabled(input, context);
    return enabled ? configuration : failure('IMPORT_PROFILE_UNAVAILABLE');
  }

  async authorizeAdmission(
    { collectiviteId, options }: ImportInput,
    context: ServiceSecondArg
  ): Promise<Result<ImportAdmission, AiPlanImportError>> {
    const configuration = await this.getAdmissionConfiguration(
      { collectiviteId },
      context
    );
    if (!configuration.success) return configuration;
    if (
      options.planType !== undefined &&
      options.planType !== configuration.data.planType
    ) {
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
    });
  }

  validateGenericPlanType(planType: PlanType): Result<void, AiPlanImportError> {
    return this.creation.appliesTo(planType)
      ? failure('ELECTRIFICATION_REQUIRES_DEDICATED_IMPORT')
      : success(undefined);
  }

  validateSource(mimeType: string): Result<void, AiPlanImportError> {
    return mimeType === DOCX_MIME
      ? success(undefined)
      : failure('ELECTRIFICATION_REQUIRES_DOCX');
  }

  /** Une fermeture du flag ne révoque pas les jobs déjà admis. */
  async authorizeExistingImport(
    { collectiviteId, options }: ImportInput,
    context: ServiceSecondArg
  ): Promise<Result<void, AiPlanImportError>> {
    const configuration = await this.getConfiguration(
      { collectiviteId },
      context
    );
    if (!configuration.success) return configuration;
    return options.planType === configuration.data.planType
      ? success(undefined)
      : failure('UNSUPPORTED_IMPORT_CONTRACT');
  }

  private async getConfiguration(
    { collectiviteId }: { collectiviteId: number },
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
    const catalogue = electrificationConfigSchema.safeParse(this.catalogue);
    if (
      !catalogue.success ||
      !ResolveElectrificationFichesRules.isCatalogueReady(catalogue.data)
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
