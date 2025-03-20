import { DatabaseService } from '@/backend/utils';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, getTableColumns, inArray, SQL, sql } from 'drizzle-orm';
import z from 'zod';
import {
  ReferentielIdEnum,
  actionDefinitionTable,
  actionTypeSchema,
} from '../index-domain';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';
import { actionPiloteTable } from '../models/action-pilote.table';
import {
  personneTagTable,
  serviceTagTable,
} from '../../collectivites/index-domain';
import { dcpTable } from '../../auth/index-domain';
import { actionServiceTable } from '../models/action-service.table';
import { listActionsWithDetailsRequestSchema } from '../list-actions/list-actions.request';

export const inputSchema = z.object({
  actionIds: z.string().array().optional(),
  actionTypes: actionTypeSchema.array().optional(),
});

type Input = z.infer<typeof inputSchema>;

export type ActionDefinition = Awaited<
  ReturnType<ListActionDefinitionsService['listActionDefinitions']>
>[0];

type ListActionDefinitionsWithDetailsInput = z.infer<
  typeof listActionsWithDetailsRequestSchema
>;

// TODO maybe see PG view `action_hierachy` to get children and parents

@Injectable()
export class ListActionDefinitionsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private db = this.databaseService.db;

  async listActionDefinitions({ actionIds, actionTypes }: Input) {
    const subQuery = this.db
      .$with('action_definition_with_depth_and_type')
      .as(this.listWithDepthAndType());

    const request = this.db.with(subQuery).select().from(subQuery);

    const filters = [
      // On inclut uniquement les actions des référentiels CAE et ECI pour le moment
      inArray(subQuery.referentielId, [
        ReferentielIdEnum.CAE,
        ReferentielIdEnum.ECI,
      ]),
    ];

    if (actionIds !== undefined) {
      filters.push(inArray(subQuery.actionId, actionIds));
    }

    if (actionTypes?.length) {
      filters.push(inArray(subQuery.actionType, actionTypes));
    }

    if (filters.length) {
      request.where(and(...filters));
    }

    request.orderBy(asc(subQuery.actionId));

    return request;
  }

  async listActionDefinitionsWithDetails({
    collectiviteId,
    filters,
  }: ListActionDefinitionsWithDetailsInput) {
    const subQuery = this.db
      .$with('action_definition_with_depth_and_type_and_details')
      .as(this.listWithDepthTypeAndDetails(collectiviteId));

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

    return await request;
  }

  private listWithDepth() {
    return this.db
      .select({
        ...getTableColumns(actionDefinitionTable),

        // Add a column with the depth of the action depending on the number of dots in the identifiant
        // Ex: 1.1   => depth 2
        //     1.1.1 => depth 3
        depth: sql`CASE
          WHEN ${actionDefinitionTable.identifiant} IS NULL OR ${actionDefinitionTable.identifiant} LIKE '' THEN 0
          ELSE REGEXP_COUNT(${actionDefinitionTable.identifiant}, '\\.') + 1
          END`.as('depth'),
      })
      .from(actionDefinitionTable);
  }

  private listWithDepthAndType() {
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

        // Add the action type from the `referentiel_definition.hierarchie` array
        // Ex: 'axe', 'sous-axe', etc
        actionType:
          sql`${referentielDefinitionTable.hierarchie}[${subQuery.depth} + 1]`.as(
            'actionType'
          ),
      })
      .from(subQuery)
      .innerJoin(
        referentielDefinitionTable,
        and(
          eq(referentielDefinitionTable.id, subQuery.referentielId),
          eq(referentielDefinitionTable.version, subQuery.referentielVersion)
        )
      );
  }

  private listWithDepthTypeAndDetails(collectiviteId: number) {
    const subQuery = this.db
      .$with('action_definition_with_depth_and_type')
      .as(this.listWithDepthAndType());

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
        actionType: subQuery.actionType,

        pilotes: sql<string[]>`
          array_remove(
            array_agg(DISTINCT
              CASE
                WHEN ${actionPiloteTable.userId} IS NOT NULL THEN
                  CONCAT(${dcpTable.prenom}, ' ', ${dcpTable.nom})
                ELSE ${personneTagTable.nom}
              END
            ),
            null
          )
        `.as('pilotes'),

        services: sql<string[]>`
          array_remove(
            array_agg(DISTINCT ${serviceTagTable.nom}),
            null
          )
        `.as('services'),
      })
      .from(subQuery)
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
        eq(actionServiceTable.actionId, subQuery.actionId)
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
        subQuery.actionType
      );
  }
}
