import { AuthUser, PermissionOperation, ResourceType } from '@/domain/auth';
import { categorieTagTable } from '@/domain/collectivites';
import { thematiqueTable } from '@/domain/shared';
import { Injectable, Logger } from '@nestjs/common';
import {
  aliasedTable,
  and,
  count,
  eq,
  getTableColumns,
  inArray,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { objectToCamel } from 'ts-case-convert';
import { PermissionService } from '../../auth/authorizations/permission.service';
import { groupementCollectiviteTable } from '../../collectivites/shared/models/groupement-collectivite.table';
import { groupementTable } from '../../collectivites/shared/models/groupement.table';
import { DatabaseService } from '../../utils/database/database.service';
import {
  indicateurSourceMetadonneeTable,
  indicateurValeurTable,
} from '../index-domain';
import { indicateurActionTable } from '../shared/models/indicateur-action.table';
import { indicateurCategorieTagTable } from '../shared/models/indicateur-categorie-tag.table';
import { indicateurCollectiviteTable } from '../shared/models/indicateur-collectivite.table';
import {
  IndicateurDefinition,
  IndicateurDefinitionAvecEnfantsType,
  IndicateurDefinitionDetaillee,
  indicateurDefinitionTable,
} from '../shared/models/indicateur-definition.table';
import { indicateurGroupeTable } from '../shared/models/indicateur-groupe.table';
import { indicateurThematiqueTable } from '../shared/models/indicateur-thematique.table';
import { GetFavorisCountRequest } from './get-favoris-count.request';
import { GetPathRequest } from './get-path.request';
import { ListDefinitionsRequest } from './list-definitions.request';

@Injectable()
export default class ListDefinitionsService {
  private readonly logger = new Logger(ListDefinitionsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async getReferentielIndicateurDefinitions(identifiantsReferentiel: string[]) {
    this.logger.log(
      `Récupération des définitions des indicateurs ${identifiantsReferentiel.join(
        ','
      )}`
    );
    const definitions = await this.databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          identifiantsReferentiel
        )
      );
    this.logger.log(`${definitions.length} définitions trouvées`);
    return definitions;
  }

  /**
   * Charge la définition des indicateurs à partir de leur id
   * ainsi que les définitions des indicateurs "enfant" associés.
   * (utilisé pour l'export)
   */
  async getIndicateurDefinitions(
    collectiviteId: number,
    indicateurIds: number[]
  ): Promise<IndicateurDefinitionAvecEnfantsType[]> {
    this.logger.log(
      `Charge la définition des indicateurs ${indicateurIds.join(',')}`
    );

    const definitionEnfantsTable = aliasedTable(
      indicateurDefinitionTable,
      'enfants'
    );

    const definitions = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurDefinitionTable),
        enfants: sql`json_agg(${definitionEnfantsTable})`,
      })
      .from(indicateurDefinitionTable)
      .leftJoin(
        indicateurGroupeTable,
        eq(indicateurGroupeTable.parent, indicateurDefinitionTable.id)
      )
      .leftJoin(
        definitionEnfantsTable,
        eq(definitionEnfantsTable.id, indicateurGroupeTable.enfant)
      )
      .leftJoin(
        groupementTable,
        eq(groupementTable.id, definitionEnfantsTable.groupementId)
      )
      .leftJoin(
        groupementCollectiviteTable,
        eq(groupementCollectiviteTable.groupementId, groupementTable.id)
      )
      .where(
        and(
          inArray(indicateurDefinitionTable.id, indicateurIds),
          or(
            isNull(definitionEnfantsTable.groupementId),
            eq(groupementCollectiviteTable.collectiviteId, collectiviteId)
          )
        )
      )
      .groupBy(indicateurDefinitionTable.id);

    this.logger.log(`${definitions.length} définitions trouvées`);

    return definitions.map(
      (def: IndicateurDefinition & { enfants: unknown[] }) => {
        const enfants = def.enfants?.filter(Boolean);
        return {
          ...def,
          enfants: enfants?.length
            ? (objectToCamel(enfants) as IndicateurDefinition[])
            : null,
        };
      }
    );
  }

  /**
   * Renvoi les définitions détaillées d'indicateur à partir de leur id ou de
   * leur identifiant référentiel
   */
  async getDefinitionsDetaillees(
    data: ListDefinitionsRequest,
    tokenInfo: AuthUser
  ) {
    const { collectiviteId, indicateurIds, identifiantsReferentiel } = data;

    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperation.INDICATEURS_VISITE,
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Lecture des définitions détaillées d'indicateur id ${[
        ...(indicateurIds || []),
        identifiantsReferentiel || [],
      ].join(',')} pour la collectivité ${data.collectiviteId}`
    );

    const enfantsDefinition = aliasedTable(
      indicateurDefinitionTable,
      'enfants'
    );
    const enfantsGroupe = aliasedTable(indicateurGroupeTable, 'enfantsGroupe');
    const enfantsGroupement = aliasedTable(
      groupementTable,
      'enfantsGroupement'
    );
    const enfantGroupementCollectivite = aliasedTable(
      groupementCollectiviteTable,
      'enfantGroupementCollectivite'
    );

    const { identifiantReferentiel, ...cols } = getTableColumns(
      indicateurDefinitionTable
    );

    // sous-requête pour sélectionner les enfants rattachés à chaque définition trouvé
    const enfant = this.databaseService.db
      .selectDistinctOn([enfantsDefinition.identifiantReferentiel], {
        identifiant: enfantsDefinition.identifiantReferentiel,
        id: enfantsDefinition.id,
        titre: enfantsDefinition.titre,
        titreCourt: enfantsDefinition.titreCourt,
      })
      .from(enfantsDefinition)
      // enfants reliés au groupe
      .leftJoin(enfantsGroupe, eq(enfantsGroupe.enfant, enfantsDefinition.id))
      // filtrés sur les groupements de la collectivité
      .leftJoin(
        enfantsGroupement,
        eq(enfantsGroupement.id, enfantsDefinition.groupementId)
      )
      .leftJoin(
        enfantGroupementCollectivite,
        eq(enfantGroupementCollectivite.groupementId, enfantsGroupement.id)
      )
      .where(
        and(
          eq(enfantsGroupe.parent, indicateurDefinitionTable.id),
          or(
            isNull(enfantsDefinition.groupementId),
            eq(enfantGroupementCollectivite.collectiviteId, collectiviteId)
          )
        )
      )
      .orderBy(enfantsDefinition.identifiantReferentiel)
      .as('enfant');

    // sélectionne les définitions voulues
    const definitions = await this.databaseService.db
      .select({
        ...cols,
        identifiant: identifiantReferentiel,
        commentaire: indicateurCollectiviteTable.commentaire,
        confidentiel: indicateurCollectiviteTable.confidentiel,
        favoris: indicateurCollectiviteTable.favoris,
        categories: sql`array_remove(array_agg(distinct ${categorieTagTable.nom}), null)`,
        thematiques: sql`array_remove(array_agg(distinct ${thematiqueTable.nom}), null)`,
        enfants: sql`(select jsonb_agg(jsonb_build_object(
          'id', ${enfant.id},
          'identifiant', ${enfant.identifiant},
          'titre', ${enfant.titre},
          'titreCourt', ${enfant.titreCourt}
        )) from ${enfant})`,
        actions: sql`to_json(array_remove(array_agg(distinct ${indicateurActionTable.actionId}), null)) as actions`,
        hasOpenData: sql`bool_or(${indicateurValeurTable.metadonneeId} is not null and ${indicateurSourceMetadonneeTable.sourceId} != 'snbc')`,
        estPerso: sql`bool_or(${indicateurDefinitionTable.identifiantReferentiel} is null)`,
        estAgregation: sql`bool_or(${categorieTagTable.nom} = 'agregation')`,
      })
      .from(indicateurDefinitionTable)
      // infos complémentaires sur l'indicateur pour la collectivité
      .leftJoin(
        indicateurCollectiviteTable,
        and(
          eq(
            indicateurCollectiviteTable.indicateurId,
            indicateurDefinitionTable.id
          ),
          eq(indicateurCollectiviteTable.collectiviteId, collectiviteId)
        )
      )
      // catégories
      .leftJoin(
        indicateurCategorieTagTable,
        eq(
          indicateurCategorieTagTable.indicateurId,
          indicateurDefinitionTable.id
        )
      )
      .leftJoin(
        categorieTagTable,
        and(
          eq(categorieTagTable.id, indicateurCategorieTagTable.categorieTagId),
          or(
            isNull(categorieTagTable.collectiviteId),
            eq(categorieTagTable.collectiviteId, collectiviteId)
          )
        )
      )
      // thématiques
      .leftJoin(
        indicateurThematiqueTable,
        eq(indicateurThematiqueTable.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        thematiqueTable,
        eq(thematiqueTable.id, indicateurThematiqueTable.thematiqueId)
      )
      // définitions liées aux groupements de la collectivité
      .leftJoin(
        groupementTable,
        eq(groupementTable.id, indicateurDefinitionTable.groupementId)
      )
      .leftJoin(
        groupementCollectiviteTable,
        eq(groupementCollectiviteTable.groupementId, groupementTable.id)
      )
      // actions du référentiel
      .leftJoin(
        indicateurActionTable,
        eq(indicateurActionTable.indicateurId, indicateurDefinitionTable.id)
      )
      // valeurs (pour déterminer hasOpenData)
      .leftJoin(
        indicateurValeurTable,
        and(
          eq(indicateurValeurTable.indicateurId, indicateurDefinitionTable.id),
          eq(indicateurValeurTable.collectiviteId, collectiviteId)
        )
      )
      // source des valeurs (pour déterminer hasOpenData)
      .leftJoin(
        indicateurSourceMetadonneeTable,
        and(
          eq(
            indicateurSourceMetadonneeTable.id,
            indicateurValeurTable.metadonneeId
          )
        )
      )
      .where(
        and(
          or(
            indicateurIds?.length
              ? and(inArray(indicateurDefinitionTable.id, indicateurIds))
              : undefined,
            identifiantsReferentiel?.length
              ? inArray(
                  indicateurDefinitionTable.identifiantReferentiel,
                  identifiantsReferentiel
                )
              : undefined
          ),
          or(
            isNull(indicateurDefinitionTable.groupementId),
            eq(groupementCollectiviteTable.collectiviteId, collectiviteId)
          )
        )
      )
      .groupBy(
        indicateurDefinitionTable.id,
        indicateurCollectiviteTable.commentaire,
        indicateurCollectiviteTable.confidentiel,
        indicateurCollectiviteTable.favoris
      );

    this.logger.log(`${definitions.length} définitions trouvées`);

    return definitions as IndicateurDefinitionDetaillee[];
  }

  /**
   * Donne le chemin d'un indicateur à partir de son id
   */
  async getPath(data: GetPathRequest, tokenInfo: AuthUser) {
    const { collectiviteId, indicateurId } = data;
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperation.INDICATEURS_VISITE,
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Lecture du chemin de l'indicateur id ${indicateurId} pour la collectivité ${collectiviteId}`
    );

    // TODO: à changer quand `with recursive` sera supporté
    // ref: https://github.com/drizzle-team/drizzle-orm/issues/209
    const chemins = await this.databaseService.db.execute<{
      id: number;
      chemin: { id: number; identifiant?: string; titre: string }[];
    }>(sql`
          with recursive chemin_indicateur (id, identifiant_referentiel, chemin) as (
            select id,
              identifiant_referentiel,
              array [row_to_json(
                (select r from (select titre, id, identifiant_referentiel as identifiant) r)
              )]::jsonb []
            from indicateur_definition
            where id not in (
                select enfant
                from indicateur_groupe
              )
            union
            select t1.id,
              t1.identifiant_referentiel,
              array_append(
                t2.chemin,
                jsonb_build_object(
                  'titre',
                  coalesce(t1.titre_court, t1.titre),
                  'id',
                  t1.id,
                  'identifiant',
                  t1.identifiant_referentiel
                )
              )
            from indicateur_definition t1
              inner join indicateur_groupe g on t1.id = g.enfant
              inner join chemin_indicateur t2 on t2.id = g.parent
          )
          select *
          from chemin_indicateur
          where id = ${indicateurId}
        `);

    this.logger.log(`chemin ${chemins.rowCount ? '' : 'non'} trouvé`);

    return chemins.rows[0]?.chemin;
  }

  /** Donne le nombre d'indicateurs favoris de la collectivité */
  async getFavorisCount(data: GetFavorisCountRequest, tokenInfo: AuthUser) {
    const { collectiviteId } = data;
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperation.INDICATEURS_VISITE,
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Lecture du nombre d'indicateurs favoris de la collectivité ${collectiviteId}`
    );

    const rows = await this.databaseService.db
      .select({ value: count(indicateurCollectiviteTable.favoris) })
      .from(indicateurCollectiviteTable)
      .where(
        and(
          eq(indicateurCollectiviteTable.collectiviteId, collectiviteId),
          eq(indicateurCollectiviteTable.favoris, true)
        )
      );
    return rows[0]?.value ?? 0;
  }
}
