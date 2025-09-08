import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { Injectable, Logger } from '@nestjs/common';
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
import { collectiviteCardView } from '../../collectivites/shared/models/collectivite-card.view';
import { DatabaseService } from '../../utils/database/database.service';

import { indicateurSourceMetadonneeTable } from '@/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@/backend/indicateurs/shared/models/indicateur-source.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { indicateurValeurTable } from '../valeurs/indicateur-valeur.table';
import { GetMoyenneCollectivitesRequest } from './get-moyenne-collectivites.request';

@Injectable()
export default class ValeursMoyenneService {
  private readonly logger = new Logger(ValeursMoyenneService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly collectiviteService: CollectivitesService
  ) {}

  // TODO: à changer pour ne plus utiliser la vue `collectivite_card`
  async getTypeCollectivite(collectiviteId: number) {
    this.logger.log(
      `Récupération du type de la collectivité ${collectiviteId}`
    );

    const result = await this.databaseService.db
      .select({
        typeCollectivite: collectiviteCardView.typeCollectivite,
      })
      .from(collectiviteCardView)
      .where(eq(collectiviteCardView.collectiviteId, collectiviteId));

    return result?.[0]?.typeCollectivite || null;
  }

  /**
   * Donne la moyenne par date d'un indicateur pour les collectivités de même type
   */
  async getMoyenneCollectivites(
    options: GetMoyenneCollectivitesRequest,
    tokenInfo: AuthUser
  ) {
    const { collectiviteId, indicateurId } = options;

    // Vérifie les droits
    const collectivitePrivate = await this.collectiviteService.isPrivate(
      collectiviteId
    );
    await this.permissionService.isAllowed(
      tokenInfo,
      collectivitePrivate
        ? PermissionOperationEnum['INDICATEURS.LECTURE']
        : PermissionOperationEnum['INDICATEURS.VISITE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Récupération des valeurs moyenne d'un indicateur selon ces options : ${JSON.stringify(
        options
      )}`
    );

    const iv = aliasedTable(indicateurValeurTable, 'iv');
    const ism = aliasedTable(indicateurSourceMetadonneeTable, 'ism');
    const s = aliasedTable(indicateurSourceTable, 's');

    // TODO: à changer pour ne plus utiliser la vue `collectivite_card`
    const typeCollectivite = await this.getTypeCollectivite(collectiviteId);
    if (!typeCollectivite) {
      return null;
    }
    const cc = aliasedTable(collectiviteCardView, 'cc');

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
        .leftJoin(cc, eq(cc.collectiviteId, iv.collectiviteId))
        .leftJoin(ism, eq(iv.metadonneeId, ism.id))
        .leftJoin(s, eq(s.id, ism.sourceId))
        .where(
          and(
            eq(cc.typeCollectivite, typeCollectivite),
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
          valeur: sql`avg(${filteredSources.resultat})`
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

    return { typeCollectivite, valeurs };
  }
}
