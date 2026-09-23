import { Injectable, Logger } from '@nestjs/common';
import CrudValeursService, {
  IndicateurValeurDeletionListener,
  IndicateurValeurUpsertedEvent,
} from '@tet/backend/indicateurs/valeurs/crud-valeurs.service';
import { ScoreIndicatifService } from '@tet/backend/referentiels/score-indicatif/score-indicatif.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  getReferentielIdFromActionId,
  isNewReferentiel,
  ReferentielId,
  ScoreSnapshot,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { ScoreIndicatifErrorEnum } from '../score-indicatif/score-indicatif.errors';
import { mapSnapshotsError } from '../snapshots/snapshots.errors';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { UpdateActionStatutErrorEnum } from '../update-action-statut/update-action-statut.errors';
import { UpdateActionStatutService } from '../update-action-statut/update-action-statut.service';
import { calculateAvancementFromScore } from './calculate-avancement-from-score.rules';
import { SetScoreFromIndicateurError } from './set-score-from-indicateur.errors';
import { SetScoreFromIndicateurInput } from './set-score-from-indicateur.input';

@Injectable()
export class SetScoreFromIndicateurService {
  private readonly logger = new Logger(SetScoreFromIndicateurService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly scoreIndicatifService: ScoreIndicatifService,
    private readonly updateActionStatutService: UpdateActionStatutService,
    private readonly snapshotsService: SnapshotsService,
    private readonly indicateurValeursService: CrudValeursService
  ) {
    // Une valeur d'indicateur retenue pour un score peut être corrigée après
    // coup (sans changer la sélection) : le score et l'avancement qui en
    // dérivent doivent alors être réactualisés.
    this.indicateurValeursService.registerValeurUpsertedListener((event) =>
      this.onIndicateurValeurUpserted(event)
    );

    // Une valeur d'indicateur sélectionnée pour un score peut aussi être
    // supprimée : la sélection est alors perdue (ON DELETE
    // CASCADE) et le score/avancement dérivés doivent être réactualisés en
    // conséquence.
    const deletionListener: IndicateurValeurDeletionListener<
      { collectiviteId: number; actionId: string }[]
    > = {
      onWillDelete: (event) =>
        this.getActionsUsingIndicateurValeurs([event.indicateurValeurId]),
      onDeleted: (actions, event) =>
        this.refreshActionsAvancementAndSnapshots(actions, event.user),
    };
    this.indicateurValeursService.registerValeurDeletionListener(
      deletionListener
    );
  }

  private async getActionsUsingIndicateurValeurs(
    indicateurValeurIds: number[]
  ): Promise<{ collectiviteId: number; actionId: string }[]> {
    const actionsResult =
      await this.scoreIndicatifService.getActionsUsingIndicateurValeur(
        indicateurValeurIds
      );
    if (!actionsResult.success) {
      this.logger.error(
        `Impossible de retrouver les actions utilisant les valeurs d'indicateur ${indicateurValeurIds.join(
          ', '
        )}`,
        actionsResult.cause?.stack
      );
      return [];
    }
    return actionsResult.data;
  }

  private async onIndicateurValeurUpserted(
    event: IndicateurValeurUpsertedEvent
  ): Promise<void> {
    const actions = await this.getActionsUsingIndicateurValeurs([
      event.indicateurValeurId,
    ]);
    if (!actions.length) {
      return;
    }
    await this.refreshActionsAvancementAndSnapshots(actions, event.user);
  }

  /**
   * Recalcule et écrit le statut d'avancement dérivé de chaque action
   * fournie, puis recalcule le snapshot de chaque référentiel impacté.
   */
  private async refreshActionsAvancementAndSnapshots(
    actions: { collectiviteId: number; actionId: string }[],
    user: AuthenticatedUser
  ): Promise<void> {
    // collectiviteId + referentielId impactés, dédupliqués : une même valeur
    // d'indicateur peut être utilisée par plusieurs actions d'un référentiel.
    const impactedReferentiels = new Map<
      string,
      { collectiviteId: number; referentielId: ReferentielId }
    >();

    for (const { collectiviteId, actionId } of actions) {
      let referentielId: ReferentielId;
      try {
        referentielId = getReferentielIdFromActionId(actionId);
      } catch {
        continue;
      }
      // Le score dérivé ne s'applique qu'au référentiel TE, voir setScoreFromIndicateur.
      if (!isNewReferentiel(referentielId)) {
        continue;
      }

      const refreshResult = await this.refreshAvancementForAction(
        collectiviteId,
        actionId,
        { user }
      );
      if (!refreshResult.success) {
        this.logger.error(
          `Échec du recalcul de l'avancement de l'action ${actionId}`,
          refreshResult.cause?.stack
        );
        continue;
      }

      impactedReferentiels.set(`${collectiviteId}:${referentielId}`, {
        collectiviteId,
        referentielId,
      });
    }

    // Après le commit de chaque statut : le calcul du snapshot lit la base
    // hors transaction et ne verrait pas les statuts non encore committés.
    await Promise.all(
      [...impactedReferentiels.values()].map(
        async ({ collectiviteId, referentielId }) => {
          const result = await this.snapshotsService.computeAndUpsert(
            { collectiviteId, referentielId },
            { user }
          );
          if (!result.success) {
            this.logger.error(
              `Échec du recalcul du snapshot pour la collectivité ${collectiviteId} et le référentiel ${referentielId}`,
              result.cause?.stack
            );
          }
        }
      )
    );
  }

  /**
   * Recalcule le score indicatif d'une action à partir des valeurs
   * actuellement retenues, puis en dérive et écrit le statut d'avancement.
   *
   * `hasValeurSelectionnee` (tous indicateurs de l'action confondus, dérivé
   * du score qui vient d'être recalculé — pas de requête supplémentaire)
   * prime sur le résultat du calcul, SAUF quand un indicateur associé est
   * marqué "non applicable" : certains tokens optionnels (`est_suivi(...)`,
   * `opt_val(...)`) ne bloquent jamais le calcul et produisent un score
   * défini (souvent 0) même sans aucune sélection — sans cette priorité, une
   * action jamais renseignée par la collectivité afficherait "pas fait" au
   * lieu de "non renseignée". Le marquage "non applicable" est en revanche
   * une décision explicite de la collectivité : le score à 0 qui en résulte
   * doit rester écrit même sans aucune sélection (contrairement à une
   * absence de sélection "par défaut", qui redevient "non renseignée").
   */
  private async refreshAvancementForAction(
    collectiviteId: number,
    actionId: string,
    {
      user,
      tx,
    }: {
      user: AuthenticatedUser;
      tx?: Transaction;
    }
  ): Promise<Result<void, SetScoreFromIndicateurError>> {
    const scoreResult = await this.scoreIndicatifService.getScoreIndicatif(
      { collectiviteId, actionIds: [actionId] },
      { tx }
    );
    if (!scoreResult.success) {
      return failure(scoreResult.error, scoreResult.cause);
    }
    const actionScore = scoreResult.data[actionId];
    const indicateurNonApplicable =
      actionScore?.indicateurs?.some((indicateur) => !indicateur.isApplicable) ??
      false;
    // `actionScore` est `undefined` quand le score n'est pas calculable du
    // tout pour cette action (formule ou indicateurs manquants) : dans ce cas
    // on ne peut rien déduire de la sélection, donc on ne force pas de reset
    // (le calcul d'`avancement` ci-dessous laissera de toute façon le statut
    // inchangé).
    const hasValeurSelectionnee = actionScore
      ? (actionScore.fait?.valeursUtilisees.length ?? 0) > 0 ||
        (actionScore.programme?.valeursUtilisees.length ?? 0) > 0
      : true;

    if (!hasValeurSelectionnee && !indicateurNonApplicable) {
      const resetResult =
        await this.updateActionStatutService.upsertActionStatutsWithoutSnapshot(
          [
            {
              collectiviteId,
              actionId,
              statut: StatutAvancementEnum.NON_RENSEIGNE,
              statutDetailleAuPourcentage: null,
            },
          ],
          { user, tx }
        );
      if (!resetResult.success) {
        return failure(resetResult.error, resetResult.cause);
      }
      return success(undefined);
    }

    const avancement = calculateAvancementFromScore(actionScore?.fait?.score);
    if (!avancement) {
      this.logger.log(
        `Score indicatif non calculable pour l'action ${actionId} : statut inchangé`
      );
      return success(undefined);
    }

    const statutResult =
      await this.updateActionStatutService.upsertActionStatutsWithoutSnapshot(
        [
          {
            collectiviteId,
            actionId,
            statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
            statutDetailleAuPourcentage: avancement,
          },
        ],
        { user, tx }
      );
    if (!statutResult.success) {
      return failure(statutResult.error, statutResult.cause);
    }

    return success(undefined);
  }

  /**
   * Enregistre la valeur d'indicateur retenue pour une action et en dérive son
   * statut d'avancement, puis renvoie le snapshot de score recalculé.
   *
   * Les deux écritures sont indissociables : si le statut ne peut pas être
   * appliqué, la valeur n'est pas enregistrée non plus. Le score ne devient
   * jamais incohérent avec la valeur qui l'a produit.
   */
  async setScoreFromIndicateur(
    input: SetScoreFromIndicateurInput,
    { user }: ServiceSecondArg
  ): Promise<Result<ScoreSnapshot, SetScoreFromIndicateurError>> {
    const { collectiviteId, actionId } = input;

    let referentielId: ReferentielId;
    try {
      referentielId = getReferentielIdFromActionId(actionId);
    } catch {
      return failure(ScoreIndicatifErrorEnum.INVALID_ACTION_ID);
    }
    // Le score dérivé ne s'applique qu'au référentiel TE : les référentiels
    // historiques (cae, eci) conservent `setValeursUtilisees` et le
    // caractère indicatif du score.
    if (!isNewReferentiel(referentielId)) {
      return failure(ScoreIndicatifErrorEnum.INVALID_ACTION_ID);
    }

    const writeResult = await this.transactionManager.executeSingle<
      void,
      SetScoreFromIndicateurError
    >(async (tx) => {
      const valeursResult =
        await this.scoreIndicatifService.setValeursUtilisees(input, {
          user,
          tx,
        });
      if (!valeursResult.success) {
        return failure(valeursResult.error, valeursResult.cause);
      }

      // recalcule le score dans la transaction, donc à partir de la sélection
      // de l'action entière (tous indicateurs confondus) après la valeur qui
      // vient d'être écrite
      return this.refreshAvancementForAction(collectiviteId, actionId, {
        user,
        tx,
      });
    });

    if (!writeResult.success) {
      return failure(writeResult.error, writeResult.cause);
    }

    // Après le commit : le calcul du score lit la base hors transaction et ne
    // verrait pas les statuts non encore committés.
    const snapshotResult = await this.snapshotsService.computeAndUpsert(
      { collectiviteId, referentielId },
      { user }
    );
    if (!snapshotResult.success) {
      return mapSnapshotsError(snapshotResult, {
        snapshotConflict: UpdateActionStatutErrorEnum.SNAPSHOT_UPDATE_FAILED,
        snapshotSaveFailed: UpdateActionStatutErrorEnum.SNAPSHOT_UPDATE_FAILED,
        defaultError: 'DATABASE_ERROR',
      });
    }

    return success(snapshotResult.data);
  }
}
