import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { AiPlanImportError } from '../ai-plan-import.errors';
import {
  aiPlanImportProfileSchema,
  isImportProfileImplemented,
} from '../models/import-profile';
import type { GetImportCapabilitiesOutput } from './get-import-capabilities.output';

@Injectable()
export class GetImportCapabilitiesService {
  constructor(private readonly permissions: PermissionService) {}

  async getCapabilities(
    { collectiviteId }: { collectiviteId: number },
    { user }: ServiceSecondArg
  ): Promise<Result<GetImportCapabilitiesOutput, AiPlanImportError>> {
    const permission = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    if (!permission.success) return failure('UNAUTHORIZED');

    return success({
      profiles: aiPlanImportProfileSchema.options.map((profile) => ({
        profile,
        available: isImportProfileImplemented(profile),
      })),
    });
  }
}
