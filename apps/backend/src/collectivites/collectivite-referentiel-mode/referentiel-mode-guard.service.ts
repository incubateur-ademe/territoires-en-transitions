import { ForbiddenException, Injectable } from '@nestjs/common';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { canMutateReferentielData } from '@tet/domain/collectivites';
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
  type ReferentielNotWritableError,
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

    const modeResult =
      await this.collectiviteReferentielModeService.getReferentielMode(
        collectiviteId,
        referentielId
      );
    if (!modeResult.success) {
      return failure(ReferentielModeGuardErrorEnum.DATABASE_ERROR);
    }

    if (!canMutateReferentielData(modeResult.data)) {
      return failure(ReferentielModeGuardErrorEnum.REFERENTIEL_NOT_WRITABLE);
    }

    return success(undefined);
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

  async assertCanMutateOrFailure(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<Result<void, ReferentielNotWritableError>> {
    const modeResult = await this.assertCanMutate(collectiviteId, referentielId);
    if (!modeResult.success) {
      return failure(ReferentielModeGuardErrorEnum.REFERENTIEL_NOT_WRITABLE);
    }
    return success(undefined);
  }

  async assertCanMutateActionOrFailure(
    collectiviteId: number,
    actionId: string
  ): Promise<Result<void, ReferentielNotWritableError>> {
    return this.assertCanMutateOrFailure(
      collectiviteId,
      getReferentielIdFromActionId(actionId)
    );
  }

  async assertCanMutateOrThrow(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<void> {
    const modeResult = await this.assertCanMutate(collectiviteId, referentielId);
    if (!modeResult.success) {
      throw new ForbiddenException(REFERENTIEL_NOT_WRITABLE_MESSAGE);
    }
  }

  async assertCanMutateActionOrThrow(
    collectiviteId: number,
    actionId: string
  ): Promise<void> {
    const modeResult = await this.assertCanMutateAction(collectiviteId, actionId);
    if (!modeResult.success) {
      throw new ForbiddenException(REFERENTIEL_NOT_WRITABLE_MESSAGE);
    }
  }
}
