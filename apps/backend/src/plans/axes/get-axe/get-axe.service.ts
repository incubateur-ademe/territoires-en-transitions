import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { GetAxeError, GetAxeErrorEnum } from './get-axe.errors';
import { GetAxeInput } from './get-axe.input';
import { GetAxeOutput } from './get-axe.output';
import { GetAxeRepository } from './get-axe.repository';

@Injectable()
export class GetAxeService {
  private readonly logger = new Logger(GetAxeService.name);

  constructor(
    private readonly collectivite: CollectivitesService,
    private readonly databaseService: DatabaseService,
    private readonly getAxeRepository: GetAxeRepository,
    private readonly permissionService: PermissionService
  ) {}

  async getAxe(
    input: GetAxeInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<GetAxeOutput, GetAxeError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<GetAxeOutput, GetAxeError>> => {
      // récupèrer l'axe pour obtenir la collectivité
      const axeResult = await this.getAxeRepository.getAxe(
        input.axeId,
        transaction
      );
      if (!axeResult.success) {
        return axeResult;
      }
      const axe = axeResult.data;

      // vérifier les permissions
      const collectiviteId = axeResult.data.collectiviteId;
      const isAllowed = await this.checkPermission(collectiviteId, user);
      if (!isAllowed) {
        return {
          success: false,
          error: GetAxeErrorEnum.UNAUTHORIZED,
        };
      }

      const indicateursResult = await this.getAxeRepository.getAxeIndicateurs(
        axe.id,
        transaction
      );
      if (!indicateursResult.success) {
        return indicateursResult;
      }

      return {
        success: true,
        data: {
          ...axe,
          indicateurs: indicateursResult.data,
        },
      };
    };

    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(async (newTx) =>
          executeInTransaction(newTx)
        );
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
