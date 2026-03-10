import { BadRequestException, Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  AuthenticatedUser,
  AuthUser,
} from '@tet/backend/users/models/auth.models';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  PersonneTagOrUser,
  TagWithCollectiviteId,
} from '@tet/domain/collectivites';
import {
  ActionId,
  ActionsGroupedById,
  ActionType,
  ActionWithDefinitionAndPilotes,
  scoreSnapshotTreeToActionsWithGenealogyGroupedById,
} from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { and, asc, count, eq, getTableColumns, SQL, sql } from 'drizzle-orm';
import { actionPiloteTable } from '../models/action-pilote.table';
import { actionServiceTable } from '../models/action-service.table';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { ListActionsGroupedByIdInput } from './list-actions-grouped-by-id.input';

@Injectable()
export class ListActionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectiviteService: CollectivitesService,
    private readonly permissions: PermissionService,
    private readonly snapshotService: SnapshotsService
  ) {}

  private db = this.databaseService.db;

  async listActionsGroupedById(
    { referentielId, collectiviteId }: ListActionsGroupedByIdInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<ActionsGroupedById> {
    const collectiviteIsPrivate = await this.collectiviteService.isPrivate(
      collectiviteId
    );

    await this.permissions.isAllowed(
      user,
      collectiviteIsPrivate
        ? 'referentiels.read_confidentiel'
        : 'referentiels.read',
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const promiseOfActionsWithDefinitionAndPilotes =
      this.listActionsWithDefinitionAndPilotesGroupedById({
        collectiviteId,
        referentielId,
      });

    const promiseOfActionsWithScoreAndGenealogyGroupedById =
      this.snapshotService
        .get(collectiviteId, referentielId)
        .then((snapshot) =>
          scoreSnapshotTreeToActionsWithGenealogyGroupedById(
            snapshot.scoresPayload.scores
          )
        );

    const [
      actionsWithDefinitionAndPilotes,
      actionsWithScoreAndGenealogyGroupedById,
    ] = await Promise.all([
      promiseOfActionsWithDefinitionAndPilotes,
      promiseOfActionsWithScoreAndGenealogyGroupedById,
    ]);

    const actions = {} as ActionsGroupedById;

    for (const actionId in actionsWithScoreAndGenealogyGroupedById) {
      if (
        !Object.prototype.hasOwnProperty.call(
          actionsWithScoreAndGenealogyGroupedById,
          actionId
        )
      ) {
        continue;
      }

      actions[actionId] = {
        ...actionsWithScoreAndGenealogyGroupedById[actionId],
        ...actionsWithDefinitionAndPilotes[actionId],
      };
    }

    return actions;
  }

  private async listActionsWithDefinitionAndPilotesGroupedById({
    collectiviteId,
    referentielId,
  }: ListActionsGroupedByIdInput): Promise<
    Record<ActionId, ActionWithDefinitionAndPilotes>
  > {
    const subQuery = this.db
      .$with('action_definition_with_details')
      .as(this.listWithDetails(collectiviteId));

    const request = this.db.with(subQuery).select().from(subQuery);

    const queryFilters: SQL[] = [];

    queryFilters.push(eq(subQuery.referentielId, referentielId));

    request.where(and(...queryFilters));
    request.orderBy(asc(subQuery.actionId));

    const actions = await request;

    return actions.reduce((acc, action) => {
      acc[action.actionId] = action;
      return acc;
    }, {} as Record<ActionId, ActionWithDefinitionAndPilotes>);
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

  public listWithDetails(collectiviteId: number) {
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

        questionIds: sql<Array<string>>`
          COALESCE(
            (
              SELECT array_to_json(
                array_agg(DISTINCT ${questionActionTable.questionId})
              )
              FROM ${questionActionTable}
              WHERE ${eq(questionActionTable.actionId, subQuery.actionId)}
            ),
            '[]'::json
          )
        `.as('questionIds'),

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

        services: sql<Array<TagWithCollectiviteId>>`
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
      .leftJoin(dcpTable, eq(dcpTable.id, actionPiloteTable.userId))
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
