import { Injectable, Logger } from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import {
  UpsertIndicateurFichesError,
  UpsertIndicateurFichesErrorEnum,
} from './upsert-indicateur-fiches.errors';
import { UpsertIndicateurFichesRepository } from './upsert-indicateur-fiches.repository';

@Injectable()
export class UpsertIndicateurFichesService {
  private readonly logger = new Logger(UpsertIndicateurFichesService.name);

  constructor(
    private readonly repository: UpsertIndicateurFichesRepository,
    private readonly transactionManager: TransactionManager,
    private readonly ficheActionPermissionsService: FicheActionPermissionsService
  ) {}

  async upsertIndicateurFiches(
    {
      indicateurId,
      collectiviteId,
      ficheIds,
    }: {
      indicateurId: number;
      collectiviteId: number;
      ficheIds: number[];
    },
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, UpsertIndicateurFichesError>> {
    this.logger.log(
      `Mise à jour des fiches liées de l'indicateur dont l'id est ${indicateurId}`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      UpsertIndicateurFichesError | Error
    >(async (transaction) => {
      const fichesAreInScope =
        await this.repository.areFichesInCollectiviteScope(
          ficheIds,
          collectiviteId,
          transaction
        );
      if (!fichesAreInScope) {
        return failure(UpsertIndicateurFichesErrorEnum.FICHES_OUT_OF_SCOPE);
      }

      const existingFicheIds = new Set(
        await this.repository.listIndicateurFicheIds(
          { indicateurId, collectiviteId },
          transaction
        )
      );
      const requestedFicheIds = new Set(ficheIds);
      const ficheIdsToLink = [...requestedFicheIds].filter(
        (ficheId) => !existingFicheIds.has(ficheId)
      );
      const ficheIdsToUnlink = [...existingFicheIds].filter(
        (ficheId) => !requestedFicheIds.has(ficheId)
      );

      const canWriteEveryFiche = await this.canWriteEveryFiche(
        [...ficheIdsToLink, ...ficheIdsToUnlink],
        user,
        transaction
      );
      if (!canWriteEveryFiche) {
        return failure(CommonErrorEnum.UNAUTHORIZED);
      }

      await this.repository.upsertIndicateurFiches(
        {
          indicateurId,
          collectiviteId,
          ficheIds: ficheIdsToLink,
          ficheIdsToUnlink,
          createdBy: user.id,
        },
        transaction
      );
      return success(undefined);
    }, tx);

    if (transactionResult.success) {
      return success(undefined);
    }
    if (transactionResult.error instanceof Error) {
      throw transactionResult.cause ?? transactionResult.error;
    }
    return failure(transactionResult.error, transactionResult.cause);
  }

  private async canWriteEveryFiche(
    ficheIds: number[],
    user: ServiceSecondArg['user'],
    tx: Transaction
  ): Promise<boolean> {
    for (const ficheId of ficheIds) {
      const canWrite = await this.ficheActionPermissionsService.canWriteFiche(
        ficheId,
        user,
        tx,
        true
      );
      if (!canWrite) {
        return false;
      }
    }
    return true;
  }
}
