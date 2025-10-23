import { indicateurCollectiviteTable } from '@/backend/indicateurs/definitions/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '@/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurThematiqueTable } from '@/backend/indicateurs/shared/models/indicateur-thematique.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { buildConflictUpdateColumns } from '@/backend/utils/database/conflict.utils';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../../users/models/auth.models';
import { CreateIndicateurDefinitionInput } from './mutate-definition.input';

@Injectable()
export default class CreateDefinitionService {
  private readonly logger = new Logger(CreateDefinitionService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
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
      PermissionOperationEnum['INDICATEURS.EDITION'],
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

    return indicateurId;
  }
}
