import { Injectable, Logger } from '@nestjs/common';
import { SnapshotsService } from '@tet/backend/referentiels/snapshots/snapshots.service';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { type CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import {
  ReferentielIdEnum,
  ScoreSnapshot,
  SnapshotJalonEnum,
} from '@tet/domain/referentiels';
import {
  SwitchToTeErrorEnum,
  type SwitchToTeError,
} from './switch-to-te.errors';

/**
 * Étape 1 du flux de bascule (cf. PRD) : fige l'état pré-bascule des
 * référentiels sources CAE/ECI encore en `mode: write` via un snapshot
 * `pre-switch-te`.
 */
@Injectable()
export class CreatePreSwitchSnapshotsService {
  private readonly logger = new Logger(CreatePreSwitchSnapshotsService.name);

  // ordre déterministe : cae puis eci
  private static readonly SOURCE_REFERENTIELS = [
    ReferentielIdEnum.CAE,
    ReferentielIdEnum.ECI,
  ] as const;

  constructor(private readonly snapshotsService: SnapshotsService) {}

  /**
   * Fige un snapshot `pre-switch-te` par référentiel source en `mode: write`.
   * Les permissions ne sont pas re-vérifiées : `switchToTe` a déjà validé
   * `REFERENTIELS.MUTATE`. `prefs` est fourni par l'appelant (évite un re-fetch).
   */
  async createPreSwitchSnapshots(
    collectiviteId: number,
    prefs: CollectiviteReferentielPreferences,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ScoreSnapshot[], SwitchToTeError>> {
    const referentielsToSnapshot =
      CreatePreSwitchSnapshotsService.SOURCE_REFERENTIELS.filter(
        (referentielId) => prefs[referentielId].mode === 'write'
      );

    const snapshots: ScoreSnapshot[] = [];

    try {
      for (const referentielId of referentielsToSnapshot) {
        const snapshot = await this.snapshotsService.computeAndUpsert({
          collectiviteId,
          referentielId,
          jalon: SnapshotJalonEnum.PRE_SWITCH_TE,
          user,
          tx,
        });
        snapshots.push(snapshot);
      }
    } catch (error) {
      this.logger.error(
        `Échec de la création des snapshots pré-bascule pour la collectivité ${collectiviteId}`,
        error instanceof Error ? error.stack : undefined
      );
      return failure(
        SwitchToTeErrorEnum.PRE_SWITCH_SNAPSHOT_FAILED,
        error instanceof Error ? error : undefined
      );
    }

    return success(snapshots);
  }
}
