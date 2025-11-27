import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { MethodResult } from '@/backend/utils/result.type';
import { Injectable, Logger } from '@nestjs/common';
import { AxeType } from '../../fiches/shared/models/axe.table';
import { GetAxeError, GetAxeErrorEnum } from './get-axe.errors';
import { GetAxeInput } from './get-axe.input';
import { GetAxeRepository } from './get-axe.repository';

@Injectable()
export class GetAxeService {
  private readonly logger = new Logger(GetAxeService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly getAxeRepository: GetAxeRepository,
    private readonly collectivite: CollectivitesService
  ) {}

  async getAxe(
    input: GetAxeInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<MethodResult<AxeType, GetAxeError>> {
    // récupèrer l'axe pour obtenir la collectivité
    const axeResult = await this.getAxeRepository.getAxe(input.axeId, tx);
    if (!axeResult.success) {
      return axeResult;
    }

    // vérifier les permissions
    const collectiviteId = axeResult.data.collectiviteId;
    const isAllowed = await this.checkPermission(collectiviteId, user);
    if (!isAllowed) {
      return {
        success: false,
        error: GetAxeErrorEnum.UNAUTHORIZED,
      };
    }

    return {
      success: true,
      data: axeResult.data,
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
        `User ${user.id} is not allowed to get axe for collectivité ${collectiviteId}`
      );
    }

    return isAllowed;
  }
}
