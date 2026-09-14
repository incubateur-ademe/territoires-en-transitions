import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { HandleDefinitionFichesRepository } from './handle-definition-fiches.repository';

@Injectable()
export class HandleDefinitionFichesService {
  private readonly logger = new Logger(HandleDefinitionFichesService.name);

  constructor(
    private readonly repository: HandleDefinitionFichesRepository,
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
  ): Promise<void> {
    this.logger.log(
      `Mise à jour des fiches liées de l'indicateur dont l'id est ${indicateurId}`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      unknown
    >(async (transaction) => {
      const fichesAreInScope =
        await this.repository.areFichesInCollectiviteScope(
          ficheIds,
          collectiviteId,
          transaction
        );
      if (!fichesAreInScope) {
        throw new BadRequestException(
          `Toutes les fiches doivent appartenir à la collectivité ${collectiviteId} ou être partagées avec elle`
        );
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

      for (const ficheId of [...ficheIdsToLink, ...ficheIdsToUnlink]) {
        const access = await this.ficheActionPermissionsService.canWriteFiche(
          ficheId,
          user,
          transaction
        );
        if (!access) {
          throw new ForbiddenException(
            `Droits insuffisants pour modifier les indicateurs de la fiche ${ficheId}`
          );
        }
      }

      await this.repository.upsertIndicateurFiches(
        {
          indicateurId,
          collectiviteId,
          ficheIds: ficheIdsToLink,
          ficheIdsToUnlink,
        },
        transaction
      );
      return success(undefined);
    }, tx);

    if (!transactionResult.success) {
      throw transactionResult.cause ?? transactionResult.error;
    }
  }
}
