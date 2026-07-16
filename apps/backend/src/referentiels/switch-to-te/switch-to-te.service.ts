import { Injectable, Logger } from '@nestjs/common';
import { CollectiviteReferentielModeService } from '@tet/backend/collectivites/collectivite-referentiel-mode/collectivite-referentiel-mode.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { type CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import {
  getParcoursLabellisationStatus,
  ReferentielIdEnum,
  SnapshotJalonEnum,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { GetLabellisationService } from '../labellisations/get-labellisation.service';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { CreatePreSwitchSnapshotsService } from './create-pre-switch-snapshots.service';
import { MigrateCollectiviteDataService } from './migrate-collectivite-data/migrate-collectivite-data.service';
import {
  SwitchToTeErrorEnum,
  type SwitchToTeError,
} from './switch-to-te.errors';
import type { SwitchToTeOutput } from './switch-to-te.output';
import {
  buildPostSwitchPreferences,
  canSwitchToTe,
  getSwitchToTeBlockers,
  type SwitchToTeBlocker,
} from './switch-to-te.rules';

@Injectable()
export class SwitchToTeService {
  private readonly logger = new Logger(SwitchToTeService.name);

  constructor(
    private readonly trackingService: TrackingService,
    private readonly permissionService: PermissionService,
    private readonly collectiviteReferentielModeService: CollectiviteReferentielModeService,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly transactionManager: TransactionManager,
    private readonly createPreSwitchSnapshotsService: CreatePreSwitchSnapshotsService,
    private readonly migrateCollectiviteDataService: MigrateCollectiviteDataService,
    private readonly snapshotsService: SnapshotsService
  ) {}

  // référentiels sources pouvant bloquer la bascule
  private static readonly SOURCE_REFERENTIELS = [
    ReferentielIdEnum.CAE,
    ReferentielIdEnum.ECI,
  ] as const;

  private static readonly BLOCKER_ERROR: Record<
    SwitchToTeBlocker['type'],
    SwitchToTeError
  > = {
    COT_ACTIVE: SwitchToTeErrorEnum.COT_ACTIVE,
    AUDIT_REQUEST_IN_PROGRESS: SwitchToTeErrorEnum.AUDIT_REQUEST_IN_PROGRESS,
    AUDIT_IN_PROGRESS: SwitchToTeErrorEnum.AUDIT_IN_PROGRESS,
  };

  /**
   * Calcule les blocages COT / demande / audit à partir de lectures read-only.
   * N'itère que sur les référentiels sources (cae/eci) encore en `mode: write`.
   */
  async getSwitchToTeBlockers(
    collectiviteId: number,
    prefs: CollectiviteReferentielPreferences
  ): Promise<SwitchToTeBlocker[]> {
    const referentielsToCheck = SwitchToTeService.SOURCE_REFERENTIELS.filter(
      (referentiel) => prefs[referentiel].mode === 'write'
    );

    const [cotActif, referentielsEnWrite] = await Promise.all([
      this.getLabellisationService.isCotActif(collectiviteId),
      Promise.all(
        referentielsToCheck.map(async (referentiel) => {
          const demandeEtAudit =
            await this.getLabellisationService.getCurrentDemandeAndAudit(
              collectiviteId,
              referentiel
            );
          return {
            referentiel,
            status: getParcoursLabellisationStatus(demandeEtAudit),
          };
        })
      ),
    ]);

    return getSwitchToTeBlockers({ cotActif, referentielsEnWrite });
  }

  async switchToTe(
    collectiviteId: number,
    { user }: ServiceSecondArg
  ): Promise<Result<SwitchToTeOutput, SwitchToTeError>> {
    // ── Guards hors transaction ──────────────────────────────────────────────
    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure('UNAUTHORIZED');
    }

    const isReferentielTeEnabled = await this.trackingService.isFeatureEnabled(
      'is-referentiel-te-enabled',
      user.id,
      collectiviteId
    );
    if (!isReferentielTeEnabled) {
      return failure(SwitchToTeErrorEnum.REFERENTIEL_TE_DISABLED);
    }

    const preferencesResult =
      await this.collectiviteReferentielModeService.getReferentielPreferences(
        collectiviteId
      );
    if (!preferencesResult.success) {
      return preferencesResult;
    }

    const prefs = preferencesResult.data;
    if (prefs.te.populatedFromCaeEci) {
      return failure(SwitchToTeErrorEnum.ALREADY_SWITCHED);
    }

    if (!canSwitchToTe(prefs)) {
      return failure(SwitchToTeErrorEnum.NOT_ELIGIBLE);
    }

    const blockers = await this.getSwitchToTeBlockers(collectiviteId, prefs);
    if (blockers.length > 0) {
      return failure(SwitchToTeService.BLOCKER_ERROR[blockers[0].type]);
    }

    // ── Transaction unique : données SOURCES (rollback total sur échec) ──────
    const populatedAt = new Date().toISOString();

    const txResult = await this.transactionManager.executeSingle<
      void,
      SwitchToTeError
    >(async (tx) => {
      // étape 1 : snapshots pre-switch-te (refs CAE/ECI en write)
      const snapshotsResult =
        await this.createPreSwitchSnapshotsService.createPreSwitchSnapshots(
          collectiviteId,
          prefs,
          { user, tx }
        );
      if (!snapshotsResult.success) return snapshotsResult;

      // étape 2 : migration données collectivité (te_*)
      const migrateResult = await this.migrateCollectiviteDataService.migrate(
        collectiviteId,
        prefs,
        snapshotsResult.data,
        { user, tx }
      );
      if (!migrateResult.success) return migrateResult;

      // étape 3 : prefs + populatedFromCaeEci (en dernier de la tx pour l'idempotence)
      const prefsResult =
        await this.collectiviteReferentielModeService.updateReferentielPreferences(
          collectiviteId,
          buildPostSwitchPreferences(prefs, {
            populatedAt,
            populatedBy: user.id,
          }),
          tx
        );
      if (!prefsResult.success) return prefsResult;

      return success(undefined);
    });

    if (!txResult.success) return txResult;

    // ── Après COMMIT : projections reconstructibles (hors tx, best-effort) ──
    // Lit les données te_* committées, comme UpdateActionStatutService.upsertActionStatuts.
    const recomputeResult = await this.recomputeTeProjections(
      collectiviteId,
      user
    );
    if (!recomputeResult.success) {
      // la bascule EST réussie (flag committé) ; projections régénérables
      this.logger.error(
        `Bascule TE collectivite=${collectiviteId} : recompute des projections échoué (réparable)`,
        recomputeResult.cause?.stack
      );
    }

    return success({ status: 'switched', populatedAt });
  }

  private async recomputeTeProjections(
    collectiviteId: number,
    user: ServiceSecondArg['user']
  ): Promise<Result<void, SwitchToTeError>> {
    // étape 4 : score-courant TE
    const courant = await this.snapshotsService.computeAndUpsert(
      { collectiviteId, referentielId: ReferentielIdEnum.TE },
      { user }
    );
    if (!courant.success) {
      return failure(SwitchToTeErrorEnum.POST_SWITCH_RECOMPUTE_FAILED, courant.cause);
    }

    // étape 5 : snapshot post-switch-te
    // ref et nom déduits du jalon via getDefaultSnapshotMetadata (POST_SWITCH_TE)
    // on ne passe pas nom pour éviter la restriction du scores service
    const post = await this.snapshotsService.computeAndUpsert(
      {
        collectiviteId,
        referentielId: ReferentielIdEnum.TE,
        jalon: SnapshotJalonEnum.POST_SWITCH_TE,
      },
      { user }
    );
    if (!post.success) {
      return failure(SwitchToTeErrorEnum.POST_SWITCH_RECOMPUTE_FAILED, post.cause);
    }

    return success(undefined);
  }
}
