import { PersonneTagOrUser } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@/backend/collectivites/tags/service-tag.table';
import { Tag } from '@/backend/collectivites/tags/tag.table-base';
import { ListActionSummariesRequestType } from '@/backend/referentiels/list-actions/list-action-summaries.request';
import { ActionDefinitionSummary } from '@/backend/referentiels/models/action-definition-summary.dto';
import { ActionWithScore } from '@/backend/referentiels/models/action-definition.dto';
import { actionDefinitionTable } from '@/backend/referentiels/models/action-definition.table';
import { actionRelationTable } from '@/backend/referentiels/models/action-relation.table';
import { ActionType } from '@/backend/referentiels/models/action-type.enum';
import { questionActionTable } from '@/backend/referentiels/models/question-action.table';
import { ReferentielId } from '@/backend/referentiels/models/referentiel-id.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  eq,
  getTableColumns,
  inArray,
  like,
  or,
  SQL,
  sql,
} from 'drizzle-orm';
import { actionPiloteTable } from '../models/action-pilote.table';
import { actionServiceTable } from '../models/action-service.table';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { getExtendActionWithComputedFields } from '../snapshots/snapshots.utils';
import { ListActionsRequestType } from './list-actions.request';

@Injectable()
export class ListActionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly snapshotService: SnapshotsService
  ) {}

  private db = this.databaseService.db;

  async listActions({
    collectiviteId,
    filters,
  }: ListActionsRequestType): Promise<ActionWithScore[]> {
    const subQuery = this.db
      .$with('action_definition_with_details')
      .as(this.listWithDetails(collectiviteId));

    const request = this.db.with(subQuery).select().from(subQuery);

    const queryFilters: SQL[] = [];

    if (filters?.actionIds && filters.actionIds.length > 0) {
      queryFilters.push(inArray(subQuery.actionId, filters.actionIds));
    }

    if (filters?.actionTypes && filters.actionTypes.length > 0) {
      queryFilters.push(inArray(subQuery.actionType, filters.actionTypes));
    }

    if (
      filters?.utilisateurPiloteIds &&
      filters.utilisateurPiloteIds.length > 0
    ) {
      const pilotesCountSubquery = this.db
        .select({
          count: sql`COUNT(DISTINCT ${actionPiloteTable.userId})`,
        })
        .from(actionPiloteTable)
        .where(
          and(
            eq(actionPiloteTable.actionId, subQuery.actionId),
            eq(actionPiloteTable.collectiviteId, collectiviteId),
            inArray(actionPiloteTable.userId, filters.utilisateurPiloteIds)
          )
        );
      queryFilters.push(
        eq(pilotesCountSubquery, filters.utilisateurPiloteIds.length)
      );
    }

    if (filters?.personnePiloteIds && filters.personnePiloteIds.length > 0) {
      const personnesCountSubquery = this.db
        .select({
          count: sql`COUNT(DISTINCT ${actionPiloteTable.tagId})`,
        })
        .from(actionPiloteTable)
        .where(
          and(
            eq(actionPiloteTable.actionId, subQuery.actionId),
            eq(actionPiloteTable.collectiviteId, collectiviteId),
            inArray(actionPiloteTable.tagId, filters.personnePiloteIds)
          )
        );
      queryFilters.push(
        eq(personnesCountSubquery, filters.personnePiloteIds.length)
      );
    }

    if (filters?.servicePiloteIds && filters.servicePiloteIds.length > 0) {
      const servicesCountSubquery = this.db
        .select({
          count: sql`COUNT(DISTINCT ${actionServiceTable.serviceTagId})`,
        })
        .from(actionServiceTable)
        .where(
          and(
            eq(actionServiceTable.actionId, subQuery.actionId),
            eq(actionServiceTable.collectiviteId, collectiviteId),
            inArray(actionServiceTable.serviceTagId, filters.servicePiloteIds)
          )
        );
      queryFilters.push(
        eq(servicesCountSubquery, filters.servicePiloteIds.length)
      );
    }

    if (filters?.referentielIds && filters.referentielIds.length > 0) {
      queryFilters.push(
        inArray(subQuery.referentielId, filters.referentielIds)
      );
    }

    request.where(and(...queryFilters));
    request.orderBy(asc(subQuery.actionId));

    const actions = await request;

    const extendActionWithComputedFields = getExtendActionWithComputedFields(
      collectiviteId,
      this.snapshotService.get.bind(this.snapshotService)
    );

    return Promise.all(actions.map(extendActionWithComputedFields));
  }

  private listWithDepth() {
    return this.db
      .select({
        ...getTableColumns(actionDefinitionTable),

        // Add a column with the depth of the action depending on the number of dots in the identifiant
        // Ex: 1.1   => depth 2
        //     1.1.1 => depth 3
        depth: sql<number>`CASE
          WHEN ${actionDefinitionTable.identifiant} IS NULL OR ${actionDefinitionTable.identifiant} LIKE '' THEN 0
          ELSE REGEXP_COUNT(${actionDefinitionTable.identifiant}, '\\.') + 1
          END`.as('depth'),
      })
      .from(actionDefinitionTable);
  }

  async countPiloteActions(collectiviteId: number, user: AuthUser) {
    if (!user.id) {
      throw new BadRequestException(
        `Seulement supporté pour les utilisateurs authentifiés`
      );
    }

    const query = this.databaseService.db
      .select({
        count: count(),
      })
      .from(actionPiloteTable)
      .where(
        and(
          eq(actionPiloteTable.collectiviteId, collectiviteId),
          eq(actionPiloteTable.userId, user.id)
        )
      );

    const queryResult = await query;

    return queryResult[0]?.count ?? 0;
  }

  private listWithDetails(collectiviteId: number) {
    const subQuery = this.db
      .$with('action_definition_with_depth')
      .as(this.listWithDepth());

    return this.db
      .with(subQuery)
      .select({
        modifiedAt: subQuery.modifiedAt,
        actionId: subQuery.actionId,
        referentiel: subQuery.referentiel,
        identifiant: subQuery.identifiant,
        nom: subQuery.nom,
        description: subQuery.description,
        contexte: subQuery.contexte,
        exemples: subQuery.exemples,
        ressources: subQuery.ressources,
        reductionPotentiel: subQuery.reductionPotentiel,
        perimetreEvaluation: subQuery.perimetreEvaluation,
        preuve: subQuery.preuve,
        points: subQuery.points,
        pourcentage: subQuery.pourcentage,
        categorie: subQuery.categorie,
        referentielId: subQuery.referentielId,
        referentielVersion: subQuery.referentielVersion,
        depth: subQuery.depth,
        exprScore: subQuery.exprScore,

        // Add the action type from the `referentiel_definition.hierarchie` array
        // Ex: 'axe', 'sous-axe', etc
        actionType:
          sql<ActionType>`${referentielDefinitionTable.hierarchie}[${subQuery.depth} + 1]`.as(
            'actionType'
          ),

        pilotes: sql<Array<PersonneTagOrUser>>`
          array_remove(
            array_agg(
              DISTINCT
              CASE
                WHEN ${actionPiloteTable.userId} IS NOT NULL THEN
                  jsonb_build_object(
                    'collectiviteId', ${actionPiloteTable.collectiviteId},
                    'userId', ${actionPiloteTable.userId},
                    'tagId', null,
                    'nom', CONCAT(${dcpTable.prenom}, ' ', ${dcpTable.nom})
                  )
                WHEN ${personneTagTable.id} IS NOT NULL THEN
                  jsonb_build_object(
                    'collectiviteId', ${actionPiloteTable.collectiviteId},
                    'userId', null,
                    'tagId', ${personneTagTable.id},
                    'nom', ${personneTagTable.nom}
                  )
              END
            ),
            null
          )
        `.as('pilotes'),

        services: sql<Array<Tag>>`
          array_remove(
            array_agg(
              DISTINCT
              CASE
                WHEN ${actionServiceTable.collectiviteId} IS NOT NULL
                  OR ${serviceTagTable.nom} IS NOT NULL
                  OR ${actionServiceTable.serviceTagId} IS NOT NULL
                THEN
                  jsonb_build_object(
                    'collectiviteId', ${actionServiceTable.collectiviteId},
                    'nom', ${serviceTagTable.nom},
                    'id', ${actionServiceTable.serviceTagId}
                  )
              END
            ),
            null
          )
        `.as('services'),
      })
      .from(subQuery)
      .innerJoin(
        referentielDefinitionTable,
        and(
          eq(referentielDefinitionTable.id, subQuery.referentielId),
          eq(referentielDefinitionTable.version, subQuery.referentielVersion)
        )
      )
      .leftJoin(
        actionPiloteTable,
        and(
          eq(actionPiloteTable.actionId, subQuery.actionId),
          eq(actionPiloteTable.collectiviteId, collectiviteId)
        )
      )
      .leftJoin(dcpTable, eq(dcpTable.userId, actionPiloteTable.userId))
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, actionPiloteTable.tagId)
      )
      .leftJoin(
        actionServiceTable,
        and(
          eq(actionServiceTable.actionId, subQuery.actionId),
          eq(actionServiceTable.collectiviteId, collectiviteId)
        )
      )
      .leftJoin(
        serviceTagTable,
        eq(serviceTagTable.id, actionServiceTable.serviceTagId)
      )
      .groupBy(
        subQuery.modifiedAt,
        subQuery.actionId,
        subQuery.referentiel,
        subQuery.identifiant,
        subQuery.nom,
        subQuery.description,
        subQuery.contexte,
        subQuery.exemples,
        subQuery.ressources,
        subQuery.reductionPotentiel,
        subQuery.perimetreEvaluation,
        subQuery.preuve,
        subQuery.points,
        subQuery.pourcentage,
        subQuery.categorie,
        subQuery.referentielId,
        subQuery.referentielVersion,
        subQuery.depth,
        subQuery.exprScore,
        referentielDefinitionTable.hierarchie
      );
  }

  // donne un sommaire des entrées d'un référentiel
  // (remplace la vue SQL `action_definition_summary`)
  async listActionSummaries(
    params: ListActionSummariesRequestType
  ): Promise<ActionDefinitionSummary[]> {
    const { referentielId, actionTypes } = params;
    const subQuery = this.db
      .$with('action_definition_summary')
      .as(this.getActionDefinitionSummariesSubQuery(params));

    const query = this.db
      .with(subQuery)
      .select()
      .from(subQuery)
      .where(inArray(subQuery.actionType, actionTypes))
      .orderBy(
        sql`${subQuery.actionId} collate numeric_with_case_and_accent_insensitive`
      );

    const actionDefinitions = await query;

    const actionChildren = await this.getActionChildren({ referentielId });

    return actionDefinitions.map((definition) => {
      return {
        id: definition.actionId,
        referentiel: definition.referentiel,
        children:
          actionChildren?.find((action) => action.id === definition.actionId)
            ?.children || [],
        depth: definition.depth,
        type: definition.actionType,
        identifiant: definition.identifiant,
        nom: definition.nom,
        description: definition.description,
        haveContexte: definition.contexte !== '',
        haveExemples: definition.exemples !== '',
        haveRessources: definition.ressources !== '',
        havePerimetreEvaluation: definition.perimetreEvaluation !== '',
        haveQuestions: definition.haveQuestions,
        haveScoreIndicatif: !!(
          definition.exprScore && definition.exprScore !== ''
        ),
        phase: definition.categorie,
      };
    });
  }

  // pour remplacer la vue action_definition_summary
  private getActionDefinitionSummariesSubQuery({
    referentielId,
    identifiant,
  }: ListActionSummariesRequestType) {
    const subQuery = this.db
      .$with('action_definition_with_depth')
      .as(this.listWithDepth());

    return this.db
      .with(subQuery)
      .select({
        modifiedAt: subQuery.modifiedAt,
        actionId: subQuery.actionId,
        referentiel: subQuery.referentiel,
        identifiant: subQuery.identifiant,
        nom: subQuery.nom,
        description: subQuery.description,
        contexte: subQuery.contexte,
        exemples: subQuery.exemples,
        ressources: subQuery.ressources,
        perimetreEvaluation: subQuery.perimetreEvaluation,
        categorie: subQuery.categorie,
        depth: subQuery.depth,
        exprScore: subQuery.exprScore,
        // Add the action type from the `referentiel_definition.hierarchie` array
        // Ex: 'axe', 'sous-axe', etc
        actionType:
          sql<ActionType>`${referentielDefinitionTable.hierarchie}[${subQuery.depth} + 1]`.as(
            'actionType'
          ),
        haveQuestions:
          sql<boolean>`(${subQuery.actionId} in (select ${questionActionTable.actionId} from ${questionActionTable}))`.as(
            'haveQuestions'
          ),
      })
      .from(subQuery)
      .innerJoin(
        referentielDefinitionTable,
        and(
          eq(referentielDefinitionTable.id, subQuery.referentielId),
          eq(referentielDefinitionTable.version, subQuery.referentielVersion)
        )
      )
      .where(
        and(
          eq(subQuery.referentiel, referentielId),
          identifiant
            ? or(
                eq(subQuery.identifiant, identifiant),
                like(subQuery.identifiant, `${identifiant}.%`)
              )
            : undefined
        )
      );
  }

  private async getActionChildren({
    referentielId,
  }: {
    referentielId: ReferentielId;
  }) {
    const relations = await this.db
      .select({
        id: actionRelationTable.id,
        parent: actionRelationTable.parent,
      })
      .from(actionRelationTable)
      .where(eq(actionRelationTable.referentiel, referentielId));

    const parentToChildren = new Map<string | null, string[]>();
    for (const rel of relations) {
      const parent = rel.parent ?? null;
      if (!parentToChildren.has(parent)) parentToChildren.set(parent, []);
      parentToChildren.get(parent)?.push(rel.id);
    }

    const results: Array<{ id: string; children: string[]; depth: number }> =
      [];
    const visited = new Set<string>();

    function traverse(id: string, parents: string[], depth: number) {
      if (visited.has(id)) return;
      visited.add(id);

      const children = parentToChildren.get(id) ?? [];
      results.push({ id, children, depth });

      for (const child of children) {
        if (!parents.includes(child)) {
          traverse(child, [...parents, id], depth + 1);
        }
      }
    }

    const roots = parentToChildren.get(null) ?? [];
    for (const rootId of roots) {
      traverse(rootId, [], 0);
    }

    results.sort((a, b) => a.depth - b.depth);
    return results;
  }
}
