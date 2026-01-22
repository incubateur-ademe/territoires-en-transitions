import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { PlanNode } from '@tet/domain/plans';
import { ResourceType } from '@tet/domain/users';
import { ListAxesError, ListAxesErrorEnum } from './list-axes.errors';
import { ListAxesInput } from './list-axes.input';
import { ListAxesOutput, ListAxesRepository } from './list-axes.repository';

@Injectable()
export class ListAxesService {
  private readonly logger = new Logger(ListAxesService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly listAxesRepository: ListAxesRepository,
    private readonly collectivite: CollectivitesService
  ) {}

  async listAxes(
    input: ListAxesInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<ListAxesOutput, ListAxesError>> {
    const isAllowed = await this.checkPermission(input.collectiviteId, user);
    if (!isAllowed) {
      return {
        success: false,
        error: ListAxesErrorEnum.UNAUTHORIZED,
      };
    }

    return this.listAxesRepository.listChildren(input, tx);
  }

  async listAxesRecursively(
    input: ListAxesInput,
    user?: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<PlanNode[], ListAxesError>> {
    if (user) {
      const isAllowed = await this.checkPermission(input.collectiviteId, user);
      if (!isAllowed) {
        return {
          success: false,
          error: ListAxesErrorEnum.UNAUTHORIZED,
        };
      }
    }

    return this.listAxesRepository.listChildrenRecursively(input, tx);
  }

  private async checkPermission(
    collectiviteId: number,
    user: AuthenticatedUser
  ): Promise<boolean> {
    const collectivitePrivate = await this.collectivite.isPrivate(
      collectiviteId
    );

    const isAllowed = await this.permissionService.isAllowed(
      user,
      collectivitePrivate ? 'plans.read_confidentiel' : 'plans.read',
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );

    if (!isAllowed) {
      this.logger.log(
        `User ${user.id} is not allowed to list axes for collectivité ${collectiviteId}`
      );
    }

    return isAllowed;
  }
}
