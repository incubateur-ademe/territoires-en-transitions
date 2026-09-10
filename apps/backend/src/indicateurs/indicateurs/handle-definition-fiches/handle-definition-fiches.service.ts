import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { HandleDefinitionFichesRepository } from './handle-definition-fiches.repository';

@Injectable()
export class HandleDefinitionFichesService {
  private readonly logger = new Logger(HandleDefinitionFichesService.name);

  constructor(
    private readonly repository: HandleDefinitionFichesRepository,
    private readonly transactionManager: TransactionManager
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
    tx?: Transaction
  ): Promise<void> {
    this.logger.log(
      `Mise à jour des fiches liées de l'indicateur dont l'id est ${indicateurId}`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      unknown
    >(async (transaction) => {
      const fichesBelongToCollectivite =
        await this.repository.areFichesOwnedByCollectivite(
          ficheIds,
          collectiviteId,
          transaction
        );
      if (!fichesBelongToCollectivite) {
        throw new BadRequestException(
          `Toutes les fiches doivent appartenir à la collectivité ${collectiviteId}`
        );
      }

      await this.repository.upsertIndicateurFiches(
        { indicateurId, collectiviteId, ficheIds },
        transaction
      );
      return success(undefined);
    }, tx);

    if (!transactionResult.success) {
      throw transactionResult.cause ?? transactionResult.error;
    }
  }
}
