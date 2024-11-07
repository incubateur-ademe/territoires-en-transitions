import { Injectable, Logger } from '@nestjs/common';
import DatabaseService from '../../common/services/database.service';
import { AuthService } from '../../auth/services/auth.service';
import {
  GetFilteredIndicateurRequestQueryOptionType,
  GetFilteredIndicateursRequestOptionType,
} from '../models/get-filtered-indicateurs.request';
import { sql, getTableName } from 'drizzle-orm';
import { isNil } from 'es-toolkit';
import { GetFilteredIndicateurResponseType } from '../models/get-filtered-indicateurs.response';
import type { SupabaseJwtPayload } from '../../auth/models/supabase-jwt.models';
import { indicateurValeurTable } from '../models/indicateur-valeur.table';
import { groupementCollectiviteTable } from '../../collectivites/models/groupement-collectivite.table';
import { indicateurDefinitionTable } from '../models/indicateur-definition.table';
import { indicateurGroupeTable } from '../models/indicateur-groupe.table';
import { categorieTagTable } from '../../taxonomie/models/categorie-tag.table';
import { indicateurCategorieTagTable } from '../models/indicateur-categorie-tag.table';
import { ficheActionTable } from '../../fiches/models/fiche-action.table';
import { axeTable } from '../../fiches/models/axe.table';
import { ficheActionAxeTable } from '../../fiches/models/fiche-action-axe.table';
import { serviceTagTable } from '../../taxonomie/models/service-tag.table';
import { indicateurThematiqueTable } from '../models/indicateur-thematique.table';
import { indicateurPiloteTable } from '../models/indicateur-pilote.table';
import { indicateurCollectiviteTable } from '../models/indicateur-collectivite.table';
import { indicateurActionTable } from '../models/indicateur-action.table';
import { ficheActionIndicateurTable } from '../../fiches/models/fiche-action-indicateur.table';
import { indicateurServiceTagTable } from '../models/indicateur-service-tag.table';

export type RequestResultIndicateursRaw = {
  id: number;
  identifiantReferentiel: string | null;
  titre: string | null;
  description: string | null;
  collectiviteId: number | null;
  groupementId: number | null;
  participationScore: boolean | null;
  valeurId: number | null;
  metadonneeId: number | null;
  categorieNom?: string | null;
  planId?: number | null;
  ficheId?: number | null;
  axeId?: number | null;
  serviceId?: number | null;
  thematiqueId?: number | null;
  piloteUserId?: string | null;
  piloteTagId?: number | null;
  confidentiel?: boolean | null;
  favoris?: boolean | null;
  parent?: number | null;
  enfant?: number | null;
  actionId?: string | null;
};
export type IndicateurGroupedWithSetType = {
  id: number;
  identifiantReferentiel: string | null;
  titre: string | null;
  description: string | null;
  collectiviteId: number | null;
  groupementId: number | null;
  participationScore: boolean | null;
  confidentiel?: boolean | null;
  favoris?: boolean | null;
  categorieNoms: Set<string>;
  planIds: Set<number>;
  ficheIds: Set<number>;
  serviceIds: Set<number>;
  thematiqueIds: Set<number>;
  piloteUserIds: Set<string>;
  piloteTagIds: Set<number>;
  parents: Set<number>;
  enfants: Set<number>;
  actionIds: Set<string>;
  participationScoreEnfant: boolean | null;
  confidentielEnfant?: boolean | null;
  favorisEnfant?: boolean | null;
  hasFichesNonClassees: boolean;
  isCompleted: boolean;
  hasOpenData: boolean;
  categorieNomsEnfant: Set<string>;
  planIdsEnfant: Set<number>;
  ficheIdsEnfant: Set<number>;
  serviceIdsEnfant: Set<number>;
  thematiqueIdsEnfant: Set<number>;
  piloteUserIdsEnfant: Set<string>;
  piloteTagIdsEnfant: Set<number>;
  hasFichesNonClasseesEnfant: boolean;
  isCompletedEnfant: boolean;
  hasOpenDataEnfant: boolean;
};

export type IndicateurGroupedWithArrayType = {
  [K in keyof IndicateurGroupedWithSetType]: IndicateurGroupedWithSetType[K] extends Set<
    infer U
  >
    ? U[]
    : IndicateurGroupedWithSetType[K];
};

@Injectable()
export default class IndicateurFiltreService {
  private readonly logger = new Logger(IndicateurFiltreService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService
  ) {}

  /**
   * Récupérer les indicateurs de la collectivité correspondant aux filters donnés dans "filters"
   * @param collectiviteId identifiant de la collectivité
   * @param filters filtres à appliquer
   * @param queryOptions options de tri, limite, pagination
   * @param tokenInfo
   * @return un tableau d'indicateurs dans un format "carte"
   */
  async getFilteredIndicateurs(
    collectiviteId: number,
    filters: GetFilteredIndicateursRequestOptionType,
    queryOptions: GetFilteredIndicateurRequestQueryOptionType,
    tokenInfo: SupabaseJwtPayload
  ): Promise<GetFilteredIndicateurResponseType[]> {
    // Vérifie les droits
    await this.authService.verifieAccesRestreintCollectivite(
      tokenInfo,
      collectiviteId
    );
    // Vérifie s'il faut inclure les enfants dans le retour filtré ou dans le filtre des parents
    const avecEnfant =
      filters.avecEnfants === true ||
      (filters.text && filters.text.startsWith('#')) === true;

    // Crée la requête pour avoir tous les indicateurs de la collectivité ainsi que leurs tables liées utiles aux filters voulus
    const query = this.getQueryString(collectiviteId, filters);

    // Exécute la requête
    const indicateursRaw = await this.getIndicateursCollectiviteWithDetails(
      query
    );

    // Regroupe dans un premier temps toutes les données par indicateur, puis dans un second temps par indicateur parent si besoin
    const indicateursGrouped = this.groupDetailsIndicateurs(
      indicateursRaw,
      avecEnfant
    );

    // Applique les filters aux indicateurs
    const indicateursFiltered = this.applyFilters(
      indicateursGrouped,
      filters,
      avecEnfant
    );

    // Applique le tri
    const indicateursSorted = this.applySorts(
      indicateursFiltered,
      queryOptions
    );

    return indicateursSorted.map((indicateur) => ({
      id: indicateur.id,
      titre: indicateur.titre,
      estPerso: !isNil(indicateur.collectiviteId),
      identifiant: indicateur.identifiantReferentiel,
      hasOpenData: indicateur.hasOpenDataEnfant,
    }));
  }

  /**
   * Créé la requête permettant de récupérer les indicateurs de la collectivité ainsi que les tables liées utiles aux filtres voulus.
   * Applique le filtre filters.estPerso
   * @param collectiviteId
   * @param filters
   * @return la requête sous forme textuelle
   */
  getQueryString(
    collectiviteId: number,
    filters: GetFilteredIndicateursRequestOptionType
  ): string {
    // Conditions utilisées pour les indicateurs et les catégories
    const conditionCollectivite = `${indicateurDefinitionTable.collectiviteId.name} = ${collectiviteId}`;
    const conditionCollectiviteGroupement = `(${indicateurDefinitionTable.collectiviteId.name} IS NULL
    AND ${indicateurDefinitionTable.groupementId.name} IS NULL)
    OR ${conditionCollectivite}
    OR ${indicateurDefinitionTable.groupementId.name} IN (
    SELECT ${groupementCollectiviteTable.groupementId.name} FROM groupements
    )`;
    // Filtre sur estPerso
    const conditionCollectivitePerso = filters.estPerso
      ? conditionCollectivite
      : conditionCollectiviteGroupement;

    // Début de la requête
    // Ne récupère que les indicateurs concernés par la collectivité
    // Ajoute les projections non optionnelles
    let query = `
      WITH groupements AS (SELECT DISTINCT ${
        groupementCollectiviteTable.groupementId.name
      }
                           FROM ${getTableName(groupementCollectiviteTable)}
                           WHERE ${
                             groupementCollectiviteTable.collectiviteId.name
                           } = ${collectiviteId}),
           indicateurs AS (SELECT *
                           FROM ${getTableName(indicateurDefinitionTable)}
                           WHERE ${conditionCollectivitePerso})
      SELECT i.${indicateurDefinitionTable.id.name},
             i.${
               indicateurDefinitionTable.identifiantReferentiel.name
             }                                                AS "identifiantReferentiel",
             i.${indicateurDefinitionTable.titre.name},
             i.${indicateurDefinitionTable.description.name},
             i.${
               indicateurDefinitionTable.collectiviteId.name
             }                                                AS "collectiviteId",
             i.${indicateurDefinitionTable.groupementId.name} AS "groupementId",
             i.${
               indicateurDefinitionTable.participationScore.name
             }                                                AS "participationScore",
             v.${indicateurValeurTable.id.name}               AS "valeurId",
             v.${indicateurValeurTable.metadonneeId.name}     AS "metadonneeId",
             ig_parent.${indicateurGroupeTable.parent.name}   AS parent,
             ig_enfant.${indicateurGroupeTable.enfant.name}   AS enfant`;

    // Ajoute les projections nécessaires aux filtres voulus
    // Si filtre sur les catégories
    if (filters.categorieNoms && filters.categorieNoms.length > 0) {
      query = `${query},
        ct.${categorieTagTable.nom.name} AS "categorieNom"`;
    }
    // Si filtre sur les plans
    if (filters.planActionIds && filters.planActionIds.length > 0) {
      query = `${query},
        plan.${axeTable.id.name} AS "planId"`;
    }
    // Si filtre sur les fiches
    if (
      (filters.ficheActionIds && filters.ficheActionIds.length > 0) ||
      filters.fichesNonClassees
    ) {
      query = `${query},
        fa.${ficheActionTable.id.name} AS "ficheId"`;
    }
    // Si filtre sur les axes
    if (filters.fichesNonClassees) {
      query = `${query},
        faa.${ficheActionAxeTable.axeId.name} AS "axeId"`;
    }
    // Si filtre sur les services
    if (filters.servicePiloteIds && filters.servicePiloteIds.length > 0) {
      query = `${query},
        st.${serviceTagTable.id.name} AS "serviceId"`;
    }
    // Si filtre sur les thématiques
    if (filters.thematiqueIds && filters.thematiqueIds.length > 0) {
      query = `${query},
        it.${indicateurThematiqueTable.thematiqueId.name} AS "thematiqueId"`;
    }
    // Si filtre sur les pilotes
    if (
      filters.utilisateurPiloteIds &&
      filters.utilisateurPiloteIds.length > 0
    ) {
      query = `${query},
        ip.${indicateurPiloteTable.userId.name} AS "piloteUserId"`;
    }
    if (filters.personnePiloteIds && filters.personnePiloteIds.length > 0) {
      query = `${query},
        ip.${indicateurPiloteTable.tagId.name} AS "piloteTagId"`;
    }
    // Si filtre sur la confidentialité
    if (filters.estConfidentiel) {
      query = `${query}
      ,
        c.${indicateurCollectiviteTable.confidentiel.name} AS confidentiel`;
    }
    // Si filtre sur favoris
    if (filters.estFavorisCollectivite) {
      query = `${query}
      ,
        c.${indicateurCollectiviteTable.favoris.name} AS favoris`;
    }
    // Si filtre sur les actions
    if (filters.actionId) {
      query = `${query}
      ,
        ia.${indicateurActionTable.actionId.name} AS "actionId"`;
    }

    // Indique la table concernée et fait les jointures non optionnelles
    query = `${query}
    FROM indicateurs i
                  LEFT JOIN LATERAL (
                  SELECT ${indicateurValeurTable.id.name}, ${
      indicateurValeurTable.metadonneeId.name
    }
      FROM ${getTableName(indicateurValeurTable)}
      WHERE ${indicateurValeurTable.collectiviteId.name} = ${collectiviteId}
        AND ${indicateurValeurTable.indicateurId.name} = i.id
                  ) v ON true
                  LEFT JOIN ${getTableName(
                    indicateurGroupeTable
                  )} ig_parent ON i.id = ig_parent.${
      indicateurGroupeTable.enfant.name
    }
                  LEFT JOIN ${getTableName(
                    indicateurGroupeTable
                  )} ig_enfant ON i.id = ig_enfant.${
      indicateurGroupeTable.parent.name
    }`;

    // Ajoute les jointures nécessaires aux filtres voulus
    // Si filtre sur les catégories
    if (filters.categorieNoms && filters.categorieNoms.length > 0) {
      query = `${query}
                    LEFT JOIN LATERAL (
          SELECT ct.${categorieTagTable.nom.name}
          FROM ${getTableName(categorieTagTable)} ct
                 JOIN ${getTableName(indicateurCategorieTagTable)} ict ON ct.${
        categorieTagTable.id.name
      } = ict.${indicateurCategorieTagTable.categorieTagId.name}
          WHERE ict.${indicateurCategorieTagTable.indicateurId.name} = i.${
        indicateurDefinitionTable.id.name
      }
            AND (${conditionCollectivitePerso})
            ) ct ON true
      `;
    }

    // Si filtre sur les fiches
    if (
      filters.fichesNonClassees ||
      (filters.ficheActionIds && filters.ficheActionIds.length > 0) ||
      (filters.planActionIds && filters.planActionIds.length > 0)
    ) {
      query = `${query}
                    LEFT JOIN LATERAL (
          SELECT fa.${ficheActionTable.id.name}
          FROM ${getTableName(ficheActionTable)} fa
                 JOIN ${getTableName(ficheActionIndicateurTable)} fai ON fa.${
        ficheActionTable.id.name
      } = fai.${ficheActionIndicateurTable.ficheId.name}
          WHERE fa.${ficheActionTable.collectiviteId.name} = ${collectiviteId}
            AND fai.${ficheActionIndicateurTable.indicateurId.name} = i.${
        indicateurDefinitionTable.id.name
      }
            ) fa ON true
      `;
    }

    // Si filtre sur la confidentialité
    if (filters.estConfidentiel || filters.estFavorisCollectivite) {
      query = `${query}
                    LEFT JOIN ${getTableName(
                      indicateurCollectiviteTable
                    )} c ON i.${indicateurDefinitionTable.id.name} = c.${
        indicateurCollectiviteTable.indicateurId.name
      } AND c.${
        indicateurCollectiviteTable.collectiviteId.name
      } = ${collectiviteId}
      `;
    }
    // Si filtre sur les axes
    if (
      filters.fichesNonClassees ||
      (filters.planActionIds && filters.planActionIds.length > 0)
    ) {
      query = `${query}
                    LEFT JOIN ${getTableName(ficheActionAxeTable)} faa ON fa.${
        ficheActionTable.id.name
      } = faa.${ficheActionAxeTable.ficheId.name}
                    LEFT JOIN ${getTableName(axeTable)} ON faa.${
        ficheActionAxeTable.axeId.name
      } = axe.${axeTable.id.name}
      `;
      if (filters.planActionIds && filters.planActionIds.length > 0) {
        query = `${query}
                      LEFT JOIN ${getTableName(axeTable)} plan ON axe.${
          axeTable.plan.name
        } = plan.${axeTable.id.name}
        `;
      }
    }
    // Si filtre sur les services
    if (filters.servicePiloteIds && filters.servicePiloteIds.length > 0) {
      query = `${query}
                    LEFT JOIN ${getTableName(
                      indicateurServiceTagTable
                    )} ist ON i.${indicateurDefinitionTable.id.name} = ist.${
        indicateurServiceTagTable.indicateurId.name
      }
                    LEFT JOIN ${getTableName(serviceTagTable)} st ON ist.${
        indicateurServiceTagTable.serviceTagId.name
      } = st.${serviceTagTable.id.name} AND st.${
        serviceTagTable.collectiviteId.name
      } = ${collectiviteId}`;
    }
    // Si filtre sur les thématiques
    if (filters.thematiqueIds && filters.thematiqueIds.length > 0) {
      query = `${query}
                    LEFT JOIN ${getTableName(
                      indicateurThematiqueTable
                    )} it ON i.${indicateurDefinitionTable.id.name} = it.${
        indicateurThematiqueTable.indicateurId.name
      }`;
    }
    // Si filtre sur les pilotes
    if (
      (filters.utilisateurPiloteIds &&
        filters.utilisateurPiloteIds.length > 0) ||
      (filters.personnePiloteIds && filters.personnePiloteIds.length > 0)
    ) {
      query = `${query}
                    LEFT JOIN ${getTableName(indicateurPiloteTable)} ip ON i.${
        indicateurDefinitionTable.id.name
      } = ip.${indicateurPiloteTable.indicateurId.name} AND ip.${
        indicateurPiloteTable.collectiviteId.name
      } = ${collectiviteId}`;
    }
    // Si filtre sur les actions
    if (filters.actionId) {
      query = `${query}
                    LEFT JOIN ${getTableName(indicateurActionTable)} ia ON i.${
        indicateurDefinitionTable.id.name
      } = ia.${indicateurActionTable.indicateurId.name}
      `;
    }
    return query;
  }

  /**
   * Exécute la requête permettant de récupérer les indicateurs de la collectivité ainsi que les tables liées utiles aux filtres voulus.
   * Applique le filtre filters.estPerso
   * @param query
   * @return le résultat brut de la requête
   */
  private async getIndicateursCollectiviteWithDetails(
    query: string
  ): Promise<RequestResultIndicateursRaw[]> {
    try {
      const result = await this.databaseService.db.execute(sql.raw(query));
      return result.map((row) => ({
        id: row.id as number,
        identifiantReferentiel: row.identifiantReferentiel as string | null,
        titre: row.titre as string | null,
        description: row.description as string | null,
        collectiviteId: row.collectiviteId as number | null,
        groupementId: row.groupementId as number | null,
        participationScore: row.participationScore as boolean | null,
        valeurId: row.valeurId as number | null,
        metadonneeId: row.metadonneeId as number | null,
        categorieNom: row.categorieNom as string | null,
        planId: row.planId as number | null,
        ficheId: row.ficheId as number | null,
        axeId: row.axeId as number | null,
        serviceId: row.serviceId as number | null,
        thematiqueId: row.thematiqueId as number | null,
        piloteUserId: row.piloteUserId as string | null,
        piloteTagId: row.piloteTagId as number | null,
        confidentiel: row.confidentiel as boolean | null,
        favoris: row.favoris as boolean | null,
        parent: row.parent as number | null,
        enfant: row.enfant as number | null,
        actionId: row.actionId as string | null,
      })) as RequestResultIndicateursRaw[];
    } catch (error) {
      throw new Error(`${error}`);
    }
  }

  /**
   * - Groupe le résultat brut de la requête par indicateur
   * - Si besoin applique un deuxième groupage par indicateur parent (fusionne les données des enfants)
   * @param indicateurs
   * @param avecEnfant
   * @return les données groupées par indicateurs
   */
  groupDetailsIndicateurs(
    indicateurs: RequestResultIndicateursRaw[],
    avecEnfant: boolean
  ): IndicateurGroupedWithArrayType[] {
    const groupedResults = new Map<
      number,
      {
        id: number;
        identifiantReferentiel: string | null;
        titre: string | null;
        description: string | null;
        collectiviteId: number | null;
        groupementId: number | null;
        participationScore: boolean | null;
        confidentiel?: boolean | null;
        favoris?: boolean | null;
        categorieNoms: Set<string>;
        planIds: Set<number>;
        ficheIds: Set<number>;
        serviceIds: Set<number>;
        thematiqueIds: Set<number>;
        piloteUserIds: Set<string>;
        piloteTagIds: Set<number>;
        parents: Set<number>;
        enfants: Set<number>;
        actionIds: Set<string>;
        participationScoreEnfant: boolean | null;
        confidentielEnfant?: boolean | null;
        favorisEnfant?: boolean | null;
        hasFichesNonClassees: boolean;
        isCompleted: boolean;
        hasOpenData: boolean;
        categorieNomsEnfant: Set<string>;
        planIdsEnfant: Set<number>;
        ficheIdsEnfant: Set<number>;
        serviceIdsEnfant: Set<number>;
        thematiqueIdsEnfant: Set<number>;
        piloteUserIdsEnfant: Set<string>;
        piloteTagIdsEnfant: Set<number>;
        hasFichesNonClasseesEnfant: boolean;
        isCompletedEnfant: boolean;
        hasOpenDataEnfant: boolean;
      }
    >();
    // Parcours le résultat de la requête pour regrouper les tables liés à un même indicateur sous des sets
    indicateurs.forEach((row) => {
      // Récupère l'objet correspondant à l'indicateur en cours ou le créé s'il n'existe pas encore
      let indicateur = groupedResults.get(row.id);
      if (!indicateur) {
        indicateur = {
          id: row.id,
          identifiantReferentiel: row.identifiantReferentiel,
          titre: row.titre,
          description: row.description,
          collectiviteId: row.collectiviteId,
          groupementId: row.groupementId,
          participationScore: row.participationScore,
          confidentiel: row.confidentiel,
          favoris: row.favoris,
          categorieNoms: new Set(),
          planIds: new Set(),
          ficheIds: new Set(),
          serviceIds: new Set(),
          thematiqueIds: new Set(),
          piloteUserIds: new Set(),
          piloteTagIds: new Set(),
          parents: new Set(),
          enfants: new Set(),
          actionIds: new Set(),
          hasFichesNonClassees: false,
          isCompleted: false,
          hasOpenData: false,
          participationScoreEnfant: row.participationScore,
          confidentielEnfant: row.confidentiel,
          favorisEnfant: row.favoris,
          categorieNomsEnfant: new Set(),
          planIdsEnfant: new Set(),
          ficheIdsEnfant: new Set(),
          serviceIdsEnfant: new Set(),
          thematiqueIdsEnfant: new Set(),
          piloteUserIdsEnfant: new Set(),
          piloteTagIdsEnfant: new Set(),
          hasFichesNonClasseesEnfant: false,
          isCompletedEnfant: false,
          hasOpenDataEnfant: false,
        };
        groupedResults.set(row.id, indicateur);
      }

      // Met à jour les différents sets
      if (row.categorieNom) {
        indicateur.categorieNoms.add(row.categorieNom);
        indicateur.categorieNomsEnfant.add(row.categorieNom);
      }
      if (row.planId) {
        indicateur.planIds.add(row.planId);
        indicateur.planIdsEnfant.add(row.planId);
      }
      if (row.ficheId) {
        indicateur.ficheIds.add(row.ficheId);
        indicateur.ficheIdsEnfant.add(row.ficheId);
      }
      if (row.serviceId) {
        indicateur.serviceIds.add(row.serviceId);
        indicateur.serviceIdsEnfant.add(row.serviceId);
      }
      if (row.thematiqueId) {
        indicateur.thematiqueIds.add(row.thematiqueId);
        indicateur.thematiqueIdsEnfant.add(row.thematiqueId);
      }
      if (row.piloteUserId) {
        indicateur.piloteUserIds.add(row.piloteUserId);
        indicateur.piloteUserIdsEnfant.add(row.piloteUserId);
      }
      if (row.piloteTagId) {
        indicateur.piloteTagIds.add(row.piloteTagId);
        indicateur.piloteTagIdsEnfant.add(row.piloteTagId);
      }
      if (row.parent) {
        indicateur.parents.add(row.parent);
      }
      if (row.enfant) {
        indicateur.enfants.add(row.enfant);
      }
      if (row.actionId) {
        indicateur.actionIds.add(row.actionId);
      }
      // Vérifie s'il y a une fiche non classée
      if (row.ficheId && !row.axeId) {
        indicateur.hasFichesNonClassees = true;
        indicateur.hasFichesNonClasseesEnfant = true;
      }

      if (row.valeurId) {
        if (row.metadonneeId) {
          // Vérifie s'il existe des valeurs open data
          indicateur.hasOpenData = true;
          indicateur.hasOpenDataEnfant = true;
        } else {
          // Vérifie s'il existe des valeurs utilisateurs
          indicateur.isCompleted = true;
          indicateur.isCompletedEnfant = true;
        }
      }
    });

    // On groupe les parents avec les enfants si on ne souhaite pas retourner les enfants directement
    if (!avecEnfant) {
      // Parcours les indicateurs pour fusionner les valeurs des sets enfants et parents afin de faciliter les filtres
      groupedResults.forEach((indicateur) => {
        if (indicateur.enfants.size > 0) {
          for (const enfantId of indicateur.enfants) {
            const enfant = groupedResults.get(enfantId);
            if (enfant) {
              indicateur.participationScoreEnfant =
                indicateur.participationScoreEnfant ||
                enfant.participationScore;
              indicateur.confidentielEnfant =
                indicateur.confidentielEnfant || enfant.confidentiel;
              indicateur.favorisEnfant =
                indicateur.favorisEnfant || enfant.favoris;
              indicateur.isCompletedEnfant =
                indicateur.isCompletedEnfant || enfant.isCompleted;
              indicateur.hasOpenDataEnfant =
                indicateur.hasOpenDataEnfant || enfant.hasOpenData;
              indicateur.hasFichesNonClasseesEnfant =
                indicateur.hasFichesNonClasseesEnfant ||
                enfant.hasFichesNonClassees;
              enfant.categorieNoms.forEach(
                indicateur.categorieNomsEnfant.add,
                indicateur.categorieNomsEnfant
              );
              enfant.planIds.forEach(
                indicateur.planIdsEnfant.add,
                indicateur.planIdsEnfant
              );
              enfant.ficheIds.forEach(
                indicateur.ficheIdsEnfant.add,
                indicateur.ficheIdsEnfant
              );
              enfant.serviceIds.forEach(
                indicateur.serviceIdsEnfant.add,
                indicateur.serviceIdsEnfant
              );
              enfant.thematiqueIds.forEach(
                indicateur.thematiqueIdsEnfant.add,
                indicateur.thematiqueIdsEnfant
              );
              enfant.piloteUserIds.forEach(
                indicateur.piloteUserIdsEnfant.add,
                indicateur.piloteUserIdsEnfant
              );
              enfant.piloteTagIds.forEach(
                indicateur.piloteTagIdsEnfant.add,
                indicateur.piloteTagIdsEnfant
              );
            }
          }
        }
      });
    }

    // Transforme la map et les sets en tableau pour faciliter leur lecture
    return Array.from(groupedResults.values()).map((item) => ({
      ...item,
      categorieNoms: Array.from(item.categorieNoms),
      planIds: Array.from(item.planIds),
      ficheIds: Array.from(item.ficheIds),
      serviceIds: Array.from(item.serviceIds),
      thematiqueIds: Array.from(item.thematiqueIds),
      piloteUserIds: Array.from(item.piloteUserIds),
      piloteTagIds: Array.from(item.piloteTagIds),
      parents: Array.from(item.parents),
      enfants: Array.from(item.enfants),
      actionIds: Array.from(item.actionIds),
      categorieNomsEnfant: Array.from(item.categorieNomsEnfant),
      planIdsEnfant: Array.from(item.planIdsEnfant),
      ficheIdsEnfant: Array.from(item.ficheIdsEnfant),
      serviceIdsEnfant: Array.from(item.serviceIdsEnfant),
      thematiqueIdsEnfant: Array.from(item.thematiqueIdsEnfant),
      piloteUserIdsEnfant: Array.from(item.piloteUserIdsEnfant),
      piloteTagIdsEnfant: Array.from(item.piloteTagIdsEnfant),
      // TODO enlever champs non utilisés
    }));
  }

  /**
   * Applique les filtres aux indicateurs
   * @param indicateursGrouped
   * @param options
   * @param avecEnfant
   * @return les indicateurs filtrés
   */
  applyFilters(
    indicateursGrouped: IndicateurGroupedWithArrayType[],
    options: GetFilteredIndicateursRequestOptionType,
    avecEnfant: boolean
  ) {
    return indicateursGrouped.filter((indicateur) => {
      // Créé les conditions selon les filtres
      const parents = avecEnfant
        ? true
        : !indicateur.parents || indicateur.parents.length === 0;
      const participationScore = options.participationScore
        ? indicateur.participationScoreEnfant === true
        : true;
      const estConfidentiel = options.estConfidentiel
        ? indicateur.confidentielEnfant === true
        : true;
      const estFavorisCollectivite = options.estFavorisCollectivite
        ? indicateur.favorisEnfant === true
        : true;
      const hasOpenData = options.hasOpenData
        ? indicateur.hasOpenDataEnfant
        : true;
      const categoriesNoms =
        options.categorieNoms && options.categorieNoms.length > 0
          ? this.hasCommunElement(
              options.categorieNoms,
              indicateur.categorieNomsEnfant
            )
          : true;
      const planActionIds =
        options.planActionIds && options.planActionIds.length > 0
          ? this.hasCommunElement(
              options.planActionIds,
              indicateur.planIdsEnfant
            )
          : true;
      const ficheActionIds =
        options.ficheActionIds && options.ficheActionIds.length > 0
          ? this.hasCommunElement(
              options.ficheActionIds,
              indicateur.ficheIdsEnfant
            )
          : true;
      const fichesNonClassees = options.fichesNonClassees
        ? indicateur.hasFichesNonClassees
        : true;
      const servicePiloteIds =
        options.servicePiloteIds && options.servicePiloteIds.length > 0
          ? this.hasCommunElement(
              options.servicePiloteIds,
              indicateur.serviceIdsEnfant
            )
          : true;
      const thematiqueIds =
        options.thematiqueIds && options.thematiqueIds.length > 0
          ? this.hasCommunElement(
              options.thematiqueIds,
              indicateur.thematiqueIdsEnfant
            )
          : true;
      const personnePiloteIds =
        options.personnePiloteIds && options.personnePiloteIds.length > 0
          ? this.hasCommunElement(
              options.personnePiloteIds,
              indicateur.piloteTagIdsEnfant
            )
          : true;
      const utilisateurPiloteIds =
        options.utilisateurPiloteIds && options.utilisateurPiloteIds.length > 0
          ? this.hasCommunElement(
              options.utilisateurPiloteIds,
              indicateur.piloteUserIdsEnfant
            )
          : true;
      const estComplet =
        options.estComplet === true
          ? indicateur.isCompletedEnfant
          : options.estComplet === false
          ? !indicateur.isCompletedEnfant
          : true;

      let text = true;
      if (options.text) {
        const nmText = this.normalizeString(options.text);
        if (options.text.startsWith('#')) {
          text = indicateur.identifiantReferentiel
            ? nmText.slice(1) ===
              this.normalizeString(indicateur.identifiantReferentiel)
            : false;
        } else {
          text =
            (indicateur.description
              ? this.normalizeString(indicateur.description).includes(nmText)
              : false) ||
            (indicateur.titre
              ? this.normalizeString(indicateur.titre).includes(nmText)
              : false);
        }
      }
      // TODO aller chercher dans les enfants ?
      const actionId = options.actionId
        ? this.hasCommunElement([options.actionId], indicateur.actionIds)
        : true;

      // Applique les conditions
      return (
        parents &&
        participationScore &&
        estConfidentiel &&
        estFavorisCollectivite &&
        hasOpenData &&
        categoriesNoms &&
        planActionIds &&
        ficheActionIds &&
        fichesNonClassees &&
        servicePiloteIds &&
        thematiqueIds &&
        personnePiloteIds &&
        utilisateurPiloteIds &&
        estComplet &&
        text &&
        actionId
      );
    });
  }

  /**
   * Applique le tri aux indicateurs
   * @param indicateurs
   * @param queryOptions
   * @return les indicateurs triés
   */
  applySorts(
    indicateurs: IndicateurGroupedWithArrayType[],
    queryOptions: GetFilteredIndicateurRequestQueryOptionType
  ) {
    // Tri par défault par ordre alphabétique
    let toReturn = indicateurs.sort((a, b) => {
      if (a.titre === null && b.titre === null) return 0;
      if (a.titre === null) return -1;
      if (b.titre === null) return 1;
      return a.titre.localeCompare(b.titre, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
    // Tri une seconde fois si demandé par complétude
    if (queryOptions?.sort?.at(0)?.field === 'estComplet') {
      toReturn = toReturn.sort((a, b) => {
        return Number(a.isCompletedEnfant) - Number(b.isCompletedEnfant);
      });
    }
    return toReturn;
  }

  /**
   * Retourne vrai si au moins un élément est commun dans les deux tableaux
   * @param array1
   * @param array2
   */
  private hasCommunElement(array1: any[], array2: any[]): boolean {
    const set1 = new Set(array1);
    return array2.some((element) => set1.has(element));
  }

  /**
   * Normalise une chaîne de caractère
   * @param str
   */
  private normalizeString(str: string): string {
    return str
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .toLowerCase() // Met tout en minuscules
      .trim() // Supprime les espaces en début et en fin
      .replace(/\s+/g, ' '); // Remplace les espaces multiples par un seul espace
  }
}
