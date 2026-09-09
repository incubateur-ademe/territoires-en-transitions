import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ResourceType } from '@tet/domain/users';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { HandleDefinitionFichesService } from '../../indicateurs/handle-definition-fiches/handle-definition-fiches.service';
import { IndicateurDefinitionLockRepository } from '../indicateur-definition-lock.repository';
import { IndicateurPeriodiciteAvailabilityService } from '../indicateur-periodicite-availability.service';
import { CreateIndicateurDefinitionInput } from './mutate-definition.input';
import { MutateDefinitionRepository } from './mutate-definition.repository';

@Injectable()
export default class CreateDefinitionService {
  private readonly logger = new Logger(CreateDefinitionService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly repository: MutateDefinitionRepository,
    private readonly permissionService: PermissionService,
    private readonly periodiciteAvailabilityService: IndicateurPeriodiciteAvailabilityService,
    private readonly definitionLockRepository: IndicateurDefinitionLockRepository,
    private readonly handleDefinitionFichesService: HandleDefinitionFichesService
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
      ficheId,
    }: CreateIndicateurDefinitionInput,
    user: AuthenticatedUser
  ) {
    await this.permissionService.assertAllowed(
      user,
      'indicateurs.indicateurs.create',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    const availability =
      await this.periodiciteAvailabilityService.checkAvailable(
        { periodicite, collectiviteId },
        { user }
      );
    if (!availability.success) {
      if (availability.error === 'PERIODICITE_UNAVAILABLE') {
        throw new BadRequestException(availability.cause?.message);
      }
      throw availability.cause ?? new Error(availability.error);
    }

    this.logger.log(
      `Insère un indicateur personnalisé pour la collectivité "${collectiviteId}"`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      number,
      unknown
    >(async (tx) => {
      // PostgreSQL verrouille la table avant d'exécuter un trigger
      // statement-level. L'application doit donc prendre le verrou de
      // graphe explicitement pour conserver l'ordre graphe -> tables.
      await this.definitionLockRepository.lockForDefinitionMutation(tx);

      const indicateurId = await this.repository.createPersonalizedDefinition(
        {
          collectiviteId,
          titre,
          unite: unite ?? '',
          periodicite,
          thematiqueIds: thematiques.map(({ id }) => id),
          commentaire,
          estFavori,
          estConfidentiel,
          modifiedBy: user.id,
        },
        tx
      );

      if (ficheId !== undefined) {
        await this.handleDefinitionFichesService.upsertIndicateurFiches(
          {
            indicateurId,
            collectiviteId,
            ficheIds: [ficheId],
          },
          tx
        );
      }

      return success(indicateurId);
    });

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
