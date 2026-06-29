import { Injectable } from '@nestjs/common';
import { CollectivitePreferencesRepository } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.repository';
import { success, type Result } from '@tet/backend/utils/result.type';
import {
  defaultCollectivitePreferences,
  type CollectiviteReferentielDisplayId,
  type CollectiviteReferentielPreferences,
  type ReferentielMode,
} from '@tet/domain/collectivites';
import type { ReferentielId } from '@tet/domain/referentiels';
import type { CollectiviteReferentielModeError } from './referentiel-mode-guard.errors';

@Injectable()
export class CollectiviteReferentielModeService {
  constructor(
    private readonly collectivitePreferencesRepository: CollectivitePreferencesRepository
  ) {}

  async getReferentielPreferences(
    collectiviteId: number
  ): Promise<
    Result<CollectiviteReferentielPreferences, CollectiviteReferentielModeError>
  > {
    const result =
      await this.collectivitePreferencesRepository.getPreferencesByCollectiviteId(
        collectiviteId
      );
    if (!result.success) {
      return result;
    }
    return success(
      (result.data ?? defaultCollectivitePreferences).referentiels
    );
  }

  async getReferentielMode(
    collectiviteId: number,
    referentielId: CollectiviteReferentielDisplayId
  ): Promise<Result<ReferentielMode, CollectiviteReferentielModeError>> {
    const preferencesResult = await this.getReferentielPreferences(
      collectiviteId
    );
    if (!preferencesResult.success) {
      return preferencesResult;
    }
    return success(preferencesResult.data[referentielId].mode);
  }

  async updateReferentielPreferences(
    collectiviteId: number,
    referentiels: CollectiviteReferentielPreferences
  ) {
    return this.collectivitePreferencesRepository.updatePreferences(
      collectiviteId,
      { referentiels }
    );
  }
}

function isCollectiviteReferentielDisplayId(
  referentielId: ReferentielId
): referentielId is CollectiviteReferentielDisplayId {
  return (
    referentielId === 'cae' || referentielId === 'eci' || referentielId === 'te'
  );
}

export { isCollectiviteReferentielDisplayId };
