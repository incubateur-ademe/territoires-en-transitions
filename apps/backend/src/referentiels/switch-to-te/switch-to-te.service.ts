import { Injectable } from '@nestjs/common';
import { CollectiviteReferentielModeService } from '@tet/backend/collectivites/collectivite-referentiel-mode/collectivite-referentiel-mode.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, type Result } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { type CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import {
  getParcoursLabellisationStatus,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { GetLabellisationService } from '../labellisations/get-labellisation.service';
import {
  SwitchToTeErrorEnum,
  type SwitchToTeError,
} from './switch-to-te.errors';
import type { SwitchToTeNotImplementedOutput } from './switch-to-te.output';
import {
  canSwitchToTe,
  getSwitchToTeBlockers,
  type SwitchToTeBlocker,
} from './switch-to-te.rules';

@Injectable()
export class SwitchToTeService {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly permissionService: PermissionService,
    private readonly collectiviteReferentielModeService: CollectiviteReferentielModeService,
    private readonly getLabellisationService: GetLabellisationService
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
  ): Promise<Result<SwitchToTeNotImplementedOutput, SwitchToTeError>> {
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

    return failure(SwitchToTeErrorEnum.SWITCH_NOT_IMPLEMENTED);
  }
}
