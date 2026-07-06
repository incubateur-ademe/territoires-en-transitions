import { Injectable } from '@nestjs/common';
import { CollectiviteReferentielModeService } from '@tet/backend/collectivites/collectivite-referentiel-mode/collectivite-referentiel-mode.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, type Result } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import {
  SwitchToTeErrorEnum,
  type SwitchToTeError,
} from './switch-to-te.errors';
import { canSwitchToTe } from './switch-to-te.rules';
import type { SwitchToTeNotImplementedOutput } from './switch-to-te.output';

@Injectable()
export class SwitchToTeService {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly permissionService: PermissionService,
    private readonly collectiviteReferentielModeService: CollectiviteReferentielModeService
  ) {}

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

    return failure(SwitchToTeErrorEnum.SWITCH_NOT_IMPLEMENTED);
  }
}
