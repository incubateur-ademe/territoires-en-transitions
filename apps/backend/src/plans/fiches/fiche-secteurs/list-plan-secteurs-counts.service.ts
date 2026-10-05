import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { ResourceType } from '@tet/domain/users';
import { ListPlanSecteursCountsInput } from './list-plan-secteurs-counts.input';
import { ListPlanSecteursCountsOutput } from './list-plan-secteurs-counts.output';
import { ListPlanSecteursCountsRepository } from './list-plan-secteurs-counts.repository';

@Injectable()
export class ListPlanSecteursCountsService {
  constructor(
    private readonly collectivitesService: CollectivitesService,
    private readonly permissionService: PermissionService,
    private readonly listPlanSecteursCountsRepository: ListPlanSecteursCountsRepository
  ) {}

  async listCounts(
    { collectiviteId, planIds }: ListPlanSecteursCountsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ListPlanSecteursCountsOutput, CommonError>> {
    const isPrivate = await this.collectivitesService.isPrivate(collectiviteId);
    const permission = await this.permissionService.isAllowed(
      user,
      isPrivate ? 'plans.read_confidentiel' : 'plans.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permission.success) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    try {
      return success(
        await this.listPlanSecteursCountsRepository.listCounts(
          { collectiviteId, planIds },
          tx
        )
      );
    } catch (error) {
      return failure(CommonErrorEnum.DATABASE_ERROR, error as Error);
    }
  }
}
