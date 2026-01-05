import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { AxeLight } from '@tet/domain/plans';
import { PermissionOperationEnum } from '@tet/domain/users';
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
  ): Promise<Result<AxeLight, GetAxeError>> {
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
