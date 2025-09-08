import { RecherchesCollectivite } from '@/backend/collectivites/recherches/collectivites.response';
import { FiltersRequest } from '@/backend/collectivites/recherches/filters.request';
import {
  filtreIntervalleTable,
  typeIntervalle,
} from '@/backend/collectivites/recherches/filtre-intervalle.table';
import { RecherchesPlan } from '@/backend/collectivites/recherches/plans.response';
import { RecherchesReferentiel } from '@/backend/collectivites/recherches/referentiels.response';
import {
  collectiviteBanaticSubType,
  collectiviteBanaticTypeTable,
} from '@/backend/collectivites/shared/models/collectivite-banatic-type.table';
import {
  collectiviteTable,
  collectiviteTypeEnum,
} from '@/backend/collectivites/shared/models/collectivite.table';
import { membreTable } from '@/backend/collectivites/shared/models/membre.table';
import { indicateurValeurTable } from '@/backend/indicateurs/valeurs/indicateur-valeur.table';
import { axeTable } from '@/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionPiloteTable } from '@/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { planActionTypeTable } from '@/backend/plans/fiches/shared/models/plan-action-type.table';
import { labellisationTable } from '@/backend/referentiels/labellisations/labellisation.table';
import { SnapshotJalonEnum } from '@/backend/referentiels/snapshots/snapshot-jalon.enum';
import { snapshotTable } from '@/backend/referentiels/snapshots/snapshot.table';
import { PermissionLevelEnum } from '@/backend/users/authorizations/roles/permission-level.enum';
import { utilisateurPermissionTable } from '@/backend/users/authorizations/roles/private-utilisateur-droit.table';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { getTableName, sql } from 'drizzle-orm';

/** Type of view */
const tabEnum = {
  Collectivite: 'collectivite',
  Referentiel: 'referentiel',
  Plan: 'plan',
} as const;
/** Type of view */
type Tab = (typeof tabEnum)[keyof typeof tabEnum];

@Injectable()
export default class RecherchesService {
  private readonly logger = new Logger(RecherchesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get view for "Collectivités" tab
   * @param filters
   */
  async collectivites(
    filters: FiltersRequest
  ): Promise<{ count: number; items: RecherchesCollectivite[] }> {
    // Create the query
    const query = `WITH ${this.getFilteredCollectivitesQuery(
      filters,
      tabEnum.Collectivite
    )},
    ${this.getContactsQuery(
      `pud.${utilisateurPermissionTable.permissionLevel.name} = '${PermissionLevelEnum.ADMIN}'`
    )}
    SELECT  c.collectiviteId as "collectiviteId",
            c.collectiviteNom as "collectiviteNom",
            (
              SELECT COUNT(DISTINCT ${indicateurValeurTable.indicateurId.name})
              FROM ${getTableName(indicateurValeurTable)}
              WHERE ${
                indicateurValeurTable.collectiviteId.name
              } = c.collectiviteId
            ) AS "nbIndicateurs",
            (
              SELECT COUNT(*)
              FROM ${getTableName(axeTable)}
              WHERE ${axeTable.collectiviteId.name} = c.collectiviteId
              AND ${axeTable.parent.name} IS NULL
            ) AS "nbPlans",
            c.etoilesEci as "etoilesEci",
            c.etoilesCae as "etoilesCae",
            ${this.getContactsProjection()}
    FROM filteredCollectivites c
    ORDER BY ${this.getOrderBy(filters, tabEnum.Collectivite)}`;

    // Execute the query
    const result = await this.databaseService.db.execute(sql.raw(query));
    const allRows = result.rows.map((row) => ({
      ...row,
    })) as RecherchesCollectivite[];

    return this.paginate(allRows, filters.nbCards, filters.page);
  }

  /**
   * Get view for "Référentiel" tab
   * @param filters
   */
  async referentiels(
    filters: FiltersRequest
  ): Promise<{ count: number; items: RecherchesReferentiel[] }> {
    // Create the query
    const query = `WITH ${this.getFilteredCollectivitesQuery(
      filters,
      tabEnum.Referentiel
    )},
    ${this.getContactsQuery(`pcm.${membreTable.estReferent.name} IS true`)}
    SELECT c.collectiviteId as "collectiviteId",
           c.collectiviteNom as "collectiviteNom",
           c.collectiviteType as "collectiviteType",
           c.etoilesCae as "etoilesCae",
           c.scoreFaitCae as "scoreFaitCae",
           c.scoreProgrammeCae as "scoreProgrammeCae",
           c.etoilesEci as "etoilesEci",
           c.scoreFaitEci as "scoreFaitEci",
           c.scoreProgrammeEci as "scoreProgrammeEci",
           ${this.getContactsProjection()}
    FROM filteredCollectivites c
    ORDER BY ${this.getOrderBy(filters, tabEnum.Referentiel)}`;

    // Execute the query
    const result = await this.databaseService.db.execute(sql.raw(query));
    const allRows = result.rows.map((row) => ({
      ...row,
    })) as RecherchesReferentiel[];

    return this.paginate(allRows, filters.nbCards, filters.page);
  }

  /**
   * Get view for "Plans d'action" tab
   * @param filters
   */
  async plans(
    filters: FiltersRequest
  ): Promise<{ count: number; items: RecherchesPlan[] }> {
    // Create the where condition for contacts
    const whereConditionContacts = `(pud.${utilisateurPermissionTable.permissionLevel.name} = '${PermissionLevelEnum.ADMIN}' OR pud.${utilisateurPermissionTable.permissionLevel.name} = '${PermissionLevelEnum.EDITION}')`;

    // Create the query
    const query = `WITH ${this.getFilteredCollectivitesQuery(
      filters,
      tabEnum.Plan
    )},
    ${this.getPlansQuery(filters)},
    ${this.getContactsQuery(whereConditionContacts, true)}
    SELECT c.collectiviteId as "collectiviteId",
           c.collectiviteNom as "collectiviteNom",
           p.planId as "planId",
           p.planNom as "planNom",
           p.planType as "planType",
           ${this.getContactsProjection(true)}
    FROM filteredCollectivites c
    JOIN plans p ON c.collectiviteId = p.collectiviteId
    ORDER BY ${this.getOrderBy(filters, tabEnum.Plan)}`;

    // Execute the query
    const result = await this.databaseService.db.execute(sql.raw(query));
    const allRows = result.rows.map((row) => ({
      ...row,
    })) as RecherchesPlan[];

    return this.paginate(allRows, filters.nbCards, filters.page);
  }

  /**
   * Get WITH subquery for filtered collectivites
   * @param filters
   * @param tab
   * @private
   */
  private getFilteredCollectivitesQuery(filters: FiltersRequest, tab: Tab) {
    // Create the query
    let query = `
      WITH ${this.getCollectivitesQuery(filters, tab)},
      ${this.getLabellisationsQuery()},
      ${this.getScoresQuery()}
      SELECT c.collectiviteId,
             c.collectiviteNom,
             c.collectiviteType,
             COALESCE(l.etoilesEci, 0) AS etoilesEci,
             seci.scoreFait AS scoreFaitEci,
             seci.scoreProgramme AS scoreProgrammeEci,
             seci.completude AS completudeEci,
             COALESCE(l.etoilesCae, 0) AS etoilesCae,
             scae.scoreFait AS scoreFaitCae,
             scae.scoreProgramme AS scoreProgrammeCae,
             scae.completude AS completudeCae
      FROM collectivites c
      LEFT JOIN labellisations l ON c.collectiviteId = l.collectiviteId
      LEFT JOIN scores seci
        ON c.collectiviteId = seci.collectiviteId
        AND seci.referentielId = 'eci'
      LEFT JOIN scores scae
        ON c.collectiviteId = scae.collectiviteId
        AND scae.referentielId = 'cae'
      WHERE c IS NOT NULL`;

    // Add conditions
    // Condition collectivite type
    if (filters.typesCollectivite.length > 0) {
      const types = filters.typesCollectivite
        .map((type) => `'${type}'`)
        .join(', ');
      query = `${query}
      AND c.collectiviteType IN (${types})`;
    }

    // Condition stars
    if (filters.niveauDeLabellisation.length > 0) {
      const etoiles = `${filters.niveauDeLabellisation.join(', ')}`;
      const conditionEci = `COALESCE(l.etoilesEci, 0) IN (${etoiles})`;
      const conditionCae = `COALESCE(l.etoilesCae, 0) IN (${etoiles})`;
      if (filters.referentiel.length == 1) {
        if (filters.referentiel[0] == 'eci') {
          query = `${query}
          AND ${conditionEci}`;
        } else {
          query = `${query}
          AND ${conditionCae}`;
        }
      } else {
        query = `${query}
          AND (${conditionEci} OR ${conditionCae})`;
      }
    }

    // Condition accomplished
    if (filters.realiseCourant.length > 0) {
      const tranches = filters.realiseCourant
        .map((tranche) => `'${tranche}'`)
        .join(', ');
      const conditionEci = `seci.realiseTranche IN (${tranches})`;
      const conditionCae = `scae.realiseTranche IN (${tranches})`;
      if (filters.referentiel.length == 1) {
        if (filters.referentiel[0] == 'eci') {
          query = `${query}
          AND ${conditionEci}`;
        } else {
          query = `${query}
          AND ${conditionCae}`;
        }
      } else {
        query = `${query}
          AND (${conditionEci} OR ${conditionCae})`;
      }
    }

    // Condition completeness
    if (filters.tauxDeRemplissage.length > 0) {
      const tranches = filters.tauxDeRemplissage
        .map((tranche) => `'${tranche}'`)
        .join(', ');
      const conditionEci = `seci.completudeTranche IN (${tranches})`;
      const conditionCae = `scae.completudeTranche IN (${tranches})`;
      if (filters.referentiel.length == 1) {
        if (filters.referentiel[0] == 'eci') {
          query = `${query}
          AND ${conditionEci}`;
        } else {
          query = `${query}
          AND ${conditionCae}`;
        }
      } else {
        query = `${query}
          AND (${conditionEci} OR ${conditionCae})`;
      }
    }

    // Return the query
    return `filteredCollectivites AS (${query})`;
  }

  /**
   * Get WITH subquery for collectivites
   * @param filters
   * @param tab
   * @private
   */
  private getCollectivitesQuery(filters: FiltersRequest, tab: Tab): string {
    // Create the query
    let query = `SELECT c.${collectiviteTable.id.name}  AS collectiviteId,
                        c.${collectiviteTable.nom.name} AS collectiviteNom,
                        CASE
                          WHEN c.${collectiviteTable.type.name} = '${
      collectiviteTypeEnum.EPCI
    }' THEN
                            CASE
                              WHEN cbt.${
                                collectiviteBanaticTypeTable.type.name
                              } = '${collectiviteBanaticSubType.SyndicatMixte}'
                                OR cbt.${
                                  collectiviteBanaticTypeTable.type.name
                                } = '${
      collectiviteBanaticSubType.SyndicatCommunes
    }'
                                THEN 'syndicat'::text
                              ELSE c.${collectiviteTable.natureInsee.name}
                              END
                          ELSE c.${collectiviteTable.type.name}
                          END                           AS collectiviteType
                 FROM ${getTableName(collectiviteTable)} c
                        LEFT JOIN ${getTableName(
                          collectiviteBanaticTypeTable
                        )} cbt
                                  ON c.${
                                    collectiviteTable.natureInsee.name
                                  } = cbt.${
      collectiviteBanaticTypeTable.id.name
    }
                        LEFT JOIN LATERAL (
                   SELECT ${filtreIntervalleTable.id.name}
                   FROM ${getTableName(filtreIntervalleTable)}
                   WHERE ${filtreIntervalleTable.type.name} = '${
      typeIntervalle.Population
    }'::collectivite_filtre_type
                     AND ${
                       filtreIntervalleTable.intervalle.name
                     } @> COALESCE(c.${
      collectiviteTable.population.name
    }, 0)::numeric
                   LIMIT 1
                   ) populationTranche ON true
                 WHERE c.${collectiviteTable.id.name} IN (SELECT DISTINCT ${
      utilisateurPermissionTable.collectiviteId.name
    }
                                                          FROM ${getTableName(
                                                            utilisateurPermissionTable
                                                          )}
                                                          WHERE ${
                                                            utilisateurPermissionTable
                                                              .isActive.name
                                                          } IS true)
                   AND c.${collectiviteTable.type.name} != '${
      collectiviteTypeEnum.TEST
    }'`;

    // Add conditions
    // Condition collectivite name
    if (filters.nom) {
      query = `${query}
      AND unaccent(c.${
        collectiviteTable.nom.name
      }) ILIKE unaccent('%${filters.nom.replace(/'/g, "''")}%')`;
    }

    // Condition region
    if (filters.regions.length > 0) {
      const regions = filters.regions.map((region) => `'${region}'`).join(', ');
      query = `${query}
      AND ${collectiviteTable.regionCode.name} IN (${regions})`;
    }

    // Condition department
    if (filters.departments.length > 0) {
      const departments = filters.departments
        .map((department) => `'${department}'`)
        .join(', ');
      query = `${query}
      AND ${collectiviteTable.departementCode.name} IN (${departments})`;
    }

    // Condition population
    if (filters.population.length > 0) {
      const populations = filters.population
        .map((population) => `'${population}'`)
        .join(', ');
      query = `${query}
      AND populationTranche.id IN (${populations})`;
    }

    // Return the query
    return `collectivites AS (${query})`;
  }

  /**
   * Get WITH subquery for labellisations
   * Need WITH subquery for collectivites before
   * @private
   */
  private getLabellisationsQuery() {
    // Create and return the query
    return `labellisations AS
         (SELECT l.${labellisationTable.collectiviteId.name} AS collectiviteId,
                 MAX(l.${labellisationTable.etoiles.name}) FILTER (WHERE l.${
      labellisationTable.referentiel.name
    } = 'cae'::referentiel) AS etoilesCae,
                 MAX(l.${labellisationTable.etoiles.name}) FILTER (WHERE l.${
      labellisationTable.referentiel.name
    } = 'eci'::referentiel) AS etoilesEci
          FROM ${getTableName(labellisationTable)} l
          JOIN collectivites c
            ON c.collectiviteId = l.${labellisationTable.collectiviteId.name}
          GROUP BY l.${labellisationTable.collectiviteId.name})`;
  }

  /**
   * Get WITH subquery for scores
   * Need WITH subquery for collectivites before
   * @private
   */
  private getScoresQuery() {
    const whenCondition = `WHEN s IS NULL OR s.${snapshotTable.pointPotentiel.name} = 0 THEN 0.0`;
    // Create and return the query
    return `scores AS
        (
          SELECT s.collectiviteId,
                  s.referentielId,
                  s.scoreFait,
                  s.scoreProgramme,
                  s.completude,
                  completudeTranche.id as completudeTranche,
                  realiseTranche.id as realiseTranche
          FROM (
            SELECT c.collectiviteId,
                   r.referentielId,
                   CASE
                     ${whenCondition}
                     ELSE s.${snapshotTable.pointFait.name} / s.${
      snapshotTable.pointPotentiel.name
    }
                   END as scoreFait,
                   CASE
                     ${whenCondition}
                     ELSE s.${snapshotTable.pointProgramme.name} / s.${
      snapshotTable.pointPotentiel.name
    }
                   END as scoreProgramme,
                   CASE
                     ${whenCondition}
                     ELSE (s.${snapshotTable.pointFait.name} + s.${
      snapshotTable.pointProgramme.name
    } + s.${snapshotTable.pointPasFait.name}) / s.${
      snapshotTable.pointPotentiel.name
    }
                   END as completude
            FROM collectivites c
            CROSS JOIN (SELECT 'eci' AS referentielId
                        UNION ALL
                        SELECT 'cae' AS referentielId) r
            LEFT JOIN ${getTableName(snapshotTable)} s
              ON c.collectiviteId = s.${snapshotTable.collectiviteId.name}
              AND s.${snapshotTable.referentielId.name} = r.referentielId
              AND s.${snapshotTable.jalon.name} = '${SnapshotJalonEnum.COURANT}'
          ) s
          LEFT JOIN LATERAL (
            SELECT ${filtreIntervalleTable.id.name}
            FROM ${getTableName(filtreIntervalleTable)}
            WHERE ${filtreIntervalleTable.type.name} = '${
      typeIntervalle.Remplissage
    }'::collectivite_filtre_type
            AND ${
              filtreIntervalleTable.intervalle.name
            } @> (s.completude * 100)::numeric
            LIMIT 1
          ) completudeTranche ON true
          LEFT JOIN LATERAL (
            SELECT ${filtreIntervalleTable.id.name}
            FROM ${getTableName(filtreIntervalleTable)}
            WHERE ${filtreIntervalleTable.type.name} = '${
      typeIntervalle.Score
    }'::collectivite_filtre_type
            AND ${
              filtreIntervalleTable.intervalle.name
            } @> (s.scoreFait * 100)::numeric
            LIMIT 1
          ) realiseTranche ON true
        )`;
  }

  /**
   * Get WITH subquery for plans
   * Need WITH subquery for filtered collectivites before
   * @param filters
   * @private
   */
  private getPlansQuery(filters: FiltersRequest) {
    // Create the query
    let query = `
      SELECT a.${axeTable.collectiviteId.name}  AS collectiviteId,
             a.${axeTable.id.name}              AS planId,
             a.${axeTable.nom.name}             AS planNom,
             t.${planActionTypeTable.type.name} AS planType
      FROM ${getTableName(axeTable)} a
             LEFT JOIN ${getTableName(planActionTypeTable)} t
                       ON a.${axeTable.typeId.name} = t.${
      planActionTypeTable.id.name
    }
             JOIN filteredCollectivites c
                  ON a.${axeTable.collectiviteId.name} = c.collectiviteId
      WHERE a.${axeTable.parent.name} IS NULL`;

    // Add conditions
    // Condition plan type
    if (filters.typesPlan.length > 0) {
      query = `${query}
      AND a.${axeTable.typeId.name} IN (${filters.typesPlan.join(', ')})`;
    }

    // Return the query
    return `plans AS (${query})`;
  }

  /**
   * Get WITH subquery for contacts
   * Need WITH subquery for filtered collectivites before
   * @param whereCondition condition according to the tab
   * @param forPlan true if for plan tab
   * @private
   */
  private getContactsQuery(whereCondition: string, forPlan?: boolean) {
    // Crate and return the query
    return `contacts AS (
      SELECT pud.${
        utilisateurPermissionTable.collectiviteId.name
      } as collectiviteId,
      ${forPlan ? `p.planId,` : ''}
             jsonb_build_object(
               'prenom', dcp.${dcpTable.prenom.name},
               'nom', dcp.${dcpTable.nom.name},
               'fonction', pcm.${membreTable.fonction.name},
               'detailFonction', pcm.${membreTable.detailsFonction.name},
               'telephone', dcp.${dcpTable.telephone.name},
               'email', dcp.${dcpTable.email.name}
             ) AS contact
      FROM ${getTableName(utilisateurPermissionTable)} pud
      LEFT JOIN ${getTableName(membreTable)} pcm
        ON pud.${utilisateurPermissionTable.collectiviteId.name} = pcm.${
      membreTable.collectiviteId.name
    }
        AND pud.${utilisateurPermissionTable.userId.name} = pcm.${
      membreTable.userId.name
    }
      JOIN ${getTableName(dcpTable)} dcp
        ON pud.${utilisateurPermissionTable.userId.name} = dcp.${
      dcpTable.userId.name
    }
      JOIN filteredCollectivites c
        ON pud.${
          utilisateurPermissionTable.collectiviteId.name
        } = c.collectiviteId
      ${
        forPlan
          ? `JOIN ${getTableName(ficheActionPiloteTable)} fap
      ON pud.${utilisateurPermissionTable.userId.name} = fap.${
              ficheActionPiloteTable.userId.name
            }
      JOIN ${getTableName(ficheActionAxeTable)} faa
                  ON fap.${ficheActionPiloteTable.ficheId.name} = faa.${
              ficheActionAxeTable.ficheId.name
            }
                JOIN ${getTableName(axeTable)} a on faa.${
              ficheActionAxeTable.axeId.name
            } = a.${axeTable.id.name}
                JOIN plans p on a.${axeTable.plan.name} = p.planId`
          : ''
      }
       WHERE pud.${utilisateurPermissionTable.isActive.name} IS true
       AND ${whereCondition}
    )`;
  }

  /**
   * Get projection for contacts
   * @param forPlan true if for plan tab
   * @private
   */
  private getContactsProjection(forPlan?: boolean) {
    /** Projection for contacts */
    return `COALESCE(
              (
                 SELECT jsonb_agg(distinct contact)
                 FROM contacts
                 WHERE contacts.collectiviteId = c.collectiviteId
                 ${forPlan ? `AND contacts.planId = p.planId` : ''}
              ),'[]'
            ) AS "contacts"`;
  }

  /**
   * Get order by
   * @param filters
   * @param tab
   * @private
   */
  private getOrderBy(filters: FiltersRequest, tab: Tab) {
    // Get the type of order by to apply
    const filtreType = filters.trierPar
      ? filters.trierPar[0]
      : tab == tabEnum.Referentiel
      ? 'score'
      : 'nom';

    // Create and return the order by
    switch (filtreType) {
      case 'nom':
        return `c.collectiviteNom`;
      case 'completude':
        if (filters.referentiel.length == 1) {
          if (filters.referentiel[0] == 'eci') {
            return `c.completudeEci desc`;
          } else {
            return `c.completudeCae desc`;
          }
        } else {
          return `greatest(c.completudeCae, c.completudeEci) desc`;
        }

      case 'score':
        if (filters.referentiel.length == 1) {
          if (filters.referentiel[0] == 'eci') {
            return `c.scoreFaitEci desc`;
          } else {
            return `c.scoreFaitCae desc`;
          }
        } else {
          return `greatest(c.scoreFaitCae, c.scoreFaitEci) desc`;
        }

      default:
        return `c.collectiviteNom`;
    }
  }

  /**
   * Paginate an array
   * @param data
   * @param limit
   * @param page
   * @private
   */
  private paginate<T>(
    data: T[],
    limit: number,
    page: number | undefined | null
  ): { count: number; items: T[] } {
    const offset = page ? (page - 1) * limit : 0;
    return { count: data.length, items: data.slice(offset, offset + limit) };
  }
}
