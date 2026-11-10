import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ResourceType } from '@tet/domain/users';
import { UpsertIndicateurFichesService } from '../upsert-indicateur-fiches/upsert-indicateur-fiches.service';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { CreateIndicateurInput } from './mutate-indicateur.input';
import { MutateIndicateurRepository } from './mutate-indicateur.repository';

@Injectable()
export default class CreateIndicateurService {
  private readonly logger = new Logger(CreateIndicateurService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly repository: MutateIndicateurRepository,
    private readonly permissionService: PermissionService,
    private readonly indicateurLockRepository: IndicateurLockRepository,
    private readonly upsertIndicateurFichesService: UpsertIndicateurFichesService
  ) {}

  // ajoute un indicateur personnalisé
  async createIndicateurPerso(
    {
      collectiviteId,
      titre,
      unite,
      periodicite,
      thematiques,
      commentaire,
      estFavori,
      estConfidentiel,
      isApplicable,
      ficheId,
    }: CreateIndicateurInput,
    { user, tx }: ServiceSecondArg
  ) {
    await this.permissionService.assertAllowed(
      user,
      'indicateurs.indicateurs.create',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    this.logger.log(
      `Insère un indicateur personnalisé pour la collectivité "${collectiviteId}"`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      number,
      unknown
    >(async (transaction) => {
      // PostgreSQL verrouille la table avant d'exécuter un trigger
      // statement-level. L'application doit donc prendre le verrou de
      // graphe explicitement pour conserver l'ordre graphe -> tables.
      await this.indicateurLockRepository.lockForIndicateurMutation(
        transaction
      );

      const indicateurId = await this.repository.createIndicateurPerso(
        {
          collectiviteId,
          titre,
          unite: unite ?? '',
          periodicite,
          thematiqueIds: thematiques.map(({ id }) => id),
          commentaire,
          estFavori,
          estConfidentiel,
          isApplicable,
          modifiedBy: user.id,
        },
        transaction
      );

      if (ficheId !== undefined) {
        await this.upsertIndicateurFichesService.upsertIndicateurFiches(
          {
            indicateurId,
            collectiviteId,
            ficheIds: [ficheId],
          },
          { user, tx: transaction }
        );
      }

      return success(indicateurId);
    }, tx);

    if (!transactionResult.success) {
      throw transactionResult.cause ?? transactionResult.error;
    }
    const indicateurId = transactionResult.data;

    this.logger.log(
      `Indicateur personnalisé "${indicateurId}" pour la collectivité "${collectiviteId}" inséré`
    );

    return indicateurId;
  }
}
