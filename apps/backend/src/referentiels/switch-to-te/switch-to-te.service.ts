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
import { SNAPSHOTS } from '../snapshots/snapshots.constants';
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

    // Check mutate on each source référentiel still in write mode (same filter as blockers).
    // If none are in write mode, authorize on the collectivité only (role, no mode filter)
    // so eligibility / already-switched checks can still run.
    const writeModeSources = SwitchToTeService.SOURCE_REFERENTIELS.filter(
      (referentiel) => prefs[referentiel].mode === 'write'
    );
    if (writeModeSources.length > 0) {
      for (const referentielId of writeModeSources) {
        const permissionResult = await this.permissionService.isAllowed(
          user,
          PermissionOperationEnum['REFERENTIELS.MUTATE'],
          ResourceType.REFERENTIEL,
          { collectiviteId, referentielId }
        );
        if (!permissionResult.success) {
          return failure('UNAUTHORIZED');
        }
      }
    } else {
      const permissionResult = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['REFERENTIELS.MUTATE'],
        ResourceType.COLLECTIVITE,
        { collectiviteId }
      );
      if (!permissionResult.success) {
        return failure('UNAUTHORIZED');
      }
    }

    if (prefs.te.populatedFromCaeEci) {
      // déjà basculé : vérifie si le snapshot post-switch-te existe (get() sans
      // effet de bord pour ce ref — pas de self-healing hors jalon COURANT).
      // S'il manque (échec précédent du recompute best-effort), on répare au lieu
      // de bloquer indéfiniment sur ALREADY_SWITCHED — cf. commentaire "réparable"
      // plus bas : ceci le rend concrètement vrai.
      const existingPostSwitch = await this.snapshotsService.get(
        collectiviteId,
        ReferentielIdEnum.TE,
        SNAPSHOTS.POST_SWITCH_TE_REF,
        { user }
      );
      if (existingPostSwitch.success) {
        return failure(SwitchToTeErrorEnum.ALREADY_SWITCHED);
      }

      const repairResult = await this.recomputeSnapshotPostSwitchTe(
        collectiviteId,
        user
      );
      if (!repairResult.success) {
        // contrairement au best-effort du premier appel, on renvoie l'échec ici :
        // la bascule des données ne se reproduit pas, seul le recompute est
        // retenté, pas de raison de masquer un 2e échec à l'appelant.
        this.logger.error(
          `Bascule TE collectivite=${collectiviteId} : réparation du snapshot post-switch-te échouée`,
          repairResult.cause?.stack
        );
        return failure(
          SwitchToTeErrorEnum.POST_SWITCH_RECOMPUTE_FAILED,
          repairResult.cause
        );
      }

      return success({
        status: 'switched',
        populatedAt: prefs.te.populatedFromCaeEci.populatedAt,
      });
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
      // relit les préférences avec verrou (FOR UPDATE) pour sérialiser les bascules
      // concurrentes, puis revalide l'éligibilité juste avant d'écrire
      const lockedPrefsResult =
        await this.collectiviteReferentielModeService.getReferentielPreferences(
          collectiviteId,
          { withLock: true, tx }
        );
      if (!lockedPrefsResult.success) return lockedPrefsResult;

      const lockedPrefs = lockedPrefsResult.data;
      if (lockedPrefs.te.populatedFromCaeEci) {
        return failure(SwitchToTeErrorEnum.ALREADY_SWITCHED);
      }
      if (!canSwitchToTe(lockedPrefs)) {
        return failure(SwitchToTeErrorEnum.NOT_ELIGIBLE);
      }

      // étape 1 : snapshots pre-switch-te (refs CAE/ECI en write)
      const snapshotsResult =
        await this.createPreSwitchSnapshotsService.createPreSwitchSnapshots(
          collectiviteId,
          lockedPrefs,
          { user, tx }
        );
      if (!snapshotsResult.success) return snapshotsResult;

      // étape 2 : migration données collectivité (te_*)
      const migrateResult = await this.migrateCollectiviteDataService.migrate(
        collectiviteId,
        lockedPrefs,
        snapshotsResult.data,
        { user, tx }
      );
      if (!migrateResult.success) return migrateResult;

      // étape 3 : prefs + populatedFromCaeEci (en dernier de la tx pour l'idempotence)
      const prefsResult =
        await this.collectiviteReferentielModeService.updateReferentielPreferences(
          collectiviteId,
          buildPostSwitchPreferences(lockedPrefs, {
            populatedAt,
            populatedBy: user.id,
          }),
          tx
        );
      if (!prefsResult.success) return prefsResult;

      return success(undefined);
    });

    if (!txResult.success) return txResult;

    // ── Après COMMIT : snapshot post-switch-te (hors tx, best-effort) ───────
    // Historique figé au moment de la bascule (jalon POST_SWITCH_TE) : pas de
    // self-healing équivalent ailleurs, contrairement au score-courant (voir
    // SnapshotsService.get()) donc ce calcul doit rester explicite ici.
    //
    // Volontairement APRÈS le commit de la transaction principale et SANS lui
    // passer `tx` : le calcul du score (ScoresService.computeScoreForCollectivite
    // → ListActionStatutsRepository.listByActionIds) lit toujours via le pool
    // par défaut, jamais via un `tx` fourni par l'appelant. Threader `tx` ici ne
    // rendrait donc PAS ce calcul transaction-safe : il verrait les données te_*
    // via une connexion séparée qui ne voit pas les écritures non committées de
    // la transaction en cours (MVCC), et calculerait un score faux/vide. Même
    // pattern que UpdateActionStatutService.upsertActionStatuts (écrit dans une
    // tx interne, puis appelle computeAndUpsert SANS tx, après le commit).
    const recomputeResult = await this.recomputeSnapshotPostSwitchTe(
      collectiviteId,
      user
    );
    if (!recomputeResult.success) {
      // la bascule EST réussie (flag committé) ; snapshot régénérable — un
      // nouvel appel à switchToTe retentera ce calcul (voir plus haut).
      this.logger.error(
        `Bascule TE collectivite=${collectiviteId} : recompute du snapshot post-switch-te échoué (réparable)`,
        recomputeResult.cause?.stack
      );
    }

    return success({ status: 'switched', populatedAt });
  }

  private async recomputeSnapshotPostSwitchTe(
    collectiviteId: number,
    user: ServiceSecondArg['user']
  ): Promise<Result<void, SwitchToTeError>> {
    // Snapshot post-switch-te : ref et nom déduits du jalon via
    // getDefaultSnapshotMetadata (POST_SWITCH_TE). On ne passe pas `nom` pour
    // éviter la restriction du scores service.
    //
    // NB : le score-courant TE n'est PAS recalculé ici — il est régénéré
    // automatiquement au premier accès en lecture via le self-healing de
    // SnapshotsService.get() (déjà utilisé ailleurs, ex. UpdateActionStatutService),
    // ce qui rend un calcul explicite ici redondant.
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
