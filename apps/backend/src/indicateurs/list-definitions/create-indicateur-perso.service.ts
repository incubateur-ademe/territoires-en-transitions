import { indicateurCollectiviteTable } from '@/backend/indicateurs/shared/models/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '@/backend/indicateurs/shared/models/indicateur-definition.table';
import { indicateurThematiqueTable } from '@/backend/indicateurs/shared/models/indicateur-thematique.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { DatabaseService } from '@/backend/utils';
import { buildConflictUpdateColumns } from '@/backend/utils/database/conflict.utils';
import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../users/models/auth.models';
import { CreateIndicateurPersoRequest } from './create-indicateur-perso.request';

@Injectable()
export default class CreateIndicateurPersoService {
  private readonly logger = new Logger(CreateIndicateurPersoService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  // ajoute un indicateur personnalisé
  async create(request: CreateIndicateurPersoRequest, user: AuthUser) {
    const {
      collectiviteId,
      titre,
      unite,
      thematiques,
      commentaire,
      favoris,
      ficheId,
    } = request;

    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    let indicateurId: number | undefined;

    await this.databaseService.db.transaction(async (trx) => {
      this.logger.log(
        `Insère un indicateur personnalisé pour la collectivité "${collectiviteId}"`
      );
      // insère la définition et récupère son id
      const data = await trx
        .insert(indicateurDefinitionTable)
        .values([
          {
            collectiviteId,
            titre: titre ?? '',
            unite: unite ?? '',
          },
        ])
        .returning();
      indicateurId = data?.[0]?.id;

      if (!indicateurId) {
        throw new Error(
          `Erreur d'insertion de l'indicateur personnalisé pour la collectivité "${collectiviteId}"`
        );
      }

      // insère les liens vers les thématiques
      if (thematiques.length) {
        await trx
        .insert(indicateurThematiqueTable)
        .values(
          thematiques.map((thematiqueId) => ({ indicateurId, thematiqueId }))
        )
        .onConflictDoNothing();
      }

      // insère le commentaire et le flag `favoris`
      await trx
        .insert(indicateurCollectiviteTable)
        .values([{ collectiviteId, indicateurId, commentaire, favoris }])
        .onConflictDoUpdate({
          target: [
            indicateurCollectiviteTable.indicateurId,
            indicateurCollectiviteTable.collectiviteId,
          ],
          set: buildConflictUpdateColumns(indicateurCollectiviteTable, [
            'commentaire',
            'favoris',
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
    });

    return indicateurId;
  }
}
