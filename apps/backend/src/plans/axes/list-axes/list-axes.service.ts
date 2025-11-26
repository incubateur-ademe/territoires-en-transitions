import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { MethodResult } from '@/backend/utils/result.type';
import { Injectable, Logger } from '@nestjs/common';
import { PlanNode } from './flat-axe.schema';
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
  ): Promise<MethodResult<ListAxesOutput, ListAxesError>> {
    const isAllowed = await this.checkPermission(input.collectiviteId, user);
    if (!isAllowed) {
      return {
        success: false,
        error: ListAxesErrorEnum.UNAUTHORIZED,
      };
    }

    const listResult = await this.listAxesRepository.listChildren(input, tx);

    if (!listResult.success) {
      return {
        success: false,
        error: listResult.error,
      };
    }

    return {
      success: true,
      data: listResult.data,
    };
  }

  async listAxesRecursively(
    input: ListAxesInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<MethodResult<PlanNode[], ListAxesError>> {
    const isAllowed = await this.checkPermission(input.collectiviteId, user);
    if (!isAllowed) {
      return {
        success: false,
        error: ListAxesErrorEnum.UNAUTHORIZED,
      };
    }

    const listResult = await this.listAxesRepository.listChildrenRecursively(
      input,
      tx
    );

    if (!listResult.success) {
      return {
        success: false,
        error: listResult.error,
      };
    }

    return {
      success: true,
      data: listResult.data,
    };
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
      collectivitePrivate
        ? PermissionOperationEnum['PLANS.READ']
        : PermissionOperationEnum['PLANS.READ_PUBLIC'],
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
