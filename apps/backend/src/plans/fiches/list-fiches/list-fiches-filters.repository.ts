import { Injectable } from '@nestjs/common';
import { ficheActionBudgetTable } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { ficheActionNoteTable } from '@tet/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import { ficheActionSharingTable } from '@tet/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionFinanceurTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionLibreTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-libre-tag.table';
import { ficheActionLienTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-lien.table';
import { ficheActionPartenaireTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-partenaire-tag.table';
import { ficheActionReferentTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-thematique.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { historiqueFicheActionTable } from '@tet/backend/plans/fiches/shared/models/historique-fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  ListFichesRequestFilters,
  StatutEnum,
  TypePeriodeEnum,
} from '@tet/domain/plans';
import { getModifiedSinceDate } from '@tet/domain/utils';
import { subYears } from 'date-fns';
import {
  aliasedTable,
  and,
  arrayOverlaps,
  Column,
  eq,
  exists,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  notExists,
  or,
  sql,
  SQL,
  SQLWrapper,
  Table,
} from 'drizzle-orm';
import { TableConfig } from 'drizzle-orm/pg-core';
import { isNil } from 'es-toolkit';
import { ficheActionActionTable } from '../shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionInstanceGouvernanceTableTag } from '../shared/models/fiche-action-instance-gouvernance';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { DescriptionSearchScope } from './fiches-restreintes.rules';

export function formatFiltersForLogs(
  filters: ListFichesRequestFilters
): string {
  const filterEntries = Object.entries(filters).filter(([, value]) => value);

  const MAX_ITEMS_TO_SHOW = 10;

  if (filterEntries.length > MAX_ITEMS_TO_SHOW) {
    return `${filterEntries.length} filtres appliqués`;
  }

  return filterEntries
    .map(([name, value]) => {
      if (Array.isArray(value)) {
        if (value.length > MAX_ITEMS_TO_SHOW) {
          return `${name}, ${value.length} éléments`;
        }
        return `${name}: ${value.join(',')}`;
      }
      return `${name}: ${value}`;
    })
    .join(', ');
}

/**
 * Traduit les filtres de `listFiches` en conditions SQL sur `fiche_action`.
 */
@Injectable()
export class ListFichesFiltersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private getTimeColumn(typePeriode?: TypePeriodeEnum) {
    switch (typePeriode) {
      case 'creation':
        return ficheActionTable.createdAt;
      case 'modification':
        return ficheActionTable.modifiedAt;
      case 'debut':
        return ficheActionTable.dateDebut;
      case 'fin':
        return ficheActionTable.dateFin;
      default:
        return ficheActionTable.modifiedAt;
    }
  }

  private getHasNoPlanCondition(
    noPlan: boolean | undefined,
    collectiviteId: number | null
  ): SQLWrapper | undefined {
    if (isNil(noPlan)) {
      return;
    }
    const planQuery = this.databaseService.db
      .select({
        ficheId: ficheActionAxeTable.ficheId,
      })
      .from(ficheActionAxeTable)
      .leftJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
      .where(
        and(
          eq(ficheActionAxeTable.ficheId, ficheActionTable.id),
          collectiviteId
            ? eq(axeTable.collectiviteId, collectiviteId)
            : undefined
        )
      );

    return noPlan ? notExists(planQuery) : exists(planQuery);
  }

  private getIdentifiedPlanCondition(
    planIds: number[] | undefined
  ): SQLWrapper | undefined {
    if (isNil(planIds) || planIds.length === 0) {
      return;
    }
    const planQuery = this.databaseService.db
      .select({
        ficheId: ficheActionAxeTable.ficheId,
        planId: axeTable.plan,
      })
      .from(ficheActionAxeTable)
      .leftJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
      .where(
        and(
          eq(ficheActionAxeTable.ficheId, ficheActionTable.id),
          or(inArray(axeTable.plan, planIds), inArray(axeTable.id, planIds))
        )
      );

    return exists(planQuery);
  }

  private getMultiplePlansCondition(
    multiplePlans: boolean | undefined
  ): SQLWrapper | undefined {
    if (isNil(multiplePlans)) {
      return;
    }
    if (multiplePlans) {
      // Check if fiche belongs to multiple plans by counting distinct plans
      const planCountQuery = this.databaseService.db
        .select({
          ficheId: ficheActionAxeTable.ficheId,
        })
        .from(ficheActionAxeTable)
        .leftJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
        .where(eq(ficheActionAxeTable.ficheId, ficheActionTable.id))
        .groupBy(ficheActionAxeTable.ficheId)
        .having(
          gt(sql`count(distinct COALESCE(${axeTable.plan}, ${axeTable.id}))`, 1)
        );

      return exists(planCountQuery);
    } else {
      // Check if fiche belongs to only one plan or no plans
      const planCountQuery = this.databaseService.db
        .select({
          ficheId: ficheActionAxeTable.ficheId,
        })
        .from(ficheActionAxeTable)
        .leftJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
        .where(eq(ficheActionAxeTable.ficheId, ficheActionTable.id))
        .groupBy(ficheActionAxeTable.ficheId)
        .having(
          lte(
            sql`count(distinct COALESCE(${axeTable.plan}, ${axeTable.id}))`,
            1
          )
        );

      return exists(planCountQuery);
    }
  }

  private getPlanFilterCondition(
    filters: ListFichesRequestFilters,
    collectiviteId: number | null
  ): SQLWrapper | SQL | undefined {
    const planConditions: (SQLWrapper | SQL | undefined)[] = [];

    if (filters.planActionIds?.length) {
      planConditions.push(
        this.getIdentifiedPlanCondition(filters.planActionIds)
      );
    } else {
      planConditions.push(
        this.getHasNoPlanCondition(filters.noPlan, collectiviteId)
      );
    }
    planConditions.push(
      this.getMultiplePlansCondition(filters.doesBelongToSeveralPlans)
    );

    return or(...planConditions);
  }

  /**
   * `noX` est une case à cocher « sans X » : seule la valeur `true` filtre.
   * `false` (case décochée, tel qu'enregistré par les modules du tableau de
   * bord) ne doit pas devenir « avec au moins un X », sinon le OU avec le
   * filtre par identifiants (`servicePiloteIds`, `personnePiloteIds`…)
   * renvoie toutes les fiches liées à n'importe quel X.
   */
  private getHasNoLinkedEntityCondition<T extends TableConfig>(
    noLinkedEntity: boolean | undefined,
    linkedTable: Table<T>,
    ficheIdColumn: T['columns'][keyof T['columns']]
  ): SQLWrapper | undefined {
    if (!noLinkedEntity) {
      return;
    }
    return this.getHasAnyLinkedEntityCondition(
      false,
      linkedTable,
      ficheIdColumn
    );
  }

  /**
   * Creates a condition to check for the existence of related entities.
   *
   * @param hasLinkedEntity - Whether to check for existence (true) or non-existence (false)
   * @param linkedTable - The related table to check against
   * @param ficheIdColumn - The column in the related table that links to ficheActionTable.id
   * @returns SQLWrapper condition or undefined if hasLinkedEntity is null/undefined
   */
  private getHasAnyLinkedEntityCondition<T extends TableConfig>(
    hasLinkedEntity: boolean | undefined,
    linkedTable: Table<T>,
    ficheIdColumn: T['columns'][keyof T['columns']]
  ): SQLWrapper | undefined {
    if (isNil(hasLinkedEntity)) {
      return;
    }
    const linkedEntityQuery = this.databaseService.db
      .select({
        ficheId: ficheIdColumn,
      })
      .from(linkedTable)
      .where(eq(ficheIdColumn, ficheActionTable.id));

    return hasLinkedEntity
      ? exists(linkedEntityQuery)
      : notExists(linkedEntityQuery);
  }

  private getNotesCondition(
    filters: ListFichesRequestFilters
  ): SQLWrapper | undefined {
    const { notes } = filters;

    if (!notes) {
      return;
    }

    if (notes === 'WITH' || notes === 'WITHOUT') {
      return this.getHasAnyLinkedEntityCondition(
        notes === 'WITH',
        ficheActionNoteTable,
        ficheActionNoteTable.ficheId
      );
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentNotesQuery = this.databaseService.db
      .select({
        ficheId: ficheActionNoteTable.ficheId,
      })
      .from(ficheActionNoteTable)
      .where(
        and(
          eq(ficheActionNoteTable.ficheId, ficheActionTable.id),
          gte(ficheActionNoteTable.modifiedAt, oneYearAgo.toISOString())
        )
      );

    if (notes === 'WITH_RECENT') {
      return exists(recentNotesQuery);
    }
    return notExists(recentNotesQuery);
  }

  private getHasIdentifiedLinkedEntityCondition<T extends TableConfig>(
    linkedTable: Table<T>,
    ficheIdColumn: T['columns'][keyof T['columns']],
    entityIdColumn: T['columns'][keyof T['columns']],
    entityIds: number[] | string[] | undefined
  ): SQLWrapper | undefined {
    // Ignore si undefined/null ou si le tableau est vide
    // Un tableau vide signifie "pas de filtre" plutôt que "chercher des valeurs vides"
    if (isNil(entityIds) || entityIds.length === 0) {
      return;
    }
    const linkedEntityQuery = this.databaseService.db
      .select({
        ficheId: ficheIdColumn,
      })
      .from(linkedTable)
      .where(
        and(
          eq(ficheIdColumn, ficheActionTable.id),
          inArray(entityIdColumn, entityIds)
        )
      );

    return exists(linkedEntityQuery);
  }

  private addTextSearchCondition(
    conditions: (SQLWrapper | SQL | undefined)[],
    column: SQL,
    searchText?: string
  ) {
    if (searchText) {
      conditions.push(
        sql`unaccent(${column}) ilike unaccent(${`%${searchText}%`})`
      );
    }
  }

  private getHasAnyNotNullValueCondition(
    anyNotNullValue: boolean | undefined,
    column: Column
  ): SQLWrapper | SQL | undefined {
    if (!isNil(anyNotNullValue)) {
      return anyNotNullValue ? isNotNull(column) : isNull(column);
    }
  }

  private getNullableFieldCondition(
    column: Column,
    noValueFilter: boolean | undefined,
    specificValues: unknown[] | undefined
  ): SQLWrapper | SQL | undefined {
    if (noValueFilter && specificValues?.length) {
      // If both conditions are present, use OR logic since a field cannot be both NULL and have a value
      return or(isNull(column), inArray(column, specificValues));
    }
    if (!isNil(noValueFilter)) {
      return noValueFilter ? isNull(column) : isNotNull(column);
    }
    if (specificValues?.length) {
      return inArray(column, specificValues);
    }
  }

  private getFieldEmptyCondition(args: {
    fieldColumn: Column;
    shouldBeEmpty: boolean;
    emptyValues: string[];
  }): SQLWrapper | SQL | undefined {
    const { fieldColumn, shouldBeEmpty, emptyValues = [''] } = args;
    const emptyConditions = [
      isNull(fieldColumn),
      ...emptyValues.map((val) => eq(fieldColumn, val)),
    ];

    if (shouldBeEmpty) {
      return or(...emptyConditions);
    } else {
      // Field should NOT be empty
      return and(
        isNotNull(fieldColumn),
        ...emptyValues.map((val) => sql`${fieldColumn} != ${val}`)
      );
    }
  }

  getConditions({
    collectiviteId,
    filters = {},
    descriptionSearch,
  }: {
    collectiviteId: number | null;
    filters?: ListFichesRequestFilters;
    descriptionSearch: DescriptionSearchScope;
  }): (SQLWrapper | SQL | undefined)[] {
    const conditions: (SQLWrapper | SQL | undefined)[] = [];
    // Exclut systématiquement les fiches soft-deleted
    conditions.push(eq(ficheActionTable.deleted, false));

    if (collectiviteId) {
      conditions.push(
        or(
          eq(ficheActionTable.collectiviteId, collectiviteId),
          this.getHasIdentifiedLinkedEntityCondition(
            ficheActionSharingTable,
            ficheActionSharingTable.ficheId,
            ficheActionSharingTable.collectiviteId,
            [collectiviteId]
          )
        )
      );
    }

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionAxeTable,
        ficheActionAxeTable.ficheId,
        ficheActionAxeTable.axeId,
        filters.axesId
      )
    );

    if (filters.ficheIds?.length) {
      const ficheIdsConditions = [
        inArray(ficheActionTable.id, filters.ficheIds),
        filters.withChildren && !filters.onlyChildren
          ? inArray(ficheActionTable.parentId, filters.ficheIds)
          : null,
      ].filter((c) => c !== null);

      conditions.push(or(...ficheIdsConditions));
    }

    conditions.push(
      this.getNullableFieldCondition(
        ficheActionTable.statut,
        filters.noStatut,
        filters.statuts
      )
    );

    conditions.push(
      this.getNullableFieldCondition(
        ficheActionTable.priorite,
        filters.noPriorite,
        filters.priorites
      )
    );

    if (filters.hasBudgetPrevisionnel) {
      conditions.push(isNotNull(ficheActionTable.budgetPrevisionnel));
    }
    if (filters.ameliorationContinue) {
      conditions.push(eq(ficheActionTable.ameliorationContinue, true));
    }
    if (filters.restreint === true) {
      conditions.push(eq(ficheActionTable.restreint, true));
    }
    if (filters.restreint === false) {
      conditions.push(
        or(
          isNull(ficheActionTable.restreint),
          eq(ficheActionTable.restreint, false)
        )
      );
    }

    if (filters.cibles?.length) {
      conditions.push(arrayOverlaps(ficheActionTable.cibles, filters.cibles));
    }
    if (filters.enCoursSansAvancement) {
      const historiqueJauge = aliasedTable(
        historiqueFicheActionTable,
        'historique_jauge_renseignee'
      );
      conditions.push(
        and(
          eq(ficheActionTable.statut, StatutEnum.EN_COURS),
          eq(ficheActionTable.jauge, 0),
          notExists(
            this.databaseService.db
              .select({ ficheId: historiqueJauge.ficheId })
              .from(historiqueJauge)
              .where(
                and(
                  eq(historiqueJauge.ficheId, ficheActionTable.id),
                  sql`${historiqueJauge.jauge} <> coalesce(${historiqueJauge.previousJauge}, 0)`
                )
              )
          )
        )
      );
    }
    if (filters.notModifiedForOverAYear) {
      conditions.push(
        lt(ficheActionTable.modifiedAt, subYears(new Date(), 1).toISOString())
      );
    }
    if (filters.modifiedSince) {
      const modifiedSinceDate = getModifiedSinceDate(filters.modifiedSince);
      conditions.push(gte(ficheActionTable.modifiedAt, modifiedSinceDate));
    }

    if (filters.debutPeriode) {
      conditions.push(
        gte(this.getTimeColumn(filters.typePeriode), filters.debutPeriode)
      );
    }

    if (filters.finPeriode) {
      conditions.push(
        lte(this.getTimeColumn(filters.typePeriode), filters.finPeriode)
      );
    }

    if (filters.hasAtLeastBeginningOrEndDate) {
      conditions.push(
        or(
          isNotNull(ficheActionTable.dateDebut),
          isNotNull(ficheActionTable.dateFin)
        )
      );
    }

    conditions.push(
      this.getHasAnyNotNullValueCondition(
        filters.hasDateDeFinPrevisionnelle,
        ficheActionTable.dateFin
      )
    );

    if (filters.noTitre !== undefined) {
      conditions.push(
        this.getFieldEmptyCondition({
          fieldColumn: ficheActionTable.titre,
          shouldBeEmpty: filters.noTitre,
          emptyValues: ['', 'Sans titre'],
        })
      );
    }

    if (filters.noDescription !== undefined) {
      conditions.push(
        this.getFieldEmptyCondition({
          fieldColumn: ficheActionTable.description,
          shouldBeEmpty: filters.noDescription,
          emptyValues: [''],
        })
      );
    }

    if (filters.noObjectif !== undefined) {
      conditions.push(
        this.getFieldEmptyCondition({
          fieldColumn: ficheActionTable.objectifs,
          shouldBeEmpty: filters.noObjectif,
          emptyValues: [''],
        })
      );
    }

    conditions.push(
      this.getHasAnyLinkedEntityCondition(
        filters.hasIndicateurLies,
        ficheActionIndicateurTable,
        ficheActionIndicateurTable.ficheId
      )
    );
    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionIndicateurTable,
        ficheActionIndicateurTable.ficheId,
        ficheActionIndicateurTable.indicateurId,
        filters.indicateurIds
      )
    );

    conditions.push(
      this.getHasAnyLinkedEntityCondition(
        filters.hasMesuresLiees,
        ficheActionActionTable,
        ficheActionActionTable.ficheId
      )
    );

    conditions.push(
      this.getHasAnyLinkedEntityCondition(
        filters.hasBudget,
        ficheActionBudgetTable,
        ficheActionBudgetTable.ficheId
      )
    );
    conditions.push(this.getNotesCondition(filters));

    if (filters.anneesNotes) {
      const dateList = filters.anneesNotes?.map(
        (year) => new Date(year).toISOString().split('T')[0]
      );
      conditions.push(
        this.getHasIdentifiedLinkedEntityCondition(
          ficheActionNoteTable,
          ficheActionNoteTable.ficheId,
          ficheActionNoteTable.dateNote,
          dateList
        )
      );
    }

    conditions.push(
      this.getHasAnyLinkedEntityCondition(
        filters.sharedWithCollectivites,
        ficheActionSharingTable,
        ficheActionSharingTable.ficheId
      )
    );

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionPartenaireTagTable,
        ficheActionPartenaireTagTable.ficheId,
        ficheActionPartenaireTagTable.partenaireTagId,
        filters.partenaireIds
      )
    );

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionFinanceurTagTable,
        ficheActionFinanceurTagTable.ficheId,
        ficheActionFinanceurTagTable.financeurTagId,
        filters.financeurIds
      )
    );

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionInstanceGouvernanceTableTag,
        ficheActionInstanceGouvernanceTableTag.ficheId,
        ficheActionInstanceGouvernanceTableTag.instanceGouvernanceTagId,
        filters.instanceGouvernanceIds
      )
    );

    const servicePiloteConditions: (SQLWrapper | SQL | undefined)[] = [];
    servicePiloteConditions.push(
      this.getHasNoLinkedEntityCondition(
        filters.noServicePilote,
        ficheActionServiceTagTable,
        ficheActionServiceTagTable.ficheId
      )
    );
    servicePiloteConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionServiceTagTable,
        ficheActionServiceTagTable.ficheId,
        ficheActionServiceTagTable.serviceTagId,
        filters.servicePiloteIds
      )
    );
    conditions.push(or(...servicePiloteConditions));

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionStructureTagTable,
        ficheActionStructureTagTable.ficheId,
        ficheActionStructureTagTable.structureTagId,
        filters.structurePiloteIds
      )
    );

    const libreTagsConditions: (SQLWrapper | SQL | undefined)[] = [];
    libreTagsConditions.push(
      this.getHasNoLinkedEntityCondition(
        filters.noTag,
        ficheActionLibreTagTable,
        ficheActionLibreTagTable.ficheId
      )
    );
    libreTagsConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionLibreTagTable,
        ficheActionLibreTagTable.ficheId,
        ficheActionLibreTagTable.libreTagId,
        filters.libreTagsIds
      )
    );
    conditions.push(or(...libreTagsConditions));

    if (filters.mesureIds?.length) {
      conditions.push(
        this.getHasIdentifiedLinkedEntityCondition(
          ficheActionActionTable,
          ficheActionActionTable.ficheId,
          ficheActionActionTable.actionId,
          filters.mesureIds
        )
      );
    }

    if (filters.linkedFicheIds?.length) {
      const linkedFicheConditions: (SQLWrapper | SQL | undefined)[] = [];
      linkedFicheConditions.push(
        this.getHasIdentifiedLinkedEntityCondition(
          ficheActionLienTable,
          ficheActionLienTable.ficheUne,
          ficheActionLienTable.ficheDeux,
          filters.linkedFicheIds
        )
      );
      linkedFicheConditions.push(
        this.getHasIdentifiedLinkedEntityCondition(
          ficheActionLienTable,
          ficheActionLienTable.ficheDeux,
          ficheActionLienTable.ficheUne,
          filters.linkedFicheIds
        )
      );
      conditions.push(or(...linkedFicheConditions));
    }

    const thematiqueConditions: (SQLWrapper | SQL | undefined)[] = [];
    thematiqueConditions.push(
      this.getHasNoLinkedEntityCondition(
        filters.noThematique,
        ficheActionThematiqueTable,
        ficheActionThematiqueTable.ficheId
      )
    );
    thematiqueConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionThematiqueTable,
        ficheActionThematiqueTable.ficheId,
        ficheActionThematiqueTable.thematiqueId,
        filters.thematiqueIds
      )
    );
    conditions.push(or(...thematiqueConditions));

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionSousThematiqueTable,
        ficheActionSousThematiqueTable.ficheId,
        ficheActionSousThematiqueTable.thematiqueId,
        filters.sousThematiqueIds
      )
    );

    conditions.push(this.getPlanFilterCondition(filters, collectiviteId));

    const piloteConditions: (SQLWrapper | SQL | undefined)[] = [];
    piloteConditions.push(
      this.getHasNoLinkedEntityCondition(
        filters.noPilote,
        ficheActionPiloteTable,
        ficheActionPiloteTable.ficheId
      )
    );
    piloteConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionPiloteTable,
        ficheActionPiloteTable.ficheId,
        ficheActionPiloteTable.tagId,
        filters.personnePiloteIds
      )
    );
    piloteConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionPiloteTable,
        ficheActionPiloteTable.ficheId,
        ficheActionPiloteTable.userId,
        filters.utilisateurPiloteIds
      )
    );
    conditions.push(or(...piloteConditions));

    const referentConditions: (SQLWrapper | SQL | undefined)[] = [];
    referentConditions.push(
      this.getHasNoLinkedEntityCondition(
        filters.noReferent,
        ficheActionReferentTable,
        ficheActionReferentTable.ficheId
      )
    );
    referentConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionReferentTable,
        ficheActionReferentTable.ficheId,
        ficheActionReferentTable.userId,
        filters.utilisateurReferentIds
      )
    );
    referentConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionReferentTable,
        ficheActionReferentTable.ficheId,
        ficheActionReferentTable.tagId,
        filters.personneReferenteIds
      )
    );
    conditions.push(or(...referentConditions));

    const textSearchConditions: (SQLWrapper | SQL | undefined)[] = [];
    if (filters.texteNomOuDescription) {
      this.addTextSearchCondition(
        textSearchConditions,
        sql`${ficheActionTable.titre}`,
        filters.texteNomOuDescription
      );
      const descriptionSearchConditions: (SQLWrapper | SQL | undefined)[] = [];
      this.addTextSearchCondition(
        descriptionSearchConditions,
        sql`${ficheActionTable.description}`,
        filters.texteNomOuDescription
      );
      if (descriptionSearch === 'unrestrictedFichesOnly') {
        descriptionSearchConditions.push(
          or(
            isNull(ficheActionTable.restreint),
            eq(ficheActionTable.restreint, false)
          )
        );
      }
      textSearchConditions.push(and(...descriptionSearchConditions));
      conditions.push(or(...textSearchConditions));
    }

    // Gestion du filtrage des sous-fiches
    if (filters.parentsId?.length) {
      // Si `parentsId` est spécifié, on ne retourne que les sous-fiches associées aux parents spécifiés
      conditions.push(inArray(ficheActionTable.parentId, filters.parentsId));
    } else if (!filters.withChildren && !filters.onlyChildren) {
      // Par défaut, on exclut toutes les sous-fiches sauf si `withChildren` ou `onlyChildren` est activé
      conditions.push(isNull(ficheActionTable.parentId));
    } else if (filters.onlyChildren) {
      // et si `onlyChildren` est spécifié on n'inclut que les sous-fiches
      conditions.push(isNotNull(ficheActionTable.parentId));
    }

    return conditions;
  }
}
