import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { AxeLight } from '@tet/domain/plans';
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

      const [indicateursResult, cheminResult] = await Promise.all([
        this.getAxeRepository.getAxeIndicateurs(axe.id, transaction),
        this.getAxeRepository.getAxeChemin(axe.id, transaction),
      ]);
      if (!indicateursResult.success) {
        return indicateursResult;
      }
      if (!cheminResult.success) {
        return cheminResult;
      }

      return {
        success: true,
        data: {
          ...axe,
          indicateurs: indicateursResult.data,
          chemin: cheminResult.data,
        },
      };
    };

    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(async (newTx) =>
          executeInTransaction(newTx)
        );
  }

  async getAxesChemins(
    axeIds: number[],
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<Record<number, AxeLight[]>, GetAxeError>> {
    if (axeIds.length === 0) {
      return { success: true, data: {} };
    }

    const cheminsResult = await this.getAxeRepository.getAxesChemins(
      axeIds,
      tx
    );
    if (!cheminsResult.success) {
      return cheminsResult;
    }

    const distinctCollectiviteIds = Array.from(
      new Set(
        Object.values(cheminsResult.data)
          .flat()
          .map((axe) => axe.collectiviteId)
      )
    );

    for (const collectiviteId of distinctCollectiviteIds) {
      const isAllowed = await this.checkPermission(collectiviteId, user);
      if (!isAllowed) {
        return { success: false, error: GetAxeErrorEnum.UNAUTHORIZED };
      }
    }

    return cheminsResult;
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
        `User ${user.id} is not allowed to get axe for collectivité ${collectiviteId}`
      );
    }

    return isAllowed;
  }
}
