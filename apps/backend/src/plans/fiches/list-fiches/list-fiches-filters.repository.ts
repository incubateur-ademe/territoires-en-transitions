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
import {
  isSousActionsMatchingEnabled,
  SousActionFieldFilters,
  splitFiltersBySousActionScope,
} from './list-fiches-sous-actions-scope.rules';

type FicheTable = typeof ficheActionTable;

/** Sous-action de la fiche listée, pour les conditions corrélées. */
export const sousActionTable = aliasedTable(ficheActionTable, 'sous_action');

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

const isIncludingSousActions = (filters: ListFichesRequestFilters) =>
  Boolean(filters.withChildren || filters.onlyChildren);

export const isNotRestreintCondition = (fiche: FicheTable = ficheActionTable) =>
  or(isNull(fiche.restreint), eq(fiche.restreint, false));

/**
 * Traduit les filtres de `listFiches` en conditions SQL sur `fiche_action`.
 */
@Injectable()
export class ListFichesFiltersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private getTimeColumn(fiche: FicheTable, typePeriode?: TypePeriodeEnum) {
    switch (typePeriode) {
      case 'creation':
        return fiche.createdAt;
      case 'modification':
        return fiche.modifiedAt;
      case 'debut':
        return fiche.dateDebut;
      case 'fin':
        return fiche.dateFin;
      default:
        return fiche.modifiedAt;
    }
  }

  private getPeriodeConditions(
    fiche: FicheTable,
    filters: Pick<
      ListFichesRequestFilters,
      'typePeriode' | 'debutPeriode' | 'finPeriode'
    >
  ): SQL[] {
    const timeColumn = this.getTimeColumn(fiche, filters.typePeriode);
    return [
      filters.debutPeriode ? gte(timeColumn, filters.debutPeriode) : undefined,
      filters.finPeriode ? lte(timeColumn, filters.finPeriode) : undefined,
    ].filter((condition) => condition !== undefined);
  }

  /**
   * Relie une ligne de `fiche_action_axe` à la fiche listée.
   *
   * Quand les sous-actions sont incluses, une sous-action appartient aux axes
   * et aux plans de son action parente (ADR 0012-sous-actions) : on compare à
   * `coalesce(parent_id, id)`, on ignore ses propres lignes `fiche_action_axe`
   * (copiées à l'import ou à la duplication, sans cascade si le parent change
   * d'axe), et une sous-action dont le parent est supprimé n'est dans aucun
   * axe. Sans sous-actions incluses, le SQL reste celui d'une fiche seule.
   */
  private getAxeOwnerCondition(
    axeFicheIdColumn: Column,
    includeSousActions: boolean
  ): SQL | undefined {
    if (!includeSousActions) {
      return eq(axeFicheIdColumn, ficheActionTable.id);
    }
    const parentFiche = aliasedTable(ficheActionTable, 'axe_owner_parent');
    const activeParentQuery = this.databaseService.db
      .select({ id: parentFiche.id })
      .from(parentFiche)
      .where(
        and(
          eq(parentFiche.id, ficheActionTable.parentId),
          eq(parentFiche.deleted, false)
        )
      );
    return and(
      eq(
        axeFicheIdColumn,
        sql`coalesce(${ficheActionTable.parentId}, ${ficheActionTable.id})`
      ),
      or(isNull(ficheActionTable.parentId), exists(activeParentQuery))
    );
  }

  private getHasNoPlanCondition(
    noPlan: boolean | undefined,
    collectiviteId: number | null,
    includeSousActions: boolean
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
          this.getAxeOwnerCondition(
            ficheActionAxeTable.ficheId,
            includeSousActions
          ),
          collectiviteId
            ? eq(axeTable.collectiviteId, collectiviteId)
            : undefined
        )
      );

    return noPlan ? notExists(planQuery) : exists(planQuery);
  }

  private getIdentifiedPlanCondition(
    planIds: number[] | undefined,
    includeSousActions: boolean
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
          this.getAxeOwnerCondition(
            ficheActionAxeTable.ficheId,
            includeSousActions
          ),
          or(inArray(axeTable.plan, planIds), inArray(axeTable.id, planIds))
        )
      );

    return exists(planQuery);
  }

  private getMultiplePlansCondition(
    multiplePlans: boolean | undefined,
    includeSousActions: boolean
  ): SQLWrapper | undefined {
    if (isNil(multiplePlans)) {
      return;
    }
    // Compte les plans distincts de la fiche : plus d'un, ou un seul au plus.
    // Une fiche sans axe n'a aucune ligne à grouper et ne satisfait ni l'un ni
    // l'autre.
    const planCount = sql`count(distinct COALESCE(${axeTable.plan}, ${axeTable.id}))`;
    const planCountQuery = this.databaseService.db
      .select({
        ficheId: ficheActionAxeTable.ficheId,
      })
      .from(ficheActionAxeTable)
      .leftJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
      .where(
        this.getAxeOwnerCondition(
          ficheActionAxeTable.ficheId,
          includeSousActions
        )
      )
      .groupBy(ficheActionAxeTable.ficheId)
      .having(multiplePlans ? gt(planCount, 1) : lte(planCount, 1));

    return exists(planCountQuery);
  }

  private getAxesCondition(
    filters: ListFichesRequestFilters
  ): SQLWrapper | undefined {
    if (!filters.axesId?.length) {
      return;
    }
    const axeQuery = this.databaseService.db
      .select({ ficheId: ficheActionAxeTable.ficheId })
      .from(ficheActionAxeTable)
      .where(
        and(
          this.getAxeOwnerCondition(
            ficheActionAxeTable.ficheId,
            isIncludingSousActions(filters)
          ),
          inArray(ficheActionAxeTable.axeId, filters.axesId)
        )
      );
    return exists(axeQuery);
  }

  private getPlanFilterCondition(
    filters: ListFichesRequestFilters,
    collectiviteId: number | null
  ): SQLWrapper | SQL | undefined {
    const planConditions: (SQLWrapper | SQL | undefined)[] = [];
    const includeSousActions = isIncludingSousActions(filters);

    if (filters.planActionIds?.length) {
      planConditions.push(
        this.getIdentifiedPlanCondition(
          filters.planActionIds,
          includeSousActions
        )
      );
    } else {
      planConditions.push(
        this.getHasNoPlanCondition(
          filters.noPlan,
          collectiviteId,
          includeSousActions
        )
      );
    }
    planConditions.push(
      this.getMultiplePlansCondition(
        filters.doesBelongToSeveralPlans,
        includeSousActions
      )
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
    ficheIdColumn: T['columns'][keyof T['columns']],
    fiche: FicheTable = ficheActionTable
  ): SQLWrapper | undefined {
    if (!noLinkedEntity) {
      return;
    }
    return this.getHasAnyLinkedEntityCondition(
      false,
      linkedTable,
      ficheIdColumn,
      fiche
    );
  }

  /**
   * Creates a condition to check for the existence of related entities.
   *
   * @param hasLinkedEntity - Whether to check for existence (true) or non-existence (false)
   * @param linkedTable - The related table to check against
   * @param ficheIdColumn - The column in the related table that links to the fiche id
   * @param fiche - The fiche table (or alias) the condition is correlated to
   * @returns SQLWrapper condition or undefined if hasLinkedEntity is null/undefined
   */
  private getHasAnyLinkedEntityCondition<T extends TableConfig>(
    hasLinkedEntity: boolean | undefined,
    linkedTable: Table<T>,
    ficheIdColumn: T['columns'][keyof T['columns']],
    fiche: FicheTable = ficheActionTable
  ): SQLWrapper | undefined {
    if (isNil(hasLinkedEntity)) {
      return;
    }
    const linkedEntityQuery = this.databaseService.db
      .select({
        ficheId: ficheIdColumn,
      })
      .from(linkedTable)
      .where(eq(ficheIdColumn, fiche.id));

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

    const recentNotesQuery = this.databaseService.db
      .select({
        ficheId: ficheActionNoteTable.ficheId,
      })
      .from(ficheActionNoteTable)
      .where(
        and(
          eq(ficheActionNoteTable.ficheId, ficheActionTable.id),
          gte(
            ficheActionNoteTable.modifiedAt,
            subYears(new Date(), 1).toISOString()
          )
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
    entityIds: number[] | string[] | undefined,
    fiche: FicheTable = ficheActionTable
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
        and(eq(ficheIdColumn, fiche.id), inArray(entityIdColumn, entityIds))
      );

    return exists(linkedEntityQuery);
  }

  /**
   * « Sans X » OU « lié à l'un des X choisis », pour chaque colonne d'identifiants
   * de la table de liaison (par exemple tag et utilisateur pour les pilotes).
   */
  private getNoneOrAnyOfCondition<T extends TableConfig>(
    noLinkedEntity: boolean | undefined,
    linkedTable: Table<T>,
    ficheIdColumn: T['columns'][keyof T['columns']],
    identifiedEntities: {
      entityIdColumn: T['columns'][keyof T['columns']];
      entityIds: number[] | string[] | undefined;
    }[],
    fiche: FicheTable = ficheActionTable
  ): SQLWrapper | SQL | undefined {
    return or(
      this.getHasNoLinkedEntityCondition(
        noLinkedEntity,
        linkedTable,
        ficheIdColumn,
        fiche
      ),
      ...identifiedEntities.map(({ entityIdColumn, entityIds }) =>
        this.getHasIdentifiedLinkedEntityCondition(
          linkedTable,
          ficheIdColumn,
          entityIdColumn,
          entityIds,
          fiche
        )
      )
    );
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

  /**
   * Conditions des filtres qui portent sur les champs propres à une
   * sous-action (titre, description, statut, pilotes, date de fin), sur la
   * fiche listée ou sur une sous-action (`sousActionTable`).
   */
  getSousActionFieldConditions(
    fiche: FicheTable,
    filters: SousActionFieldFilters,
    descriptionSearch: DescriptionSearchScope
  ): (SQLWrapper | SQL)[] {
    const conditions: (SQLWrapper | SQL | undefined)[] = [
      this.getNullableFieldCondition(
        fiche.statut,
        filters.noStatut,
        filters.statuts
      ),
      ...this.getPeriodeConditions(fiche, filters),
      this.getHasAnyNotNullValueCondition(
        filters.hasDateDeFinPrevisionnelle,
        fiche.dateFin
      ),
      this.getNoneOrAnyOfCondition(
        filters.noPilote,
        ficheActionPiloteTable,
        ficheActionPiloteTable.ficheId,
        [
          {
            entityIdColumn: ficheActionPiloteTable.tagId,
            entityIds: filters.personnePiloteIds,
          },
          {
            entityIdColumn: ficheActionPiloteTable.userId,
            entityIds: filters.utilisateurPiloteIds,
          },
        ],
        fiche
      ),
    ];

    if (filters.noTitre !== undefined) {
      conditions.push(
        this.getFieldEmptyCondition({
          fieldColumn: fiche.titre,
          shouldBeEmpty: filters.noTitre,
          emptyValues: ['', 'Sans titre'],
        })
      );
    }

    if (filters.noDescription !== undefined) {
      conditions.push(
        this.getFieldEmptyCondition({
          fieldColumn: fiche.description,
          shouldBeEmpty: filters.noDescription,
          emptyValues: [''],
        })
      );
    }

    if (filters.texteNomOuDescription) {
      const textSearchConditions: (SQLWrapper | SQL | undefined)[] = [];
      this.addTextSearchCondition(
        textSearchConditions,
        sql`${fiche.titre}`,
        filters.texteNomOuDescription
      );
      const descriptionSearchConditions: (SQLWrapper | SQL | undefined)[] = [];
      this.addTextSearchCondition(
        descriptionSearchConditions,
        sql`${fiche.description}`,
        filters.texteNomOuDescription
      );
      if (descriptionSearch === 'unrestrictedFichesOnly') {
        descriptionSearchConditions.push(isNotRestreintCondition(fiche));
        // la description d'une sous-action ne doit rien révéler d'une action
        // restreinte masquée
        if (fiche !== ficheActionTable) {
          descriptionSearchConditions.push(isNotRestreintCondition());
        }
      }
      textSearchConditions.push(and(...descriptionSearchConditions));
      conditions.push(or(...textSearchConditions));
    }

    return conditions.filter((condition) => condition !== undefined);
  }

  /**
   * Sous-actions non supprimées de la fiche listée qui satisfont, chacune,
   * tous les filtres donnés. Quand les fiches restreintes sont exclues
   * (`restreint: false`), les sous-actions restreintes le sont aussi : elles
   * ne font pas remonter leur action et ne sont pas comptées.
   */
  private getMatchingSousActionsConditions(
    filters: SousActionFieldFilters,
    descriptionSearch: DescriptionSearchScope,
    excludesRestreintes: boolean
  ): SQL | undefined {
    return and(
      eq(sousActionTable.parentId, ficheActionTable.id),
      eq(sousActionTable.deleted, false),
      excludesRestreintes
        ? isNotRestreintCondition(sousActionTable)
        : undefined,
      ...this.getSousActionFieldConditions(
        sousActionTable,
        filters,
        descriptionSearch
      )
    );
  }

  /**
   * Avec `withSousActionsMatches`, une action remonte si elle satisfait les
   * filtres sur les champs d'une sous-action, ou si l'une de ses sous-actions
   * les satisfait tous. Les autres filtres restent évalués sur l'action.
   */
  private getSousActionFieldsCondition(
    filters: ListFichesRequestFilters,
    sousActionFieldFilters: SousActionFieldFilters,
    descriptionSearch: DescriptionSearchScope
  ): SQLWrapper | SQL | undefined {
    const ficheConditions = this.getSousActionFieldConditions(
      ficheActionTable,
      sousActionFieldFilters,
      descriptionSearch
    );
    if (ficheConditions.length === 0) {
      return;
    }
    if (!isSousActionsMatchingEnabled(filters)) {
      return and(...ficheConditions);
    }
    const matchingSousActionsQuery = this.databaseService.db
      .select({ id: sousActionTable.id })
      .from(sousActionTable)
      .where(
        this.getMatchingSousActionsConditions(
          sousActionFieldFilters,
          descriptionSearch,
          filters.restreint === false
        )
      );
    return or(and(...ficheConditions), exists(matchingSousActionsQuery));
  }

  /**
   * Nombre de sous-actions non supprimées de la fiche listée. Avec
   * `withSousActionsMatches`, seules comptent celles qui satisfont les filtres
   * sur les champs d'une sous-action.
   */
  getSousActionsCountSql(
    filters: ListFichesRequestFilters,
    descriptionSearch: DescriptionSearchScope
  ): SQL<number> {
    const sousActionFieldFilters = isSousActionsMatchingEnabled(filters)
      ? splitFiltersBySousActionScope(filters).sousActionFieldFilters
      : {};
    const countQuery = this.databaseService.db
      .select({ count: sql`count(*)::int` })
      .from(sousActionTable)
      .where(
        this.getMatchingSousActionsConditions(
          sousActionFieldFilters,
          descriptionSearch,
          filters.restreint === false
        )
      );
    return sql<number>`(${countQuery})`.mapWith(Number);
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
    const { actionFilters, sousActionFieldFilters } =
      splitFiltersBySousActionScope(filters);
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

    conditions.push(this.getAxesCondition(filters));

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
      conditions.push(isNotRestreintCondition());
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

    conditions.push(
      ...this.getPeriodeConditions(ficheActionTable, actionFilters)
    );

    if (filters.hasAtLeastBeginningOrEndDate) {
      conditions.push(
        or(
          isNotNull(ficheActionTable.dateDebut),
          isNotNull(ficheActionTable.dateFin)
        )
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

    conditions.push(
      this.getNoneOrAnyOfCondition(
        filters.noServicePilote,
        ficheActionServiceTagTable,
        ficheActionServiceTagTable.ficheId,
        [
          {
            entityIdColumn: ficheActionServiceTagTable.serviceTagId,
            entityIds: filters.servicePiloteIds,
          },
        ]
      )
    );

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionStructureTagTable,
        ficheActionStructureTagTable.ficheId,
        ficheActionStructureTagTable.structureTagId,
        filters.structurePiloteIds
      )
    );

    conditions.push(
      this.getNoneOrAnyOfCondition(
        filters.noTag,
        ficheActionLibreTagTable,
        ficheActionLibreTagTable.ficheId,
        [
          {
            entityIdColumn: ficheActionLibreTagTable.libreTagId,
            entityIds: filters.libreTagsIds,
          },
        ]
      )
    );

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionActionTable,
        ficheActionActionTable.ficheId,
        ficheActionActionTable.actionId,
        filters.mesureIds
      )
    );

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

    conditions.push(
      this.getNoneOrAnyOfCondition(
        filters.noThematique,
        ficheActionThematiqueTable,
        ficheActionThematiqueTable.ficheId,
        [
          {
            entityIdColumn: ficheActionThematiqueTable.thematiqueId,
            entityIds: filters.thematiqueIds,
          },
        ]
      )
    );

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionSousThematiqueTable,
        ficheActionSousThematiqueTable.ficheId,
        ficheActionSousThematiqueTable.thematiqueId,
        filters.sousThematiqueIds
      )
    );

    conditions.push(this.getPlanFilterCondition(filters, collectiviteId));

    conditions.push(
      this.getNoneOrAnyOfCondition(
        filters.noReferent,
        ficheActionReferentTable,
        ficheActionReferentTable.ficheId,
        [
          {
            entityIdColumn: ficheActionReferentTable.userId,
            entityIds: filters.utilisateurReferentIds,
          },
          {
            entityIdColumn: ficheActionReferentTable.tagId,
            entityIds: filters.personneReferenteIds,
          },
        ]
      )
    );

    conditions.push(
      this.getSousActionFieldsCondition(
        filters,
        sousActionFieldFilters,
        descriptionSearch
      )
    );

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
