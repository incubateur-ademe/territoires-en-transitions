import { Injectable } from '@nestjs/common';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import {
  canMutateReferentielData,
  type CollectiviteReferentielPreferences,
} from '@tet/domain/collectivites';
import type { ReferentielId } from '@tet/domain/referentiels';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import {
  CollectiviteReferentielModeService,
  isCollectiviteReferentielDisplayId,
} from './collectivite-referentiel-mode.service';
import {
  ReferentielModeGuardErrorEnum,
  type ReferentielModeGuardError,
} from './referentiel-mode-guard.errors';

@Injectable()
export class ReferentielModeGuard {
  constructor(
    private readonly collectiviteReferentielModeService: CollectiviteReferentielModeService
  ) {}

  async assertCanMutate(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<Result<void, ReferentielModeGuardError>> {
    if (
      referentielId === 'te-test' ||
      !isCollectiviteReferentielDisplayId(referentielId)
    ) {
      return success(undefined);
    }

    const preferencesResult =
      await this.collectiviteReferentielModeService.getReferentielPreferences(
        collectiviteId
      );
    if (!preferencesResult.success) {
      return failure(ReferentielModeGuardErrorEnum.DATABASE_ERROR);
    }

    return this.checkReferentielWritableFromPreferences(
      preferencesResult.data,
      referentielId
    );
  }

  async assertCanMutateAction(
    collectiviteId: number,
    actionId: string
  ): Promise<Result<void, ReferentielModeGuardError>> {
    return this.assertCanMutate(
      collectiviteId,
      getReferentielIdFromActionId(actionId)
    );
  }

  async assertCanMutateActions(
    collectiviteId: number,
    actionIds: Iterable<string>
  ): Promise<Result<void, ReferentielModeGuardError>> {
    const referentielIds = new Set<ReferentielId>();
    for (const actionId of actionIds) {
      referentielIds.add(getReferentielIdFromActionId(actionId));
    }

    const preferencesResult =
      await this.collectiviteReferentielModeService.getReferentielPreferences(
        collectiviteId
      );
    if (!preferencesResult.success) {
      return failure(ReferentielModeGuardErrorEnum.DATABASE_ERROR);
    }

    for (const referentielId of referentielIds) {
      const modeResult = this.checkReferentielWritableFromPreferences(
        preferencesResult.data,
        referentielId
      );
      if (!modeResult.success) {
        return modeResult;
      }
    }

    return success(undefined);
  }

  private checkReferentielWritableFromPreferences(
    preferences: CollectiviteReferentielPreferences,
    referentielId: ReferentielId
  ): Result<void, ReferentielModeGuardError> {
    if (
      referentielId === 'te-test' ||
      !isCollectiviteReferentielDisplayId(referentielId)
    ) {
      return success(undefined);
    }

    if (!canMutateReferentielData(preferences[referentielId].mode)) {
      return failure(ReferentielModeGuardErrorEnum.REFERENTIEL_NOT_WRITABLE);
    }

    return success(undefined);
  }
}
