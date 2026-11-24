import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  ListFichesSortValue,
  QueryOptionsSchema,
} from '@tet/backend/plans/fiches/list-fiches/list-fiches.request';
import { actionImpactActionTable } from '@tet/backend/plans/fiches/shared/models/action-impact-action.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { historiqueFicheActionTable } from '@tet/backend/plans/fiches/shared/models/historique-fiche-action.table';
import { tempsDeMiseEnOeuvreTable } from '@tet/backend/shared/models/temps-de-mise-en-oeuvre.table';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { sqlAuthorOrNull } from '@tet/backend/users/models/author.utils';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Tag } from '@tet/domain/collectivites';
import {
  FicheWithRelations,
  ListFichesRequestFilters,
} from '@tet/domain/plans';
import { TempsDeMiseEnOeuvre } from '@tet/domain/shared';
import {
  aliasedTable,
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { checkCompletion } from './completion';
import { DescriptionSearchScope } from './fiches-restreintes.rules';
import { ListFichesBudgetRepository } from './list-fiches-budget.repository';
import {
  formatFiltersForLogs,
  ListFichesFiltersRepository,
} from './list-fiches-filters.repository';
import { ListFichesRelationsRepository } from './list-fiches-relations.repository';

type FicheWithoutCompletion = Omit<FicheWithRelations, 'completion'>;

const sortColumn: Record<ListFichesSortValue, PgColumn> = {
  modified_at: ficheActionTable.modifiedAt,
  created_at: ficheActionTable.createdAt,
  dateDebut: ficheActionTable.dateDebut,
  titre: ficheActionTable.titre,
};

@Injectable()
export class ListFichesRepository {
  private readonly logger = new Logger(ListFichesRepository.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly listFichesFiltersRepository: ListFichesFiltersRepository,
    private readonly listFichesRelationsRepository: ListFichesRelationsRepository,
    private readonly listFichesBudgetRepository: ListFichesBudgetRepository
  ) {}

  async countPiloteFiches(
    collectiviteId: number,
    user: AuthUser,
    subFiches = false
  ) {
    if (!user.id) {
      throw new BadRequestException(
        `Seulement supporté pour les utilisateurs authentifiés`
      );
    }

    const query = this.databaseService.db
      .select({
        count: count(),
      })
      .from(ficheActionTable)
      .leftJoin(
        ficheActionPiloteTable,
        eq(ficheActionPiloteTable.ficheId, ficheActionTable.id)
      )
      .where(
        and(
          eq(ficheActionTable.collectiviteId, collectiviteId),
          eq(ficheActionPiloteTable.userId, user.id),
          eq(ficheActionTable.deleted, false),
          subFiches
            ? isNotNull(ficheActionTable.parentId)
            : isNull(ficheActionTable.parentId)
        )
      );

    const queryResult = await query;

    return queryResult[0]?.count ?? 0;
  }

  async countPiloteSubFiches(collectiviteId: number, user: AuthUser) {
    return this.countPiloteFiches(collectiviteId, user, true);
  }

  async countPiloteFichesIndicateurs(collectiviteId: number, user: AuthUser) {
    if (!user.id) {
      throw new BadRequestException(
        `Seulement supporté pour les utilisateurs authentifiés`
      );
    }

    const query = this.databaseService.db
      .select({
        count:
          sql<number>`count(distinct ${ficheActionIndicateurTable.indicateurId})`.mapWith(
            Number
          ),
      })
      .from(ficheActionTable)
      .leftJoin(
        ficheActionPiloteTable,
        eq(ficheActionPiloteTable.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionIndicateurTable,
        eq(ficheActionIndicateurTable.ficheId, ficheActionTable.id)
      )
      .where(
        and(
          eq(ficheActionTable.collectiviteId, collectiviteId),
          eq(ficheActionPiloteTable.userId, user.id),
          eq(ficheActionTable.deleted, false),
          isNotNull(ficheActionIndicateurTable.indicateurId),
          isNull(ficheActionTable.parentId)
        )
      );

    const queryResult = await query;

    return queryResult[0]?.count ?? 0;
  }

  private getFicheIdsQuery({
    collectiviteId,
    filters,
    queryOptions,
    tx,
    descriptionSearch,
  }: {
    collectiviteId: number | null;
    filters?: ListFichesRequestFilters;
    queryOptions?: QueryOptionsSchema;
    tx?: Transaction;
    descriptionSearch: DescriptionSearchScope;
  }) {
    if (filters && Object.keys(filters).length > 0) {
      const filterSummary = formatFiltersForLogs(filters);
      this.logger.log(
        `Récupération des fiches action pour la collectivité ${collectiviteId} ${
          filterSummary ? `(filtre(s) appliqué(s): ${filterSummary})` : ''
        }`
      );
    } else {
      this.logger.log(
        `Récupération des toutes les fiches action pour la collectivité ${collectiviteId}`
      );
    }

    const conditions: (SQLWrapper | SQL | undefined)[] =
      this.listFichesFiltersRepository.getConditions({
        collectiviteId,
        filters,
        descriptionSearch,
      });

    const ficheIdsQuery = (tx || this.databaseService.db)
      .select({
        id: ficheActionTable.id,
        count: sql<number>`(count(*) over())::int`,
      })
      .from(ficheActionTable);

    ficheIdsQuery.where(and(...conditions));

    if (queryOptions?.sort) {
      queryOptions.sort.forEach((sort) => {
        const column = sortColumn[sort.field];

        if (column === ficheActionTable.titre) {
          const orderByWithCollation = sql`${column} collate numeric_with_case_and_accent_insensitive ${
            sort.direction === 'asc' ? sql`asc` : sql`desc`
          } nulls last`;

          ficheIdsQuery.orderBy(
            orderByWithCollation,
            // Prevent nulls (at the end) to be randomly reordered when updated
            asc(ficheActionTable.createdAt)
          );
        } else {
          ficheIdsQuery.orderBy(
            sort.direction === 'asc' ? column : desc(column)
          );
        }
      });
    }

    if (queryOptions?.limit === 'all') {
      return ficheIdsQuery;
    }
    if (queryOptions?.page && queryOptions?.limit) {
      ficheIdsQuery
        .limit(queryOptions.limit)
        .offset((queryOptions.page - 1) * queryOptions.limit);
    }

    return ficheIdsQuery;
  }

  async listFichesWithDescriptionSearch({
    collectiviteId,
    filters,
    queryOptions,
    tx,
    descriptionSearch,
  }: {
    collectiviteId: number | null;
    filters?: ListFichesRequestFilters;
    queryOptions?: QueryOptionsSchema;
    tx?: Transaction;
    descriptionSearch: DescriptionSearchScope;
  }): Promise<{
    data: FicheWithRelations[];
    count: number;
  }> {
    const ficheIdsQuery = this.getFicheIdsQuery({
      collectiviteId,
      filters,
      queryOptions,
      tx,
      descriptionSearch,
    });

    const ficheIdQueryResult = await ficheIdsQuery;
    const ficheIds = ficheIdQueryResult.map((fiche) => fiche.id);
    const count = ficheIdQueryResult[0]?.count ?? 0;

    if (ficheIds.length === 0) {
      return { data: [], count };
    }

    const ficheActionPartenaireTags =
      this.listFichesRelationsRepository.getFicheActionPartenaireTagsQuery(
        ficheIds,
        tx
      );
    const ficheActionThematiques =
      this.listFichesRelationsRepository.getFicheActionThematiquesQuery(
        ficheIds,
        tx
      );
    const ficheActionSousThematiques =
      this.listFichesRelationsRepository.getFicheActionSousThematiquesQuery(
        ficheIds,
        tx
      );
    const ficheActionFinanceurTags =
      this.listFichesRelationsRepository.getFicheActionFinanceurTagsQuery(
        ficheIds,
        tx
      );
    const ficheActionIndicateurs =
      this.listFichesRelationsRepository.getFicheActionIndicateursQuery(
        ficheIds,
        tx
      );
    const ficheActionReferent =
      this.listFichesRelationsRepository.getFicheActionReferentTagsQuery(
        ficheIds,
        tx
      );
    const ficheActionEffetsAttendus =
      this.listFichesRelationsRepository.getFicheActionEffetsAttendusQuery(
        ficheIds,
        tx
      );
    const ficheActionStructureTags =
      this.listFichesRelationsRepository.getFicheActionStructureTagsQuery(
        ficheIds,
        tx
      );
    const ficheActionLibreTags =
      this.listFichesRelationsRepository.getFicheActionLibreTagsQuery(
        ficheIds,
        tx
      );
    const ficheActionPilotes =
      this.listFichesRelationsRepository.getFicheActionPilotesQuery(
        ficheIds,
        tx
      );
    const ficheActionServices =
      this.listFichesRelationsRepository.getFicheActionServicesQuery(
        ficheIds,
        tx
      );
    const ficheActionInstanceGouvernance =
      this.listFichesRelationsRepository.getFicheActionInstanceGouvernanceQuery(
        ficheIds,
        tx
      );
    const ficheActionAxes =
      this.listFichesRelationsRepository.getFicheActionAxesQuery(
        ficheIds,
        filters?.withAxesAncestors,
        tx
      );
    const ficheActionPlans =
      this.listFichesRelationsRepository.getFicheActionPlansQuery(ficheIds, tx);
    const ficheActionEtapes =
      this.listFichesRelationsRepository.getFicheActionEtapesQuery(
        ficheIds,
        tx
      );
    const ficheActionNotes =
      this.listFichesRelationsRepository.getFicheActionNotesQuery(ficheIds, tx);
    const ficheActionMesures =
      this.listFichesRelationsRepository.getFicheActionMesuresQuery(
        ficheIds,
        tx
      );
    const ficheActionFichesLiees =
      this.listFichesRelationsRepository.getFicheActionFichesLieesQuery(
        ficheIds,
        tx
      );
    const ficheActionDocs =
      this.listFichesRelationsRepository.getFicheActionsDocsQuery(ficheIds, tx);
    const ficheActionSharings =
      this.listFichesRelationsRepository.getFicheActionSharingsQuery(
        ficheIds,
        tx
      );
    const ficheActionBudgets =
      this.listFichesBudgetRepository.listFicheBudgetsByFicheId(
        {
          ficheIds,
        },
        { tx }
      );

    const dcpModifiedBy = aliasedTable(dcpTable, 'dcpModifiedBy');
    const historiqueJauge = aliasedTable(
      historiqueFicheActionTable,
      'historique_jauge'
    );

    const query = (tx || this.databaseService.db)
      .select({
        ...getTableColumns(ficheActionTable),
        dateDebut: sqlToDateTimeISO(ficheActionTable.dateDebut),
        dateFin: sqlToDateTimeISO(ficheActionTable.dateFin),
        collectiviteNom: collectiviteTable.nom,
        createdBy: sqlAuthorOrNull({
          userIdColumn: ficheActionTable.createdBy,
          prenomColumn: dcpTable.prenom,
          nomColumn: dcpTable.nom,
        }),
        modifiedBy: sqlAuthorOrNull({
          userIdColumn: dcpModifiedBy.id,
          prenomColumn: dcpModifiedBy.prenom,
          nomColumn: dcpModifiedBy.nom,
        }),
        tempsDeMiseEnOeuvre: sql<TempsDeMiseEnOeuvre>`CASE WHEN ${tempsDeMiseEnOeuvreTable.id} IS NULL THEN NULL ELSE json_build_object('id', ${tempsDeMiseEnOeuvreTable.id}, 'nom', ${tempsDeMiseEnOeuvreTable.nom}) END`,
        partenaires: sql<
          Tag[]
        >`COALESCE(${ficheActionPartenaireTags.partenaireTags}, ARRAY[]::json[])`,
        pilotes: ficheActionPilotes.pilotes,
        libreTags: ficheActionLibreTags.libreTags,
        thematiques: ficheActionThematiques.thematiques,
        indicateurs: ficheActionIndicateurs.indicateurs,
        sousThematiques: ficheActionSousThematiques.sousThematiques,
        structures: ficheActionStructureTags.structureTags,
        instanceGouvernance: ficheActionInstanceGouvernance.instanceGouvernance,
        financeurs: ficheActionFinanceurTags.financeurTags,
        effetsAttendus: ficheActionEffetsAttendus.effetsAttendus,
        referents: ficheActionReferent.referents,
        services: ficheActionServices.services,
        axes: ficheActionAxes.axes,
        plans: ficheActionPlans.plans,
        etapes: ficheActionEtapes.etapes,
        notes: ficheActionNotes.notes,
        mesures: ficheActionMesures.mesures,
        sharedWithCollectivites: ficheActionSharings.sharedWithCollectivites,
        fichesLiees: ficheActionFichesLiees.fichesLiees,
        docs: ficheActionDocs.docs,
        budgets: ficheActionBudgets.budgets,
        actionImpactId: actionImpactActionTable.actionImpactId,
        jaugeModifiedAt: sql<string | null>`(
          select ${sqlToDateTimeISO(sql`max(${historiqueJauge.modifiedAt})`)}
          from ${historiqueFicheActionTable} ${sql.identifier(
          'historique_jauge'
        )}
          where ${historiqueJauge.ficheId} = ${ficheActionTable.id}
            and ${historiqueJauge.jauge} <> coalesce(${
          historiqueJauge.previousJauge
        }, 0)
        )`,
      })
      .from(ficheActionTable)
      .leftJoin(
        ficheActionPartenaireTags,
        eq(ficheActionPartenaireTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionReferent,
        eq(ficheActionReferent.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionIndicateurs,
        eq(ficheActionIndicateurs.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionEffetsAttendus,
        eq(ficheActionEffetsAttendus.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionStructureTags,
        eq(ficheActionStructureTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionInstanceGouvernance,
        eq(ficheActionInstanceGouvernance.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionFinanceurTags,
        eq(ficheActionFinanceurTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionLibreTags,
        eq(ficheActionLibreTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionThematiques,
        eq(ficheActionThematiques.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionSousThematiques,
        eq(ficheActionSousThematiques.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionPilotes,
        eq(ficheActionPilotes.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionServices,
        eq(ficheActionServices.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionAxes,
        eq(ficheActionAxes.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionPlans,
        eq(ficheActionPlans.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionEtapes,
        eq(ficheActionEtapes.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionNotes,
        eq(ficheActionNotes.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionMesures,
        eq(ficheActionMesures.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionSharings,
        eq(ficheActionSharings.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        collectiviteTable,
        eq(collectiviteTable.id, ficheActionTable.collectiviteId)
      )
      .leftJoin(
        ficheActionFichesLiees,
        eq(ficheActionFichesLiees.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionDocs,
        eq(ficheActionDocs.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionBudgets,
        eq(ficheActionBudgets.ficheId, ficheActionTable.id)
      )
      .leftJoin(dcpTable, eq(dcpTable.id, ficheActionTable.createdBy))
      .leftJoin(
        dcpModifiedBy,
        eq(dcpModifiedBy.id, ficheActionTable.modifiedBy)
      )
      .leftJoin(
        tempsDeMiseEnOeuvreTable,
        eq(tempsDeMiseEnOeuvreTable.id, ficheActionTable.tempsDeMiseEnOeuvre)
      )
      .leftJoin(
        actionImpactActionTable,
        eq(actionImpactActionTable.actionId, sql`${ficheActionTable.id}::text`)
      )
      .where(inArray(ficheActionTable.id, ficheIds));

    if (queryOptions?.sort) {
      //This is added to preserve the order from the ficheIds array
      query.orderBy(
        sql`array_position(ARRAY[${sql.join(
          ficheIds.map((id) => sql`${id}`),
          sql`, `
        )}]::int[], ${ficheActionTable.id})`
      );
    }
    const data = await query;

    const completionData = checkCompletion(
      data as unknown as FicheWithoutCompletion[]
    );

    const fichesWithCompletion = data.map((fiche) => {
      const completion = completionData.find((c) => c.ficheId === fiche.id);
      if (!completion) {
        throw new Error(`Completion data not found for action ${fiche.id}`);
      }
      return { ...fiche, completion };
    });

    return { data: fichesWithCompletion, count };
  }

  async count(collectiviteId: number): Promise<number> {
    const result = await this.databaseService.db
      .select({
        count: count(),
      })
      .from(ficheActionTable)
      .where(
        and(
          eq(ficheActionTable.collectiviteId, collectiviteId),
          eq(ficheActionTable.deleted, false),
          isNull(ficheActionTable.parentId)
        )
      );
    return result[0]?.count ?? 0;
  }
}
