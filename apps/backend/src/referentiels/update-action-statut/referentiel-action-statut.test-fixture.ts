import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import { historiqueJustificationTable } from '@tet/backend/collectivites/personnalisations/models/historique-justification.table';
import { historiqueReponseBinaireTable } from '@tet/backend/collectivites/personnalisations/models/historique-reponse-binaire.table';
import { historiqueReponseChoixTable } from '@tet/backend/collectivites/personnalisations/models/historique-reponse-choix.table';
import { historiqueReponseProportionTable } from '@tet/backend/collectivites/personnalisations/models/historique-reponse-proportion.table';
import { justificationTable } from '@tet/backend/collectivites/personnalisations/models/justification.table';
import { reponseBinaireTable } from '@tet/backend/collectivites/personnalisations/models/reponse-binaire.table';
import { reponseChoixTable } from '@tet/backend/collectivites/personnalisations/models/reponse-choix.table';
import { reponseProportionTable } from '@tet/backend/collectivites/personnalisations/models/reponse-proportion.table';
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
import { labellisationTable } from '../labellisations/labellisation.table';
import { actionCommentaireTable } from '../models/action-commentaire.table';
import { actionStatutTable } from '../models/action-statut.table';
import { historiqueActionCommentaireTable } from '../models/historique-action-commentaire.table';
import { historiqueActionStatutTable } from '../models/historique-action-statut.table';
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
    `Score for referentiel ${referentiel}: ${scoreSnapshot.scoresPayload.scores.score.pointFait} / ${scoreSnapshot.scoresPayload.scores.score.pointPotentiel} (${scoreSnapshot.scoresPayload.scores.score.pointReferentiel}), search for actions to complete (${scoreSnapshot.scoresPayload.scores.score.completedTachesCount} completed taches)`
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
  // Clean history tables first (before main tables)
  const historiqueActionStatutsRet = await databaseService.db
    .delete(historiqueActionStatutTable)
    .where(eq(historiqueActionStatutTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${historiqueActionStatutsRet.length} historique action statuts removed from collectivite ${collectiviteId}`
  );

  const historiqueActionCommentairesRet = await databaseService.db
    .delete(historiqueActionCommentaireTable)
    .where(eq(historiqueActionCommentaireTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${historiqueActionCommentairesRet.length} historique action commentaires removed from collectivite ${collectiviteId}`
  );

  // Personnalisation histories : reponse_binaire / _choix / _proportion +
  // justification. Nécessaire avant la suppression des reponse_* publiques
  // dans `cleanupCollectivitePrerequisites`.
  const historiqueReponseBinaireRet = await databaseService.db
    .delete(historiqueReponseBinaireTable)
    .where(eq(historiqueReponseBinaireTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${historiqueReponseBinaireRet.length} historique reponses binaires removed from collectivite ${collectiviteId}`
  );

  const historiqueReponseChoixRet = await databaseService.db
    .delete(historiqueReponseChoixTable)
    .where(eq(historiqueReponseChoixTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${historiqueReponseChoixRet.length} historique reponses choix removed from collectivite ${collectiviteId}`
  );

  const historiqueReponseProportionRet = await databaseService.db
    .delete(historiqueReponseProportionTable)
    .where(eq(historiqueReponseProportionTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${historiqueReponseProportionRet.length} historique reponses proportion removed from collectivite ${collectiviteId}`
  );

  const reponseBinaireRet = await databaseService.db
    .delete(reponseBinaireTable)
    .where(eq(reponseBinaireTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${reponseBinaireRet.length} reponses binaires removed from collectivite ${collectiviteId}`
  );
  const reponseProportionRet = await databaseService.db
    .delete(reponseProportionTable)
    .where(eq(reponseProportionTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${reponseProportionRet.length} reponses proportion removed from collectivite ${collectiviteId}`
  );
  const reponseChoixRet = await databaseService.db
    .delete(reponseChoixTable)
    .where(eq(reponseChoixTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${reponseChoixRet.length} reponses choix removed from collectivite ${collectiviteId}`
  );

  const historiqueJustificationRet = await databaseService.db
    .delete(historiqueJustificationTable)
    .where(eq(historiqueJustificationTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${historiqueJustificationRet.length} historique justifications removed from collectivite ${collectiviteId}`
  );
  const justificationRet = await databaseService.db
    .delete(justificationTable)
    .where(eq(justificationTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${justificationRet.length} justifications removed from collectivite ${collectiviteId}`
  );

  const actionStatutsRet = await databaseService.db
    .delete(actionStatutTable)
    .where(eq(actionStatutTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${actionStatutsRet.length} action statuts removed from collectivite ${collectiviteId}`
  );

  const actionCommentairesRet = await databaseService.db
    .delete(actionCommentaireTable)
    .where(eq(actionCommentaireTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${actionCommentairesRet.length} action commentaires removed for collectivite ${collectiviteId}`
  );

  const preuveReglementaireRet = await databaseService.db
    .delete(preuveReglementaireTable)
    .where(eq(preuveReglementaireTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${preuveReglementaireRet.length} preuve reglementaires removed from collectivite ${collectiviteId}`
  );

  const preuveComplementaireRet = await databaseService.db
    .delete(preuveComplementaireTable)
    .where(eq(preuveComplementaireTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${preuveComplementaireRet.length} preuve complementaires removed from collectivite ${collectiviteId}`
  );

  const preuveLabellisationRet = await databaseService.db
    .delete(preuveLabellisationTable)
    .where(eq(preuveLabellisationTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${preuveLabellisationRet.length} labellisation preuves removed from collectivite ${collectiviteId}`
  );

  const preuveAuditRet = await databaseService.db
    .delete(preuveAuditTable)
    .where(eq(preuveAuditTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${preuveAuditRet.length} audit preuves removed from collectivite ${collectiviteId}`
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

  const labellisations = await databaseService.db
    .delete(labellisationTable)
    .where(eq(labellisationTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${labellisations.length} labellisations removed for collectivite ${collectiviteId}`
  );

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
