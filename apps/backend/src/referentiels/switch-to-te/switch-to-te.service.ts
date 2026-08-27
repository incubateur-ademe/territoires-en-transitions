import { Injectable, Logger } from '@nestjs/common';
import { CollectiviteReferentielModeService } from '@tet/backend/collectivites/collectivite-referentiel-mode/collectivite-referentiel-mode.service';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  CollectiviteSousTypeEnum,
  type CollectiviteReferentielPreferences,
} from '@tet/domain/collectivites';
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
import type { SwitchToTeStatus } from './get-switch-to-te-status.output';
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
    private readonly collectivitesService: CollectivitesService,
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
    COLLECTIVITE_IS_SYNDICAT: SwitchToTeErrorEnum.COLLECTIVITE_IS_SYNDICAT,
    AUDIT_REQUEST_IN_PROGRESS: SwitchToTeErrorEnum.AUDIT_REQUEST_IN_PROGRESS,
    AUDIT_IN_PROGRESS: SwitchToTeErrorEnum.AUDIT_IN_PROGRESS,
  };

  /**
   * Calcule les blocages syndicat / COT / demande / audit à partir de lectures
   * read-only. N'itère que sur les référentiels sources (cae/eci) encore en
   * `mode: write`.
   */
  async getSwitchToTeBlockers(
    collectiviteId: number,
    prefs: CollectiviteReferentielPreferences
  ): Promise<SwitchToTeBlocker[]> {
    const referentielsToCheck = SwitchToTeService.SOURCE_REFERENTIELS.filter(
      (referentiel) => prefs[referentiel].mode === 'write'
    );

    const [cotActif, isSyndicat, referentielsEnWrite] = await Promise.all([
      this.getLabellisationService.isCotActif(collectiviteId),
      this.isSyndicat(collectiviteId),
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

    return getSwitchToTeBlockers({ cotActif, isSyndicat, referentielsEnWrite });
  }

  /**
   * Les collectivités de type syndicat (SMF, SMO, SIVU, SIVOM) ne sont pas
   * éligibles au référentiel TE.
   */
  private async isSyndicat(collectiviteId: number): Promise<boolean> {
    const { soustype } =
      await this.collectivitesService.getCollectiviteAvecType(collectiviteId);
    return soustype === CollectiviteSousTypeEnum.SYNDICAT;
  }

  /**
   * Vérifie le droit de mutation sur chaque référentiel source encore en
   * `write` (même filtre que les blocages). Si aucun n'est en write,
   * autorise au niveau collectivité (rôle, sans filtre de mode) pour que les
   * checks d'éligibilité / déjà-basculé puissent quand même s'exécuter.
   */
  private async hasSwitchToTePermission(
    user: ServiceSecondArg['user'],
    collectiviteId: number,
    writeModeSources: readonly (typeof SwitchToTeService.SOURCE_REFERENTIELS)[number][]
  ): Promise<boolean> {
    if (writeModeSources.length > 0) {
      for (const referentielId of writeModeSources) {
        const permissionResult = await this.permissionService.isAllowed(
          user,
          PermissionOperationEnum['REFERENTIELS.MUTATE'],
          ResourceType.REFERENTIEL,
          { collectiviteId, referentielId }
        );
        if (!permissionResult.success) {
          return false;
        }
      }
      return true;
    }

    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    return permissionResult.success;
  }

  /**
   * Statut de la bascule vers TE : détermine si elle est possible et, sinon,
   * pourquoi (droits, déjà basculé, éligibilité, blocages COT/audit).
   */
  async getSwitchToTeStatus(
    collectiviteId: number,
    { user }: ServiceSecondArg
  ): Promise<Result<SwitchToTeStatus, SwitchToTeError>> {
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

    const writeModeSources = SwitchToTeService.SOURCE_REFERENTIELS.filter(
      (referentiel) => prefs[referentiel].mode === 'write'
    );
    const isAuthorized = await this.hasSwitchToTePermission(
      user,
      collectiviteId,
      writeModeSources
    );
    if (!isAuthorized) {
      return success({ value: 'UNAUTHORIZED' });
    }

    if (prefs.te.populatedFromCaeEci) {
      return success({
        value: 'ALREADY_SWITCHED',
        populatedAt: prefs.te.populatedFromCaeEci.populatedAt,
      });
    }

    if (!canSwitchToTe(prefs)) {
      return success({ value: 'NOT_ELIGIBLE' });
    }

    const blockers = await this.getSwitchToTeBlockers(collectiviteId, prefs);
    if (blockers.length > 0) {
      return success({ value: 'BLOCKED', blockers });
    }

    return success({ value: 'CAN_SWITCH' });
  }

  async switchToTe(
    collectiviteId: number,
    { user }: ServiceSecondArg
  ): Promise<Result<SwitchToTeOutput, SwitchToTeError>> {
    const statusResult = await this.getSwitchToTeStatus(collectiviteId, {
      user,
    });
    if (!statusResult.success) {
      return statusResult;
    }

    const status = statusResult.data;
    if (status.value !== 'CAN_SWITCH') {
      switch (status.value) {
        case 'UNAUTHORIZED':
          return failure('UNAUTHORIZED');
        case 'NOT_ELIGIBLE':
          return failure(SwitchToTeErrorEnum.NOT_ELIGIBLE);
        case 'BLOCKED':
          return failure(
            SwitchToTeService.BLOCKER_ERROR[status.blockers[0].type]
          );
        case 'ALREADY_SWITCHED': {
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

          const repairResult = await this.recomputeSnapshotsAfterSwitchTe(
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
            populatedAt: status.populatedAt,
          });
        }
        default:
          // filet de sécurité si un nouveau statut apparaît sans être géré ici.
          return failure(SwitchToTeErrorEnum.NOT_ELIGIBLE);
      }
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

    // ── Après COMMIT : snapshots post-switch-te + score-courant (hors tx, best-effort) ──
    // Historique figé au moment de la bascule (jalon POST_SWITCH_TE) + score-courant
    // TE remis à jour : pas de self-healing suffisant pour ni l'un ni l'autre ici
    // (cf. commentaire dans recomputeSnapshotsAfterSwitchTe), donc ce calcul doit
    // rester explicite.
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
    const recomputeResult = await this.recomputeSnapshotsAfterSwitchTe(
      collectiviteId,
      user
    );
    if (!recomputeResult.success) {
      // la bascule EST réussie (flag committé) ; snapshots régénérables — un
      // nouvel appel à switchToTe retentera ce calcul (voir plus haut).
      this.logger.error(
        `Bascule TE collectivite=${collectiviteId} : recompute des snapshots post-switch-te échoué (réparable)`,
        recomputeResult.cause?.stack
      );
    }

    return success({ status: 'switched', populatedAt });
  }

  private async recomputeSnapshotsAfterSwitchTe(
    collectiviteId: number,
    user: ServiceSecondArg['user']
  ): Promise<Result<void, SwitchToTeError>> {
    // Snapshot post-switch-te : ref et nom déduits du jalon via
    // getDefaultSnapshotMetadata (POST_SWITCH_TE). On ne passe pas `nom` pour
    // éviter la restriction du scores service.
    const post = await this.snapshotsService.computeAndUpsert(
      {
        collectiviteId,
        referentielId: ReferentielIdEnum.TE,
        jalon: SnapshotJalonEnum.POST_SWITCH_TE,
      },
      { user }
    );
    if (!post.success) {
      return failure(
        SwitchToTeErrorEnum.POST_SWITCH_RECOMPUTE_FAILED,
        post.cause
      );
    }

    // Score-courant TE : recalculé explicitement ici, on ne peut PAS compter
    // sur le self-healing de SnapshotsService.get() — celui-ci ne recalcule
    // que si le snapshot est absent, si la version du référentiel ou le
    // format du payload a changé, jamais parce que les données métier
    // sous-jacentes (te_*) ont changé. Une collectivité peut déjà avoir un
    // score-courant TE en base avant la bascule (référentiel visible avant
    // switch, calculé sur des données te_* vides) : sans ce recalcul explicite,
    // il resterait figé sur cet état obsolète après la migration des données.
    // computeScoreForCollectivite ne dérive le calcul du `jalon` que pour
    // PRE_AUDIT/POST_AUDIT ; pour COURANT comme pour POST_SWITCH_TE (sans
    // `date`), le calcul lit les mêmes données courantes et produit donc un
    // score identique — le doublon de calcul ici est volontaire, au profit de
    // la simplicité (pas de modification de SnapshotsService, code partagé).
    const courant = await this.snapshotsService.computeAndUpsert(
      {
        collectiviteId,
        referentielId: ReferentielIdEnum.TE,
        jalon: SnapshotJalonEnum.COURANT,
      },
      { user }
    );
    if (!courant.success) {
      return failure(
        SwitchToTeErrorEnum.POST_SWITCH_RECOMPUTE_FAILED,
        courant.cause
      );
    }

    return success(undefined);
  }
}
