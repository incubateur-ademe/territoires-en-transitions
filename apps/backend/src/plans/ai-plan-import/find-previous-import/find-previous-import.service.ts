import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import {
  AiPlanImportErrorEnum,
  type AiPlanImportError,
} from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import {
  AbandonedAiImport,
  PreviousAiImport,
} from '../models/ai-plan-import-job';
import { FindPreviousImportInput } from './find-previous-import.input';

/**
 * Imports antérieurs du même fichier dans la collectivité : le plan encore
 * présent, que le front fait confirmer avant de relancer l'import, ou
 * l'abandon motivé, qu'il explique.
 */
@Injectable()
export class FindPreviousImportService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: AiPlanImportJobRepository
  ) {}

  async findPreviousImport(
    input: FindPreviousImportInput,
    { user }: ServiceSecondArg
  ): Promise<Result<PreviousAiImport | null, AiPlanImportError>> {
    const allowed = await this.canImport(input, user);
    if (!allowed.success) return allowed;

    return this.jobRepository.findPreviousImport(input);
  }

  /** Le dernier import du fichier, quand l'IA l'a abandonné : à expliquer, pas à relancer. */
  async findAbandonedImport(
    input: FindPreviousImportInput,
    { user }: ServiceSecondArg
  ): Promise<Result<AbandonedAiImport | null, AiPlanImportError>> {
    const allowed = await this.canImport(input, user);
    if (!allowed.success) return allowed;

    return this.jobRepository.findLastAbandonedImport(input);
  }

  private async canImport(
    { collectiviteId }: FindPreviousImportInput,
    user: ServiceSecondArg['user']
  ): Promise<Result<void, AiPlanImportError>> {
    const permissionResult = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    return permissionResult.success
      ? success(undefined)
      : failure(AiPlanImportErrorEnum.UNAUTHORIZED);
  }
}
