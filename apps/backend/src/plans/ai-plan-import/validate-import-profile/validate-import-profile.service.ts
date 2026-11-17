import { Inject, Injectable } from '@nestjs/common';
import { ListPlanTypesService } from '@tet/backend/plans/plans/list-plan-types/list-plan-types.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { FeatureFlagEnum } from '@tet/domain/utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import {
  AiPlanImportProfile,
  aiPlanImportProfileValues,
  PlanType,
} from '@tet/domain/plans';
import { AI_PLAN_IMPORT_ALLOWED_PROFILES } from '../ai-plan-import.constants';
import { AiPlanImportError } from '../ai-plan-import.errors';
import type { GetImportCapabilitiesOutput } from '../get-import-capabilities/get-import-capabilities.output';
import type { StoredImportCheckpoint } from '../models/import-checkpoint';
import { resolveImportProfile } from '../models/import-profile';
import type {
  ImportAdmission,
  ImportAdmissionInput,
} from './import-admission.types';
import {
  IMPORT_PROFILE_ADAPTERS,
  type ImportProfileAdapters,
} from './import-profile-adapter.interface';

/** Contrôles communs et délégation au contrat de chaque profil. */
@Injectable()
export class ValidateImportProfileService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly listPlanTypes: ListPlanTypesService,
    @Inject(IMPORT_PROFILE_ADAPTERS)
    private readonly adapters: ImportProfileAdapters,
    private readonly tracking: TrackingService
  ) {}

  isSupportedImport(options: unknown): boolean {
    return Object.values(this.adapters).some((adapter) =>
      adapter.isSupportedImport(options)
    );
  }

  parseCheckpoint(
    checkpoint: unknown,
    options: unknown
  ): Result<StoredImportCheckpoint, AiPlanImportError> {
    const adapter = Object.values(this.adapters).find((candidate) =>
      candidate.isSupportedImport(options)
    );
    return (
      adapter?.parseCheckpoint(checkpoint, options) ??
      failure('INVALID_CHECKPOINT')
    );
  }

  async getCapabilities(
    { collectiviteId }: { collectiviteId: number },
    context: ServiceSecondArg
  ): Promise<Result<GetImportCapabilitiesOutput, AiPlanImportError>> {
    const permission = await this.checkPermission(collectiviteId, context);
    if (!permission.success) return permission;
    const enabled = await this.isImportEnabled(collectiviteId, context);
    const profiles = await Promise.all(
      aiPlanImportProfileValues.map(async (profile) => ({
        profile,
        available:
          enabled &&
          this.isProfileAllowed(profile) &&
          (
            await this.adapters[profile].checkAvailability(
              { collectiviteId },
              context
            )
          ).success,
      }))
    );
    return success({ profiles });
  }

  async authorizeAdmission(
    input: ImportAdmissionInput,
    context: ServiceSecondArg
  ): Promise<Result<ImportAdmission, AiPlanImportError>> {
    const adapter = this.getAdapter(input.options.profile);
    if (!adapter) return failure('UNKNOWN_IMPORT_PROFILE');
    const permission = await this.checkPermission(
      input.collectiviteId,
      context
    );
    if (!permission.success) return permission;
    if (!this.isProfileAllowed(adapter.profile))
      return failure('IMPORT_PROFILE_UNAVAILABLE');
    if (!(await this.isImportEnabled(input.collectiviteId, context)))
      return failure('IMPORT_PROFILE_UNAVAILABLE');

    const planType = await this.getPlanType(input.options.planType);
    if (planType) {
      const expectedAdapter = Object.values(this.adapters).find((candidate) =>
        candidate.appliesTo(planType)
      );
      if (
        expectedAdapter?.profileMismatchError &&
        expectedAdapter.profile !== adapter.profile
      )
        return failure(expectedAdapter.profileMismatchError);
    }
    return adapter.authorizeAdmission({ ...input, planType }, context);
  }

  validateSource(
    profile: AiPlanImportProfile,
    mimeType: string
  ): Result<void, AiPlanImportError> {
    return this.adapters[profile].validateSource(mimeType);
  }

  /** Les jobs déjà admis peuvent reprendre après fermeture du flag. */
  async authorizeExistingImport(
    input: ImportAdmissionInput,
    context: ServiceSecondArg
  ): Promise<Result<void, AiPlanImportError>> {
    const adapter = this.getAdapter(input.options.profile);
    return adapter
      ? adapter.authorizeExistingImport(input, context)
      : failure('UNKNOWN_IMPORT_PROFILE');
  }

  private getAdapter(profile: unknown) {
    const resolved = resolveImportProfile(profile);
    return resolved === null ? undefined : this.adapters[resolved];
  }

  private async isImportEnabled(
    collectiviteId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<boolean> {
    const enabled = await this.tracking
      .isFeatureEnabled(
        FeatureFlagEnum['IS-AI-PLAN-IMPORT-ENABLED'],
        user.id,
        collectiviteId
      )
      .catch(() => false);
    return enabled || this.permissions.hasSuperAdminRole(user, tx);
  }

  private async getPlanType(
    planTypeId: number | undefined
  ): Promise<PlanType | undefined> {
    if (planTypeId === undefined) return undefined;
    const planTypes = await this.listPlanTypes.listPlanTypes();
    return planTypes.find(({ id }) => id === planTypeId);
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

  private isProfileAllowed(profile: AiPlanImportProfile): boolean {
    return AI_PLAN_IMPORT_ALLOWED_PROFILES.includes(profile);
  }
}
