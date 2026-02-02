import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  ActionStatutCreate,
  ActionTypeEnum,
  ReferentielId,
  StatutAvancement,
  StatutAvancementEnum,
  TreeOfActionsIncludingScore,
} from '@tet/domain/referentiels';
import { TRPCClient } from '@trpc/client';
import { eq, inArray } from 'drizzle-orm';
import { chunk } from 'es-toolkit';
import { auditTable } from '../labellisations/audit.table';
import { auditeurTable } from '../labellisations/auditeur.table';
import { mesureAuditStatutTable } from '../labellisations/handle-mesure-audit-statut/mesure-audit-statut.table';
import { labellisationDemandeTable } from '../labellisations/labellisation-demande.table';
import { actionStatutTable } from '../models/action-statut.table';
import { snapshotTable } from '../snapshots/snapshot.table';

export const UPDATE_ACTION_STATUT_CHUNK_SIZE = 100;

export function getActionStatusCreateForAction(
  action: TreeOfActionsIncludingScore,
  avancement: StatutAvancement
): Omit<ActionStatutCreate, 'collectiviteId'>[] {
  if (
    (action.actionType === ActionTypeEnum.SOUS_ACTION ||
      action.actionType === ActionTypeEnum.TACHE) &&
    (action.score.avancement === avancement || !action.score.concerne)
  ) {
    // Si la sous-action/tache est renseignée ou non concernée, on ne crée pas de statut supplémentaire
    return [];
  }

  if (
    action.actionType === ActionTypeEnum.REFERENTIEL ||
    action.actionType === ActionTypeEnum.AXE ||
    action.actionType === ActionTypeEnum.SOUS_AXE ||
    action.actionType === ActionTypeEnum.ACTION ||
    (action.actionType === ActionTypeEnum.SOUS_ACTION &&
      action.actionsEnfant.length > 0)
  ) {
    return action.actionsEnfant.flatMap((subAction) =>
      getActionStatusCreateForAction(subAction, avancement)
    );
  } else if (
    action.actionType === ActionTypeEnum.SOUS_ACTION ||
    action.actionType === ActionTypeEnum.TACHE
  ) {
    return [
      {
        actionId: action.actionId,
        avancement: avancement,
        concerne: action.score.concerne,
      },
    ];
  }

  throw new Error(`Action type ${action.actionType} not supported`);
}

export async function updateAllNeedReferentielStatutsToCompleteReferentiel(
  trpcClient: TRPCClient<AppRouter>,
  collectiviteId: number,
  referentiel: ReferentielId
): Promise<void> {
  const scoreSnapshot =
    await trpcClient.referentiels.snapshots.getCurrent.query({
      referentielId: referentiel,
      collectiviteId: collectiviteId,
    });
  console.log(
    `Score for referentiel ${referentiel}: ${scoreSnapshot.scoresPayload.scores.score.pointFait} / ${scoreSnapshot.scoresPayload.scores.score.pointPotentiel}, search for actions to complete`
  );

  const actionStatusesToCreate: ActionStatutCreate[] =
    getActionStatusCreateForAction(
      scoreSnapshot.scoresPayload.scores,
      StatutAvancementEnum.PAS_FAIT
    ).map((actionStatus) => ({
      ...actionStatus,
      collectiviteId: collectiviteId,
    }));
  console.log(
    `${actionStatusesToCreate.length} action statuts to create to complete referentiel ${referentiel}`
  );

  const actionStatusesChunks = chunk(
    actionStatusesToCreate,
    UPDATE_ACTION_STATUT_CHUNK_SIZE
  );
  let updatedCount = 0;
  for (const actionStatusesChunk of actionStatusesChunks) {
    await trpcClient.referentiels.actions.updateStatuts.mutate({
      actionStatuts: actionStatusesChunk,
    });
    updatedCount += actionStatusesChunk.length;
    console.log(
      `${updatedCount} action statuts created to complete referentiel ${referentiel}`
    );
  }
}

function getActionInScoreTree(
  action: TreeOfActionsIncludingScore,
  actionId: string
): TreeOfActionsIncludingScore | undefined {
  if (action.actionId === actionId) {
    return action;
  }
  for (const child of action.actionsEnfant) {
    const result = getActionInScoreTree(child, actionId);
    if (result) {
      return result;
    }
  }
}

export async function updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
  trpcClient: TRPCClient<AppRouter>,
  collectiviteId: number,
  referentiel: ReferentielId
): Promise<void> {
  const scoreSnapshot =
    await trpcClient.referentiels.snapshots.getCurrent.query({
      referentielId: referentiel,
      collectiviteId: collectiviteId,
    });
  console.log(
    `Score for referentiel ${referentiel}: ${scoreSnapshot.scoresPayload.scores.score.pointFait} / ${scoreSnapshot.scoresPayload.scores.score.pointPotentiel}, search for actions to complete`
  );

  const parcours =
    await trpcClient.referentiels.labellisations.getParcours.query({
      collectiviteId: collectiviteId,
      referentielId: referentiel,
    });

  const actionStatusesToUpdate: ActionStatutCreate[] = Array.from(
    new Map(
      parcours.criteres_action
        .map((critere) => {
          if (!critere.atteint) {
            console.log(`Critere ${critere.action_id} not atteint`);
            const action = getActionInScoreTree(
              scoreSnapshot.scoresPayload.scores,
              critere.action_id
            );
            if (!action) {
              throw new Error(
                `Action ${critere.action_id} not found in score tree`
              );
            }
            const actionStatuses = getActionStatusCreateForAction(
              action,
              StatutAvancementEnum.FAIT
            ).map((actionStatus) => ({
              ...actionStatus,
              collectiviteId: collectiviteId,
            }));
            return actionStatuses;
          } else {
            return [];
          }
        })
        .flat()
        .map((actionStatus) => [actionStatus.actionId, actionStatus])
    ).values()
  );

  if (actionStatusesToUpdate.length > 0) {
    console.log(
      `${
        actionStatusesToUpdate.length
      } action statuts to update to match referentiel score criteria for referentiel ${referentiel}: ${actionStatusesToUpdate
        .map((actionStatus) => actionStatus.actionId)
        .join(', ')}`
    );
    const actionStatusesChunks = chunk(
      actionStatusesToUpdate,
      UPDATE_ACTION_STATUT_CHUNK_SIZE
    );
    let updatedCount = 0;
    for (const actionStatusesChunk of actionStatusesChunks) {
      await trpcClient.referentiels.actions.updateStatuts.mutate({
        actionStatuts: actionStatusesChunk,
      });
      updatedCount += actionStatusesChunk.length;
      console.log(
        `${updatedCount} action statuts updated to match referentiel score criteria for referentiel ${referentiel}`
      );
    }
  } else {
    console.log(
      `No action statuts to update to match referentiel score criteria for referentiel ${referentiel}`
    );
  }
}

export async function cleanupReferentielActionStatutsAndLabellisations(
  databaseService: DatabaseServiceInterface,
  collectiviteId: number
) {
  const actionStatutsRet = await databaseService.db
    .delete(actionStatutTable)
    .where(eq(actionStatutTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${actionStatutsRet.length} action statuts removed from collectivite ${collectiviteId}`
  );

  const preuveLabellisationRet = await databaseService.db
    .delete(preuveLabellisationTable)
    .where(eq(preuveLabellisationTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${preuveLabellisationRet.length} labellisation preuves removed from collectivite ${collectiviteId}`
  );

  const snapshotRet = await databaseService.db
    .delete(snapshotTable)
    .where(eq(snapshotTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${snapshotRet.length} snapshots removed from collectivite ${collectiviteId}`
  );

  // Remove auditeur
  // Delete join not available https://github.com/drizzle-team/drizzle-orm/issues/3100
  const audits = await databaseService.db
    .select()
    .from(auditTable)
    .where(eq(auditTable.collectiviteId, collectiviteId));
  console.log(
    `${audits.length} audits found for collectivite ${collectiviteId}`
  );
  if (audits.length > 0) {
    const auditeursRet = await databaseService.db
      .delete(auditeurTable)
      .where(
        inArray(
          auditeurTable.auditId,
          audits.map((audit) => audit.id)
        )
      )
      .returning();
    console.log(
      `${auditeursRet.length} auditeurs removed from collectivite ${collectiviteId}`
    );

    const mesureAuditStatutsRet = await databaseService.db
      .delete(mesureAuditStatutTable)
      .where(
        inArray(
          mesureAuditStatutTable.auditId,
          audits.map((audit) => audit.id)
        )
      )
      .returning();
    console.log(
      `${mesureAuditStatutsRet.length} mesure audit statuts removed from collectivite ${collectiviteId}`
    );
  }

  const auditRet = await databaseService.db
    .delete(auditTable)
    .where(eq(auditTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${auditRet.length} audits removed from collectivite ${collectiviteId}`
  );

  const labellisationDemandesRet = await databaseService.db
    .delete(labellisationDemandeTable)
    .where(eq(labellisationDemandeTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${labellisationDemandesRet.length} demandes de labellisation removed from collectivite ${collectiviteId}`
  );
}
