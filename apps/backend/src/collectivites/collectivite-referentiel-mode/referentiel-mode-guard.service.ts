import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { COMMON_ERROR_CONFIG } from '@tet/backend/utils/trpc/common-errors';
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
  REFERENTIEL_NOT_WRITABLE_MESSAGE,
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

  async assertCanMutateActionOrFailure(
    collectiviteId: number,
    actionId: string
  ): Promise<Result<void, ReferentielModeGuardError>> {
    return this.assertCanMutate(
      collectiviteId,
      getReferentielIdFromActionId(actionId)
    );
  }

  async assertCanMutateActionsOrFailure(
    collectiviteId: number,
    actionIds: Iterable<string>
  ): Promise<Result<void, ReferentielModeGuardError>> {
    return this.assertCanMutateActions(collectiviteId, actionIds);
  }

  // variantes avec throw de l'erreur amenées à disparaitre (hors scope bascule-PR4)
  async assertCanMutateOrThrow(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<void> {
    const modeResult = await this.assertCanMutate(
      collectiviteId,
      referentielId
    );
    if (!modeResult.success) {
      this.throwFromModeGuardFailure(modeResult.error);
    }
  }

  async assertCanMutateActionOrThrow(
    collectiviteId: number,
    actionId: string
  ): Promise<void> {
    const modeResult = await this.assertCanMutateAction(
      collectiviteId,
      actionId
    );
    if (!modeResult.success) {
      this.throwFromModeGuardFailure(modeResult.error);
    }
  }

  private throwFromModeGuardFailure(error: ReferentielModeGuardError): never {
    if (error === ReferentielModeGuardErrorEnum.DATABASE_ERROR) {
      throw new InternalServerErrorException(
        COMMON_ERROR_CONFIG.DATABASE_ERROR.message
      );
    }

    throw new ForbiddenException(REFERENTIEL_NOT_WRITABLE_MESSAGE);
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
