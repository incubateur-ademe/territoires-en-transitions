import { Injectable, Logger } from '@nestjs/common';
import { ScoreIndicatifService } from '@tet/backend/referentiels/score-indicatif/score-indicatif.service';
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
    private readonly snapshotsService: SnapshotsService
  ) {}

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

      // relit le score dans la transaction, donc sur la valeur qui vient
      // d'être écrite
      const scoreResult = await this.scoreIndicatifService.getScoreIndicatif(
        { collectiviteId, actionIds: [actionId] },
        { tx }
      );
      if (!scoreResult.success) {
        return failure(scoreResult.error, scoreResult.cause);
      }

      const avancement = calculateAvancementFromScore(
        scoreResult.data[actionId]?.fait?.score
      );
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
