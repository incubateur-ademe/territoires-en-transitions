import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ResourceType } from '@tet/domain/users';
import { UpsertIndicateurDefinitionPilotesInput } from './handle-definition-pilotes.input';
import { HandleDefinitionPilotesRepository } from './handle-definition-pilotes.repository';

@Injectable()
export class HandleDefinitionPilotesService {
  private readonly logger = new Logger(HandleDefinitionPilotesService.name);

  constructor(
    private readonly repository: HandleDefinitionPilotesRepository,
    private readonly permissionService: PermissionService,
    private readonly transactionManager: TransactionManager
  ) {}

  async listIndicateurPilotes({
    indicateurId,
    collectiviteId,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    user: AuthUser;
  }) {
    await this.permissionService.assertAllowed(
      user,
      'indicateurs.indicateurs.read_confidentiel',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    this.logger.log(
      `Récupération des pilotes de l'indicateur dont l'id est ${indicateurId}`
    );

    return this.repository.listIndicateurPilotes({
      indicateurId,
      collectiviteId,
    });
  }

  async upsertIndicateurPilotes(
    {
      indicateurId,
      collectiviteId,
      pilotes,
    }: {
      indicateurId: number;
      collectiviteId: number;
      pilotes: UpsertIndicateurDefinitionPilotesInput[];
    },
    tx?: Transaction
  ): Promise<void> {
    this.logger.log(
      `Mise à jour des pilotes de l'indicateur dont l'id est ${indicateurId}`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      unknown
    >(async (transaction) => {
      const hasExactlyOneIdentity = pilotes.every(
        ({ tagId, userId }) =>
          Number(tagId != null) + Number(userId != null) === 1
      );
      const pilotesBelongToCollectivite =
        hasExactlyOneIdentity &&
        (await this.repository.arePilotesInCollectivite(
          pilotes,
          collectiviteId,
          transaction
        ));
      if (!pilotesBelongToCollectivite) {
        throw new BadRequestException(
          `Tous les pilotes doivent appartenir à la collectivité ${collectiviteId}`
        );
      }

      await this.repository.upsertIndicateurPilotes(
        { indicateurId, collectiviteId, pilotes },
        transaction
      );
      return success(undefined);
    }, tx);

    if (!transactionResult.success) {
      throw transactionResult.cause ?? transactionResult.error;
    }
  }
}
