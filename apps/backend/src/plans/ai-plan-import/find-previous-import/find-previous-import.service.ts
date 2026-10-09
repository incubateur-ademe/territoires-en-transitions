import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, type Result } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import {
  AiPlanImportErrorEnum,
  type AiPlanImportError,
} from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { PreviousAiImport } from '../models/ai-plan-import-job';
import { FindPreviousImportInput } from './find-previous-import.input';

/**
 * Plan encore présent issu d'un import antérieur du même fichier dans la
 * collectivité : le front demande confirmation avant de relancer l'import.
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
    const permissionResult = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(AiPlanImportErrorEnum.UNAUTHORIZED);
    }

    return this.jobRepository.findPreviousImport(input);
  }
}
