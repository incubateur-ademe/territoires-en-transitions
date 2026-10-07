import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
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
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ListAxesOutput, ListAxesError>> {
    const permissionResult = await this.checkPermission(
      input.collectiviteId,
      user
    );
    if (!permissionResult) {
      return {
        success: false,
        error: ListAxesErrorEnum.UNAUTHORIZED,
      };
    }

    return this.listAxesRepository.listChildren(input, tx);
  }

  async listAxesRecursively(
    input: ListAxesInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PlanNode[], ListAxesError>> {
    const permissionResult = await this.checkPermission(
      input.collectiviteId,
      user
    );
    if (!permissionResult) {
      return {
        success: false,
        error: ListAxesErrorEnum.UNAUTHORIZED,
      };
    }

    const canReadFichesRestreintes = await this.canReadFichesRestreintes({
      collectiviteId: input.collectiviteId,
      user,
      tx,
    });

    return this.listAxesRepository.listChildrenRecursively(
      input,
      { includeFichesRestreintes: canReadFichesRestreintes },
      tx
    );
  }

  private async canReadFichesRestreintes({
    collectiviteId,
    user,
    tx,
  }: {
    collectiviteId: number;
    user: AuthenticatedUser;
    tx?: Transaction;
  }): Promise<boolean> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      'plans.fiches.read_confidentiel',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );

    return permissionResult.success;
  }

  private async checkPermission(
    collectiviteId: number,
    user: AuthenticatedUser
  ): Promise<boolean> {
    const collectivitePrivate = await this.collectivite.isPrivate(
      collectiviteId
    );

    const permissionResult = await this.permissionService.isAllowed(
      user,
      collectivitePrivate ? 'plans.read_confidentiel' : 'plans.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    if (!permissionResult.success) {
      this.logger.log(
        `User ${user.id} is not allowed to list axes for collectivité ${collectiviteId}`
      );
    }

    return permissionResult.success;
  }
}
