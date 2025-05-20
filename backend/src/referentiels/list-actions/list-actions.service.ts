import { dcpTable } from '@/backend/auth/index-domain';
import { DatabaseService } from '@/backend/utils';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, getTableColumns, inArray, SQL, sql } from 'drizzle-orm';
import {
  PersonneTagOrUser,
  personneTagTable,
  serviceTagTable,
  Tag,
} from '../../collectivites/index-domain';
import {
  actionDefinitionTable,
  ActionType,
  ActionWithScore,
} from '../index-domain';
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
}
