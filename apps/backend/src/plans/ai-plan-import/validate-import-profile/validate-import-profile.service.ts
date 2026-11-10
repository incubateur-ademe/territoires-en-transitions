import { Injectable } from '@nestjs/common';
import { ListPlanTypesService } from '@tet/backend/plans/plans/list-plan-types/list-plan-types.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import { ResourceType } from '@tet/domain/users';
import {
  AiPlanImportProfile,
  AiPlanImportProfileEnum,
} from '@tet/domain/plans';
import { AiPlanImportError } from '../ai-plan-import.errors';
import { ValidateElectrificationImportService } from '../electrification/validate-import/validate-electrification-import.service';
import { AiPlanImportJobOptions } from '../models/ai-plan-import-job';
import {
  isSupportedGenericImport,
  parseImportCheckpoint,
  StoredImportCheckpoint,
} from '../models/import-checkpoint';
import {
  GENERIC_IMPORT_CONTRACT_VERSION,
  resolveImportProfile,
} from '../models/import-profile';
import type { GetImportCapabilitiesOutput } from '../get-import-capabilities/get-import-capabilities.output';
import type { ImportAdmission } from './import-admission.types';

type ImportAdmissionInput = {
  collectiviteId: number;
  options: AiPlanImportJobOptions;
};

@Injectable()
export class ValidateImportProfileService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly listPlanTypes: ListPlanTypesService,
    private readonly electrification: ValidateElectrificationImportService
  ) {}

  isSupportedImport(options: unknown): boolean {
    return (
      isSupportedGenericImport(options) ||
      this.electrification.isSupportedImport(options)
    );
  }

  parseCheckpoint(
    checkpoint: unknown,
    options: unknown
  ): Result<StoredImportCheckpoint, AiPlanImportError> {
    if (isSupportedGenericImport(options)) {
      const parsed = parseImportCheckpoint(checkpoint);
      return parsed.success
        ? success(parsed.data)
        : failure('INVALID_CHECKPOINT');
    }
    return this.electrification.parseCheckpoint(checkpoint, options);
  }

  async getCapabilities(
    { collectiviteId }: { collectiviteId: number },
    context: ServiceSecondArg
  ): Promise<Result<GetImportCapabilitiesOutput, AiPlanImportError>> {
    const permission = await this.checkPermission(collectiviteId, context);
    if (!permission.success) return permission;
    const electrification =
      await this.electrification.getAdmissionConfiguration(
        { collectiviteId },
        context
      );
    return success({
      profiles: [
        { profile: AiPlanImportProfileEnum.GENERIC, available: true },
        {
          profile: AiPlanImportProfileEnum.ELECTRIFICATION,
          available: electrification.success,
        },
      ],
    });
  }

  async authorizeAdmission(
    input: ImportAdmissionInput,
    context: ServiceSecondArg
  ): Promise<Result<ImportAdmission, AiPlanImportError>> {
    const profile = resolveImportProfile(input.options.profile);
    if (profile === null) return failure('UNKNOWN_IMPORT_PROFILE');
    const permission = await this.checkPermission(
      input.collectiviteId,
      context
    );
    if (!permission.success) return permission;
    if (profile === AiPlanImportProfileEnum.ELECTRIFICATION) {
      return this.electrification.authorizeAdmission(input, context);
    }
    return this.authorizeGenericAdmission(input.options);
  }

  validateSource(
    profile: AiPlanImportProfile,
    mimeType: string
  ): Result<void, AiPlanImportError> {
    return profile === AiPlanImportProfileEnum.ELECTRIFICATION
      ? this.electrification.validateSource(mimeType)
      : success(undefined);
  }

  /** Les jobs déjà admis peuvent reprendre après fermeture du flag. */
  async authorizeExistingImport(
    input: ImportAdmissionInput,
    context: ServiceSecondArg
  ): Promise<Result<void, AiPlanImportError>> {
    const profile = resolveImportProfile(input.options.profile);
    if (profile === null) return failure('UNKNOWN_IMPORT_PROFILE');
    if (profile === AiPlanImportProfileEnum.GENERIC) return success(undefined);
    return this.electrification.authorizeExistingImport(input, context);
  }

  private async authorizeGenericAdmission(
    options: AiPlanImportJobOptions
  ): Promise<Result<ImportAdmission, AiPlanImportError>> {
    let withSecteurs = false;
    if (options.planType !== undefined) {
      const planTypes = await this.listPlanTypes.listPlanTypes();
      const planType = planTypes.find(({ id }) => id === options.planType);
      if (!planType) return failure('UNKNOWN_PLAN_TYPE');
      const planTypeValidation =
        this.electrification.validateGenericPlanType(planType);
      if (!planTypeValidation.success) return planTypeValidation;
      withSecteurs =
        planType.categorie === PCAET_PLAN_TYPE_KEY.categorie &&
        planType.type === PCAET_PLAN_TYPE_KEY.type;
    }
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
        profile: AiPlanImportProfileEnum.GENERIC,
        contractVersion: GENERIC_IMPORT_CONTRACT_VERSION,
        catalogueVersion: null,
        withSecteurs,
      },
      createProvisionalPlan: true,
    });
  }

  private async checkPermission(
    collectiviteId: number,
    context: ServiceSecondArg
  ): Promise<Result<void, AiPlanImportError>> {
    const permission = await this.permissions.isAllowed(
      context.user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      context.tx
    );
    return permission.success ? success(undefined) : failure('UNAUTHORIZED');
  }
}
