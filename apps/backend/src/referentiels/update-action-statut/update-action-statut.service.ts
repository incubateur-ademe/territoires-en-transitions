import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  ActionStatutCreate,
  actionStatutSchemaCreate,
  ActionTypeEnum,
  canUpdateActionStatutWithoutPermissionCheck,
  findActionById,
  getParentId,
  getReferentielIdFromActionId,
  ScoreSnapshot,
  TreeOfActionsIncludingScore,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { sql } from 'drizzle-orm';
import z from 'zod';
import { isErrorWithCause } from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import { GetLabellisationService } from '../labellisations/get-labellisation.service';
import { actionStatutTable } from '../models/action-statut.table';
import { SnapshotsService } from '../snapshots/snapshots.service';

export const upsertActionStatutsRequestSchema = z.object({
  actionStatuts: z.array(actionStatutSchemaCreate).min(1),
});

export type UpsertActionStatutsRequest = z.infer<
  typeof upsertActionStatutsRequestSchema
>;

@Injectable()
export class UpdateActionStatutService {
  private readonly logger = new Logger(UpdateActionStatutService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly snapshotsService: SnapshotsService,
    private readonly getLabellisationService: GetLabellisationService
  ) {}

  async upsertActionStatuts(
    actionStatuts: ActionStatutCreate[],
    user: AuthUser
  ): Promise<ScoreSnapshot> {
    if (actionStatuts.length === 0) {
      throw new BadRequestException('No action statuts to update');
    }
    const collectiviteId = actionStatuts[0].collectiviteId;
    const referentielId = getReferentielIdFromActionId(
      actionStatuts[0].actionId
    );

    // Check user access
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const seenActionIds = new Set<string>();
    for (const actionStatut of actionStatuts) {
      const key = `${actionStatut.collectiviteId}:${actionStatut.actionId}`;
      if (seenActionIds.has(key)) {
        throw new BadRequestException(
          `Action ${actionStatut.actionId} en double dans la requête`
        );
      }
      seenActionIds.add(key);
      const actionReferentielId = getReferentielIdFromActionId(
        actionStatut.actionId
      );
      if (actionReferentielId !== referentielId) {
        throw new BadRequestException(
          `Action ${actionStatut.actionId} is not in the same referentiel as the other actions`
        );
      }
      if (actionStatut.collectiviteId !== collectiviteId) {
        throw new BadRequestException(
          `Action ${actionStatut.actionId} is not in the same collectivite as the other actions`
        );
      }
    }

    const parcours =
      await this.getLabellisationService.getParcoursLabellisation({
        collectiviteId,
        referentielId,
      });
    const currentScore = await this.snapshotsService.get(
      collectiviteId,
      referentielId
    );
    const isAuditeur = parcours.auditeurs.some(
      (auditeur) => auditeur.userId === user.id
    );

    const actionsWithDesactive = actionStatuts.map((actionStatut) => {
      try {
        return {
          actionId: actionStatut.actionId,
          desactive: findActionById(
            currentScore.scoresPayload.scores,
            actionStatut.actionId
          ).score.desactive,
        };
      } catch (error) {
        throw new BadRequestException(getErrorMessage(error));
      }
    });

    const canUpdateResult = canUpdateActionStatutWithoutPermissionCheck({
      parcoursStatus: parcours.status,
      actions: actionsWithDesactive,
      isAuditeur: isAuditeur,
    });
    if (!canUpdateResult.canUpdate) {
      throw new BadRequestException(canUpdateResult.reason);
    }

    const cascadeStatuts = this.computeCascadeStatuts(
      actionStatuts,
      currentScore.scoresPayload.scores,
      collectiviteId
    );
    const allStatuts = this.mergeWithCascade(actionStatuts, cascadeStatuts);

    if (cascadeStatuts.length > 0) {
      this.logger.log(
        `Cascade: ${
          cascadeStatuts.length
        } statut(s) supplémentaire(s) ajouté(s) (${cascadeStatuts
          .map((s) => s.actionId)
          .join(', ')})`
      );
    }

    try {
      await this.databaseService.db
        .insert(actionStatutTable)
        .values(
          allStatuts.map((actionStatut) => ({
            ...actionStatut,
            modifiedBy: user.id,
          }))
        )
        .onConflictDoUpdate({
          target: [
            actionStatutTable.collectiviteId,
            actionStatutTable.actionId,
          ],
          set: {
            avancement: sql.raw(
              `excluded.${actionStatutTable.avancement.name}`
            ),
            avancementDetaille: sql.raw(
              `excluded.${actionStatutTable.avancementDetaille.name}`
            ),
            concerne: sql.raw(`excluded.${actionStatutTable.concerne.name}`),
            modifiedBy: sql.raw(
              `excluded.${actionStatutTable.modifiedBy.name}`
            ),
          },
        });
    } catch (error) {
      if (
        isErrorWithCause(error) &&
        error.cause.code ===
          PgIntegrityConstraintViolation.ForeignKeyViolation &&
        error.cause.constraint === 'action_statut_action_id_fkey'
      ) {
        const errorMessage =
          actionStatuts.length > 1
            ? `Une ou plusieurs actions n'existent pas pour le referentiel ${referentielId}`
            : `L'action ${actionStatuts[0].actionId} n'existe pas pour le referentiel ${referentielId}`;
        this.logger.warn(errorMessage);
        throw new NotFoundException(errorMessage);
      }

      this.logger.error(error);
      throw error;
    }

    return this.snapshotsService.computeAndUpsert({
      collectiviteId,
      referentielId,
      user,
    });
  }

  /**
   * Calcule les statuts en cascade à appliquer pour maintenir la cohérence
   * entre sous-actions et tâches :
   *
   * - Tâche renseignée → si le parent (sous-action) a un statut direct
   *   (autre que non_renseigne/detaille), le parent est remis à non_renseigne.
   *   `computeStatut` dérivera alors automatiquement "detaille".
   *
   * - Sous-action avec un statut direct (autre que non_renseigne/detaille)
   *   → toutes les tâches enfants renseignées sont remises à non_renseigne.
   */
  private computeCascadeStatuts(
    actionStatuts: ActionStatutCreate[],
    scoresTree: TreeOfActionsIncludingScore,
    collectiviteId: number
  ): ActionStatutCreate[] {
    const explicitActionIds = new Set(actionStatuts.map((s) => s.actionId));

    const findNode = (actionId: string) => {
      try {
        return findActionById(scoresTree, actionId);
      } catch {
        return undefined;
      }
    };

    const hasDirectStatus = (node: TreeOfActionsIncludingScore) =>
      node.score.avancement &&
      node.score.avancement !== 'non_renseigne' &&
      node.score.avancement !== 'detaille';

    const makeResetStatut = (actionId: string): ActionStatutCreate => ({
      collectiviteId,
      actionId,
      avancement: 'non_renseigne',
      avancementDetaille: null,
      concerne: true,
    });

    // Tâche renseignée → reset le parent sous-action s'il a un statut direct
    const parentResets = actionStatuts
      .filter((s) => findNode(s.actionId)?.actionType === ActionTypeEnum.TACHE)
      .map((s) => getParentId({ actionId: s.actionId }))
      .filter((parentId): parentId is string => parentId !== null)
      .filter((parentId) => !explicitActionIds.has(parentId))
      .map((parentId) => ({ parentId, node: findNode(parentId) }))
      .filter(
        ({ node }) =>
          node?.actionType === ActionTypeEnum.SOUS_ACTION &&
          hasDirectStatus(node)
      )
      .map(({ parentId }) => makeResetStatut(parentId));

    return parentResets;
  }

  /**
   * Fusionne les statuts explicites avec les statuts en cascade.
   * Les statuts explicites ont toujours priorité sur les cascade.
   */
  private mergeWithCascade(
    explicit: ActionStatutCreate[],
    cascade: ActionStatutCreate[]
  ): ActionStatutCreate[] {
    const explicitIds = new Set(explicit.map((s) => s.actionId));
    const uniqueCascade = cascade.filter((s) => !explicitIds.has(s.actionId));
    return [...explicit, ...uniqueCascade];
  }
}
