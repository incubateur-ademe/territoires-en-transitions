import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  aliasedTable,
  and,
  asc,
  countDistinct,
  eq,
  isNotNull,
  max,
  ne,
  sql,
} from 'drizzle-orm';
import { DatabaseService } from '../../utils/database/database.service';

import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { ResourceType } from '@tet/domain/users';
import { indicateurValeurTable } from '../valeurs/indicateur-valeur.table';
import { GetMoyenneCollectivitesRequest } from './get-moyenne-collectivites.request';
import { ValeursMoyenneDTO } from './valeurs-moyenne.dto';

@Injectable()
export default class ValeursMoyenneService {
  private readonly logger = new Logger(ValeursMoyenneService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly collectiviteService: CollectivitesService
  ) {}

  /**
   * Donne la moyenne par date d'un indicateur pour les collectivités de même type
   */
  async getMoyenneCollectivites(
    options: GetMoyenneCollectivitesRequest,
    user?: AuthUser
  ): Promise<ValeursMoyenneDTO | null> {
    const { collectiviteId, indicateurId } = options;

    // Vérifie les droits if needed
    if (user) {
      const collectivitePrivate = await this.collectiviteService.isPrivate(
        collectiviteId
      );
      await this.permissionService.isAllowed(
        user,
        collectivitePrivate
          ? 'indicateurs.indicateurs.read_confidentiel'
          : 'indicateurs.indicateurs.read',
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }

    this.logger.log(
      `Récupération des valeurs moyenne d'un indicateur selon ces options : ${JSON.stringify(
        options
      )}`
    );

    const iv = aliasedTable(indicateurValeurTable, 'iv');
    const ism = aliasedTable(indicateurSourceMetadonneeTable, 'ism');
    const s = aliasedTable(indicateurSourceTable, 's');
    const c = aliasedTable(collectiviteTable, 'c');

    // type_collectivite selon la logique: epci + nature_insee S% -> syndicat, sinon nature_insee ou type
    const typeCollectiviteExpr = sql<string>`CASE
      WHEN ${c.type} = 'epci' THEN
        CASE WHEN ${c.natureInsee}::text ~~ 'S%' THEN 'syndicat'::text ELSE ${c.natureInsee} END
      ELSE ${c.type}
    END`;

    const typeCollectiviteResult = await this.databaseService.db
      .select({
        typeCollectivite: typeCollectiviteExpr,
      })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId))
      .limit(1)
      .then((result) => result[0]);

    if (!typeCollectiviteResult) {
      return null;
    }

    const { typeCollectivite } = typeCollectiviteResult;

    // sous-requête pour avoir toutes les valeurs disponibles pour les
    // collectivités de même type, et le rang d'affichage de la source associée
    // à chaque valeur
    const filteredSources = this.databaseService.db.$with('filteredSources').as(
      this.databaseService.db
        .select({
          collectiviteId: iv.collectiviteId,
          dateValeur: iv.dateValeur,
          resultat: iv.resultat,
          sourceId: ism.sourceId,
          sourceLibelle: s.libelle,
          ordreAffichage: s.ordreAffichage,
          rank: sql<number>`rank() over (partition by ${iv.indicateurId}, ${iv.dateValeur} order by ${s.ordreAffichage})`.as(
            'rank'
          ),
        })
        .from(iv)
        .innerJoin(c, eq(iv.collectiviteId, c.id))
        .leftJoin(ism, eq(iv.metadonneeId, ism.id))
        .leftJoin(s, eq(s.id, ism.sourceId))
        .where(
          and(
            sql`${typeCollectiviteExpr} IS NOT DISTINCT FROM ${typeCollectivite}`,
            isNotNull(iv.resultat),
            isNotNull(iv.metadonneeId),
            ne(ism.sourceId, 'snbc'),
            eq(iv.indicateurId, indicateurId)
          )
        )
    );

    // sous-requête pour avoir les résultats pour la meilleure source disponible
    // (celle avec le rang 1)
    const results = this.databaseService.db.$with('results').as(
      this.databaseService.db
        .select({
          sourceLibelle: filteredSources.sourceLibelle,
          dateValeur: filteredSources.dateValeur,
          valeur: sql`round(avg(${filteredSources.resultat})::numeric, 2)`
            .mapWith(Number)
            .as('valeur'),
          nbCollectivites: countDistinct(filteredSources.collectiviteId).as(
            'nbCollectivites'
          ),
        })
        .from(filteredSources)
        .where(eq(filteredSources.rank, 1))
        .groupBy(filteredSources.dateValeur, filteredSources.sourceLibelle)
        .orderBy(asc(filteredSources.dateValeur))
    );

    // sous-requête pour avoir le nombre de collectivités de l'année la plus renseignée
    const mostCompleted = this.databaseService.db.$with('mostCompleted').as(
      this.databaseService.db
        .select({
          total: max(results.nbCollectivites).as('total'),
        })
        .from(results)
    );

    // exécute la requête complète et filtre les résultats pour conserver que
    // ceux avec des données renseignées pour au moins 75% du nb de
    // collectivités pour l’année la plus renseignée
    const query = this.databaseService.db
      .with(filteredSources, results, mostCompleted)
      .select({
        sourceLibelle: results.sourceLibelle,
        dateValeur: results.dateValeur,
        valeur: results.valeur,
      })
      //---
      // équivalent à `from results, mostCompleted`
      .from(results)
      .leftJoin(mostCompleted, sql`true`)
      //---
      .where(
        sql`(${results.nbCollectivites}/${mostCompleted.total}::float) > 0.75`
      );

    const valeurs = await query;
    this.logger.log(
      `Récupération de ${valeurs.length} valeurs moyenne d'indicateur`
    );

    return {
      indicateurId,
      typeCollectivite: typeCollectivite ?? '',
      valeurs,
    };
  }
}
