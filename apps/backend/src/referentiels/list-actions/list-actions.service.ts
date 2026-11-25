import { BadRequestException, Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  AuthenticatedUser,
  AuthUser,
} from '@tet/backend/users/models/auth.models';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import {
  PersonneTagOrUser,
  TagWithCollectiviteId,
} from '@tet/domain/collectivites';
import {
  ActionDynamicState,
  ActionId,
  filterHiddenActionsFromGroupedById,
  isNewReferentiel,
  ListActionsDynamicStateResult,
  ReferentielId,
  scoreSnapshotTreeToActionsWithGenealogyGroupedById,
} from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { and, count, eq, sql } from 'drizzle-orm';
import { actionPiloteTable } from '../models/action-pilote.table';
import { actionServiceTable } from '../models/action-service.table';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { ListActionsGroupedByIdInput } from './list-actions-grouped-by-id.input';
import {
  ListActionsErrorEnum,
  type ListActionsError,
} from './list-actions.errors';

@Injectable()
export class ListActionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectiviteService: CollectivitesService,
    private readonly permissions: PermissionService,
    private readonly snapshotService: SnapshotsService
  ) {}

  private db = this.databaseService.db;

  /**
   * Partie dynamique des actions d'un référentiel pour une collectivité :
   * scores, généalogie, pilotes et services. Les définitions (partie statique)
   * sont servies par `listActionDefinitions`.
   */
  async listActionsGroupedById(
    input: ListActionsGroupedByIdInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<ListActionsDynamicStateResult, ListActionsError>> {
    const { referentielId, collectiviteId } = input;

    const collectiviteIsPrivateResult =
      await this.collectiviteService.isPrivate(collectiviteId);
    if (!collectiviteIsPrivateResult.success) {
      return failure(
        collectiviteIsPrivateResult.error,
        collectiviteIsPrivateResult.cause
      );
    }
    const collectiviteIsPrivate = collectiviteIsPrivateResult.data;

    // CAE/ECI : toujours inclure les mesures désactivées (liste + navigation).
    // TE : exclure les mesures désactivées de la liste principale.
    const includeDesactive = !isNewReferentiel(referentielId);

    const permissionResult = await this.permissions.isAllowed(
      user,
      collectiviteIsPrivate
        ? 'referentiels.read_confidentiel'
        : 'referentiels.read',
      ResourceType.REFERENTIEL,
      { collectiviteId, referentielId }
    );
    if (!permissionResult.success) {
      return failure('UNAUTHORIZED');
    }

    const snapshotResult = await this.snapshotService.get(
      collectiviteId,
      referentielId,
      undefined,
      { user }
    );
    if (!snapshotResult.success) {
      return failure(
        ListActionsErrorEnum.SNAPSHOT_LOAD_FAILED,
        snapshotResult.cause
      );
    }

    const [referentielVersion, pilotesAndServicesByActionId] =
      await Promise.all([
        this.getPublishedReferentielVersion(referentielId),
        this.listPilotesAndServicesGroupedByActionId(
          collectiviteId,
          referentielId
        ),
      ]);
    if (referentielVersion === null) {
      return failure('NOT_FOUND');
    }

    const actionsWithScoreAndGenealogyGroupedById =
      scoreSnapshotTreeToActionsWithGenealogyGroupedById(
        snapshotResult.data.scoresPayload.scores,
        { includeDesactive }
      );

    const actionsById: Record<ActionId, ActionDynamicState> = {};

    for (const actionId in actionsWithScoreAndGenealogyGroupedById) {
      if (
        !Object.prototype.hasOwnProperty.call(
          actionsWithScoreAndGenealogyGroupedById,
          actionId
        )
      ) {
        continue;
      }

      // sélection explicite : les champs du nœud de snapshot qui doublonnent
      // la définition (nom, identifiant, points, tags…) ne sont pas renvoyés
      const {
        score,
        scoresTag,
        scoreIndicatif,
        parentId,
        childrenIds,
        nextId,
        previousId,
      } = actionsWithScoreAndGenealogyGroupedById[actionId];

      actionsById[actionId] = {
        actionId,
        score,
        scoresTag,
        ...(scoreIndicatif !== undefined ? { scoreIndicatif } : {}),
        parentId,
        childrenIds,
        nextId,
        previousId,
        pilotes: pilotesAndServicesByActionId.pilotes.get(actionId) ?? [],
        services: pilotesAndServicesByActionId.services.get(actionId) ?? [],
      };
    }

    if (!isNewReferentiel(referentielId)) {
      return success({
        referentielVersion,
        actionsById,
        hiddenActionIds: [],
      });
    }

    const hiddenActionIds = Object.values(actionsById)
      .filter((action) => action.score.desactive)
      .map(({ actionId }) => actionId);

    return success({
      referentielVersion,
      actionsById: filterHiddenActionsFromGroupedById(actionsById),
      hiddenActionIds,
    });
  }

  /** Version publiée courante du référentiel (et non celle du snapshot) */
  private async getPublishedReferentielVersion(
    referentielId: ReferentielId
  ): Promise<string | null> {
    const [referentiel] = await this.db
      .select({ version: referentielDefinitionTable.version })
      .from(referentielDefinitionTable)
      .where(eq(referentielDefinitionTable.id, referentielId));

    return referentiel?.version ?? null;
  }

  private async listPilotesAndServicesGroupedByActionId(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<{
    pilotes: Map<ActionId, PersonneTagOrUser[]>;
    services: Map<ActionId, TagWithCollectiviteId[]>;
  }> {
    const [pilotes, services] = await Promise.all([
      this.db
        .select({
          actionId: actionPiloteTable.actionId,
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
          `,
        })
        .from(actionPiloteTable)
        .innerJoin(
          actionDefinitionTable,
          eq(actionDefinitionTable.actionId, actionPiloteTable.actionId)
        )
        .leftJoin(dcpTable, eq(dcpTable.id, actionPiloteTable.userId))
        .leftJoin(
          personneTagTable,
          eq(personneTagTable.id, actionPiloteTable.tagId)
        )
        .where(
          and(
            eq(actionPiloteTable.collectiviteId, collectiviteId),
            eq(actionDefinitionTable.referentielId, referentielId)
          )
        )
        .groupBy(actionPiloteTable.actionId),

      this.db
        .select({
          actionId: actionServiceTable.actionId,
          services: sql<Array<TagWithCollectiviteId>>`
            array_agg(
              DISTINCT
              jsonb_build_object(
                'collectiviteId', ${actionServiceTable.collectiviteId},
                'nom', ${serviceTagTable.nom},
                'id', ${actionServiceTable.serviceTagId}
              )
            )
          `,
        })
        .from(actionServiceTable)
        .innerJoin(
          actionDefinitionTable,
          eq(actionDefinitionTable.actionId, actionServiceTable.actionId)
        )
        .leftJoin(
          serviceTagTable,
          eq(serviceTagTable.id, actionServiceTable.serviceTagId)
        )
        .where(
          and(
            eq(actionServiceTable.collectiviteId, collectiviteId),
            eq(actionDefinitionTable.referentielId, referentielId)
          )
        )
        .groupBy(actionServiceTable.actionId),
    ]);

    return {
      pilotes: new Map(pilotes.map((row) => [row.actionId, row.pilotes])),
      services: new Map(services.map((row) => [row.actionId, row.services])),
    };
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
}
