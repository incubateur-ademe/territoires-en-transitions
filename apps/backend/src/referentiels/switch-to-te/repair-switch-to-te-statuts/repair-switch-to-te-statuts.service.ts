import { Injectable, Logger } from '@nestjs/common';
import { CollectiviteReferentielModeService } from '@tet/backend/collectivites/collectivite-referentiel-mode/collectivite-referentiel-mode.service';
import { buildScoreMapByActionId } from '@tet/backend/referentiels/compute-score/score-map.rules';
import ScoresService from '@tet/backend/referentiels/compute-score/scores.service';
import { GetReferentielDefinitionService } from '@tet/backend/referentiels/definitions/get-referentiel-definition/get-referentiel-definition.service';
import { SNAPSHOTS } from '@tet/backend/referentiels/snapshots/snapshots.constants';
import { SnapshotsErrorEnum } from '@tet/backend/referentiels/snapshots/snapshots.errors';
import { SnapshotsService } from '@tet/backend/referentiels/snapshots/snapshots.service';
import { actionStatutCreateToActionStatutInDatabase } from '@tet/backend/referentiels/update-action-statut/action-statut-create-to-action-statut-in-database.adapter';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  ReferentielIdEnum,
  SnapshotJalonEnum,
  type ActionScore,
  type ScoreSnapshot,
} from '@tet/domain/referentiels';
import { BuildSwitchToTeContextService } from '../build-switch-to-te-context.service';
import { mergeStatuts } from '../merge-statuts/merge-statuts.rules';
import {
  SwitchToTeErrorEnum,
  type SwitchToTeError,
} from '../switch-to-te.errors';
import { RepairSwitchToTeStatutsRepository } from './repair-switch-to-te-statuts.repository';
import {
  applyRepairDecisionsToActionStatuts,
  decideRepairStatuts,
  type RepairStatutDecision,
} from './repair-switch-to-te-statuts.rules';

const TE_ROOT_ACTION_ID = ReferentielIdEnum.TE;

type ScoreResume = {
  pointFait: number | null;
  pointProgramme: number | null;
  pointPotentiel: number | null;
  pourcentageFait: number | null;
  etoiles: number | null;
};

type VersionsComparees = {
  referentielId: string;
  /** version utilisée à la bascule (snapshot pre-/post-switch-te) */
  bascule: string | null;
  /** version actuelle, celle du rejeu */
  actuelle: string;
  differentes: boolean;
};

export type RepairSwitchToTeStatutsReport = {
  collectiviteId: number;
  dryRun: boolean;
  populatedAt: string;
  /** auteur de la bascule, repris comme `modified_by` des lignes écrites */
  populatedBy: string;
  basculeModifiedAt: string | null;
  /**
   * `modified_at` commun à toutes les lignes écrites par cet appel (`now()` de
   * sa transaction) : permet de retrouver, pour un retour arrière, les lignes
   * que personne n'a modifiées depuis. `null` en dry-run ou sans écriture.
   */
  repairedAt: string | null;
  versions: { te: VersionsComparees; sources: VersionsComparees[] };
  compteurs: {
    misesAJour: number;
    suppressions: number;
    laisseesNonConcerne: number;
    ignoreesActivesALaBascule: number;
    /** écritures non faites : ligne modifiée entre la lecture et l'écriture */
    nonAppliquees: number;
  };
  lignes: Array<
    RepairStatutDecision & {
      activeAujourdhui: boolean;
      presenteDansReferentielActuel: boolean;
      appliquee: boolean | null;
    }
  >;
  score: { avant: ScoreResume; apres: ScoreResume };
};

/**
 * Rattrapage des collectivités basculées avant le correctif TET-8147 : les
 * statuts TE des actions désactivées le jour de la bascule ont été écrits
 * « Non concerné ». On rejoue la bascule corrigée depuis les snapshots
 * `pre-switch-te` et on ne corrige que les lignes restées intactes, puis on
 * recalcule le `score-courant` TE (pas le snapshot `post-switch-te`).
 */
@Injectable()
export class RepairSwitchToTeStatutsService {
  private readonly logger = new Logger(RepairSwitchToTeStatutsService.name);

  private static readonly SOURCE_REFERENTIELS = [
    ReferentielIdEnum.CAE,
    ReferentielIdEnum.ECI,
  ] as const;

  constructor(
    private readonly collectiviteReferentielModeService: CollectiviteReferentielModeService,
    private readonly snapshotsService: SnapshotsService,
    private readonly buildSwitchToTeContextService: BuildSwitchToTeContextService,
    private readonly getReferentielDefinitionService: GetReferentielDefinitionService,
    private readonly scoresService: ScoresService,
    private readonly transactionManager: TransactionManager,
    private readonly repository: RepairSwitchToTeStatutsRepository
  ) {}

  async repair(
    collectiviteId: number,
    { dryRun }: { dryRun: boolean }
  ): Promise<Result<RepairSwitchToTeStatutsReport, SwitchToTeError>> {
    const prefsResult =
      await this.collectiviteReferentielModeService.getReferentielPreferences(
        collectiviteId
      );
    if (!prefsResult.success) return prefsResult;

    const populated = prefsResult.data.te.populatedFromCaeEci;
    if (!populated) return failure(SwitchToTeErrorEnum.NOT_SWITCHED);

    const snapshotsResult = await this.getSwitchSnapshots(collectiviteId);
    if (!snapshotsResult.success) return snapshotsResult;
    const { preSwitchSnapshots, postSwitchSnapshot } = snapshotsResult.data;

    const ctxResult = await this.buildSwitchToTeContextService.build(
      collectiviteId,
      preSwitchSnapshots.map((snapshot) => snapshot.referentielId),
      preSwitchSnapshots,
      {}
    );
    if (!ctxResult.success) return ctxResult;
    const ctx = ctxResult.data;

    const basculeModifiedAt = await this.repository.getBasculeModifiedAt(
      collectiviteId,
      populated.populatedAt,
      populated.populatedBy
    );
    const intactNonConcerneActionIds = basculeModifiedAt
      ? await this.repository.listIntactNonConcerneActionIds(
          collectiviteId,
          basculeModifiedAt
        )
      : [];

    const { decisions, ignoredActionIds } = decideRepairStatuts({
      intactNonConcerneActionIds,
      expectedStatuts: mergeStatuts(ctx),
      postSwitchScoreMap: buildScoreMapByActionId(
        postSwitchSnapshot.scoresPayload.scores
      ),
    });

    let appliedActionIds: Set<string> | null = null;
    let repairedAt: string | null = null;
    let scoreApres: ActionScore | undefined;

    if (dryRun) {
      const { scoresPayload } =
        await this.scoresService.computeScoreForCollectivite(
          ReferentielIdEnum.TE,
          collectiviteId,
          {
            avecReferentielsOrigine: false,
            patchActionStatuts: (actionStatuts) =>
              applyRepairDecisionsToActionStatuts(actionStatuts, decisions),
          }
        );
      scoreApres = buildScoreMapByActionId(scoresPayload.scores).get(
        TE_ROOT_ACTION_ID
      );
    } else {
      if (basculeModifiedAt) {
        const writeResult = await this.writeDecisions(
          collectiviteId,
          basculeModifiedAt,
          populated.populatedBy,
          decisions
        );
        if (!writeResult.success) return writeResult;
        appliedActionIds = writeResult.data.applied;
        repairedAt = writeResult.data.repairedAt;
      }

      // toujours recalculé, même sans écriture : si le recalcul a échoué lors
      // d'un appel précédent, il n'y a plus de ligne intacte pour le relancer
      const courant = await this.snapshotsService.computeAndUpsert({
        collectiviteId,
        referentielId: ReferentielIdEnum.TE,
        jalon: SnapshotJalonEnum.COURANT,
      });
      if (!courant.success) {
        return failure(
          SwitchToTeErrorEnum.REPAIR_SCORE_RECOMPUTE_FAILED,
          courant.cause
        );
      }
      scoreApres = buildScoreMapByActionId(
        courant.data.scoresPayload.scores
      ).get(TE_ROOT_ACTION_ID);
    }

    const versionsResult = await this.compareVersions(
      ctx.referentielTe.version,
      preSwitchSnapshots,
      postSwitchSnapshot
    );

    const lignes = decisions.map((decision) => {
      const scoreActuel = ctx.teScoreMap.get(decision.actionId);
      return {
        ...decision,
        activeAujourdhui: scoreActuel ? scoreActuel.desactive !== true : false,
        presenteDansReferentielActuel: scoreActuel !== undefined,
        appliquee:
          appliedActionIds === null || decision.decision === 'keep'
            ? null
            : appliedActionIds.has(decision.actionId),
      };
    });

    return success({
      collectiviteId,
      dryRun,
      populatedAt: populated.populatedAt,
      populatedBy: populated.populatedBy,
      basculeModifiedAt,
      repairedAt,
      versions: versionsResult,
      compteurs: {
        misesAJour: decisions.filter((d) => d.decision === 'update').length,
        suppressions: decisions.filter((d) => d.decision === 'delete').length,
        laisseesNonConcerne: decisions.filter((d) => d.decision === 'keep')
          .length,
        ignoreesActivesALaBascule: ignoredActionIds.length,
        nonAppliquees: lignes.filter((ligne) => ligne.appliquee === false)
          .length,
      },
      lignes,
      score: {
        avant: toScoreResume(ctx.teScoreMap.get(TE_ROOT_ACTION_ID)),
        apres: toScoreResume(scoreApres),
      },
    });
  }

  private async getSwitchSnapshots(
    collectiviteId: number
  ): Promise<
    Result<
      {
        preSwitchSnapshots: ScoreSnapshot[];
        postSwitchSnapshot: ScoreSnapshot;
      },
      SwitchToTeError
    >
  > {
    const preSwitchSnapshots: ScoreSnapshot[] = [];
    for (const referentielId of RepairSwitchToTeStatutsService.SOURCE_REFERENTIELS) {
      const result = await this.snapshotsService.get(
        collectiviteId,
        referentielId,
        SNAPSHOTS.PRE_SWITCH_TE_REF
      );
      if (result.success) {
        preSwitchSnapshots.push(result.data);
      } else if (result.error !== SnapshotsErrorEnum.SNAPSHOT_NOT_FOUND) {
        return failure(SwitchToTeErrorEnum.DATABASE_ERROR, result.cause);
      }
    }
    if (preSwitchSnapshots.length === 0) {
      return failure(SwitchToTeErrorEnum.PRE_SWITCH_SNAPSHOT_MISSING);
    }

    const postSwitch = await this.snapshotsService.get(
      collectiviteId,
      ReferentielIdEnum.TE,
      SNAPSHOTS.POST_SWITCH_TE_REF
    );
    if (!postSwitch.success) {
      return failure(
        SwitchToTeErrorEnum.POST_SWITCH_SNAPSHOT_MISSING,
        postSwitch.cause
      );
    }

    return success({ preSwitchSnapshots, postSwitchSnapshot: postSwitch.data });
  }

  /**
   * Écrit les décisions dans une transaction. Retourne les actions
   * effectivement modifiées ou supprimées (une ligne modifiée entre-temps
   * n'est pas touchée) et l'horodatage de ces écritures (`null` si aucune).
   */
  private async writeDecisions(
    collectiviteId: number,
    basculeModifiedAt: string,
    modifiedBy: string,
    decisions: RepairStatutDecision[]
  ): Promise<
    Result<
      { applied: Set<string>; repairedAt: string | null },
      SwitchToTeError
    >
  > {
    const result = await this.transactionManager.executeSingle<
      { applied: Set<string>; repairedAt: string | null },
      SwitchToTeError
    >(async (tx) => {
      const applied = new Set<string>();
      for (const decision of decisions) {
        const key = {
          collectiviteId,
          actionId: decision.actionId,
          basculeModifiedAt,
        };
        let done = false;
        if (decision.decision === 'update') {
          done = await this.repository.updateIfIntact(
            {
              ...key,
              modifiedBy,
              values: actionStatutCreateToActionStatutInDatabase(
                decision.statut
              ),
            },
            tx
          );
        } else if (decision.decision === 'delete') {
          done = await this.repository.deleteIfIntact(key, tx);
        }
        if (done) applied.add(decision.actionId);
      }
      const repairedAt =
        applied.size > 0
          ? await this.repository.getTransactionTimestamp(tx)
          : null;
      return success({ applied, repairedAt });
    });

    if (!result.success) {
      this.logger.error(
        `Rattrapage des statuts TE échoué pour la collectivité ${collectiviteId}`,
        result.cause?.stack
      );
      return failure(SwitchToTeErrorEnum.REPAIR_FAILED, result.cause);
    }

    return result;
  }

  private async compareVersions(
    teVersionActuelle: string,
    preSwitchSnapshots: ScoreSnapshot[],
    postSwitchSnapshot: ScoreSnapshot
  ): Promise<RepairSwitchToTeStatutsReport['versions']> {
    const compare = (
      referentielId: string,
      bascule: string | null,
      actuelle: string
    ): VersionsComparees => ({
      referentielId,
      bascule,
      actuelle,
      differentes: bascule !== actuelle,
    });

    const sources = await Promise.all(
      preSwitchSnapshots.map(async (snapshot) => {
        const definition =
          await this.getReferentielDefinitionService.getReferentielDefinition(
            snapshot.referentielId
          );
        return compare(
          snapshot.referentielId,
          snapshot.referentielVersion,
          definition.version
        );
      })
    );

    return {
      te: compare(
        ReferentielIdEnum.TE,
        postSwitchSnapshot.referentielVersion,
        teVersionActuelle
      ),
      sources,
    };
  }
}

const toScoreResume = (score: ActionScore | undefined): ScoreResume => {
  const pointFait = score?.pointFait ?? null;
  const pointPotentiel = score?.pointPotentiel ?? null;
  return {
    pointFait,
    pointProgramme: score?.pointProgramme ?? null,
    pointPotentiel,
    pourcentageFait:
      pointFait !== null && pointPotentiel
        ? Math.round((pointFait / pointPotentiel) * 10000) / 100
        : null,
    etoiles: score?.etoiles ?? null,
  };
};
