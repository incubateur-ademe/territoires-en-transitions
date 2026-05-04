import { Injectable, Logger } from '@nestjs/common';
import { indicateurCollectiviteTable } from '@tet/backend/indicateurs/definitions/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { IndicateurIndexerService } from '@tet/backend/indicateurs/indicateurs/indicateur-indexer/indicateur-indexer.service';
import { indicateurThematiqueTable } from '@tet/backend/indicateurs/shared/models/indicateur-thematique.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ResourceType } from '@tet/domain/users';
import { AuthUser } from '../../../users/models/auth.models';
import { CreateIndicateurDefinitionInput } from './mutate-definition.input';

@Injectable()
export default class CreateDefinitionService {
  private readonly logger = new Logger(CreateDefinitionService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly indicateurIndexerService: IndicateurIndexerService
  ) {}

  // ajoute un indicateur personnalisé
  async createIndicateurPerso(
    {
      collectiviteId,
      titre,
      unite,
      thematiques,
      commentaire,
      estFavori,
      ficheId,
    }: CreateIndicateurDefinitionInput,
    user: AuthUser
  ) {
    await this.permissionService.isAllowed(
      user,
      'indicateurs.indicateurs.create',
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const indicateurId = await this.databaseService.db.transaction(
      async (trx) => {
        this.logger.log(
          `Insère un indicateur personnalisé pour la collectivité "${collectiviteId}"`
        );

        // insère la définition et récupère son id
        const [indicateur] = await trx
          .insert(indicateurDefinitionTable)
          .values([
            {
              collectiviteId,
              titre,
              unite: unite ?? '',
            },
          ])
          .returning();

        if (!indicateur) {
          throw new Error(
            `Erreur d'insertion de l'indicateur personnalisé pour la collectivité "${collectiviteId}"`
          );
        }

        const indicateurId = indicateur.id;

        // insère les liens vers les thématiques
        if (thematiques.length) {
          await trx
            .insert(indicateurThematiqueTable)
            .values(
              thematiques.map(({ id }) => ({
                indicateurId,
                thematiqueId: id,
              }))
            )
            .onConflictDoNothing();
        }

        // insère le commentaire et le flag `favoris`
        await trx
          .insert(indicateurCollectiviteTable)
          .values([
            {
              collectiviteId,
              indicateurId,
              commentaire,
              favoris: estFavori,
              modifiedBy: user.id,
            },
          ])
          .onConflictDoUpdate({
            target: [
              indicateurCollectiviteTable.indicateurId,
              indicateurCollectiviteTable.collectiviteId,
            ],
            set: buildConflictUpdateColumns(indicateurCollectiviteTable, [
              'commentaire',
              'favoris',
              'modifiedBy',
            ]),
          });

        // rattache le nouvel indicateur à une fiche action si un `ficheId` est spécifié
        if (ficheId) {
          await trx
            .insert(ficheActionIndicateurTable)
            .values([{ indicateurId, ficheId }])
            .onConflictDoNothing();
        }

        this.logger.log(
          `Indicateur personnalisé "${indicateurId}" pour la collectivité "${collectiviteId}" inséré`
        );

        return indicateur.id;
      }
    );

    // Indexation Meilisearch : on enfile l'upsert APRÈS le commit pour ne
    // jamais indexer un état qui sera rollbacké. L'enqueue est wrappé dans
    // un try/catch + warn : une panne BullMQ ne doit pas faire échouer la
    // création — la dérive est rattrapée par le backfill admin (U8).
    try {
      await this.indicateurIndexerService.enqueueUpsert(indicateurId);
    } catch (err) {
      this.logger.warn(
        `Échec de l'enqueue d'indexation pour l'indicateur ${indicateurId} : ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    return indicateurId;
  }
}
