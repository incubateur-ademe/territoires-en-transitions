import { Injectable, Logger } from '@nestjs/common';
import { CollectivitePreferencesRepository } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.repository';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import {
  canMutateReferentielData,
  defaultCollectivitePreferences,
  isCollectiviteReferentielPreferenceId,
  type CollectiviteReferentielPreferenceId,
  type CollectiviteReferentielPreferences,
  type ReferentielMode,
} from '@tet/domain/collectivites';
import type { ReferentielId } from '@tet/domain/referentiels';
import {
  ReferentielModeGuardErrorEnum,
  type CollectiviteReferentielModeError,
  type ReferentielNotWritableError,
} from './referentiel-mode-guard.errors';

@Injectable()
export class CollectiviteReferentielModeService {
  private readonly logger = new Logger(CollectiviteReferentielModeService.name);

  constructor(
    private readonly collectivitePreferencesRepository: CollectivitePreferencesRepository
  ) {}

  async getReferentielPreferences(
    collectiviteId: number,
    options: { withLock?: boolean; tx?: Transaction } = {}
  ): Promise<
    Result<CollectiviteReferentielPreferences, CollectiviteReferentielModeError>
  > {
    const result =
      await this.collectivitePreferencesRepository.getPreferencesByCollectiviteId(
        collectiviteId,
        options
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
    referentielId: CollectiviteReferentielPreferenceId
  ): Promise<Result<ReferentielMode, CollectiviteReferentielModeError>> {
    const preferencesResult = await this.getReferentielPreferences(
      collectiviteId
    );
    if (!preferencesResult.success) {
      return preferencesResult;
    }
    return success(preferencesResult.data[referentielId].mode);
  }

  /**
   * Vérifie que chaque référentiel donné accepte les écritures (mode `write`)
   * pour la collectivité. Ne contrôle que le mode, pas les droits de
   * l'utilisateur.
   */
  async assertReferentielsWritable(
    collectiviteId: number,
    referentielIds: ReferentielId[],
    tx?: Transaction
  ): Promise<
    Result<
      void,
      ReferentielNotWritableError | CollectiviteReferentielModeError
    >
  > {
    const preferenceIds = referentielIds.filter(
      isCollectiviteReferentielPreferenceId
    );
    if (preferenceIds.length === 0) {
      return success(undefined);
    }

    const preferencesResult = await this.getReferentielPreferences(
      collectiviteId,
      { tx }
    );
    if (!preferencesResult.success) {
      this.logger.error(
        `Impossible de charger les préférences de la collectivité ${collectiviteId} : ${preferencesResult.error}`
      );
      return preferencesResult;
    }

    const notWritable = preferenceIds.find(
      (referentielId) =>
        !canMutateReferentielData(preferencesResult.data[referentielId].mode)
    );
    if (notWritable) {
      this.logger.warn(
        `Référentiel ${notWritable} non modifiable pour la collectivité ${collectiviteId}`
      );
      return failure(ReferentielModeGuardErrorEnum.REFERENTIEL_NOT_WRITABLE);
    }

    return success(undefined);
  }

  async updateReferentielPreferences(
    collectiviteId: number,
    referentiels: CollectiviteReferentielPreferences,
    tx?: Transaction
  ) {
    return this.collectivitePreferencesRepository.updatePreferences(
      collectiviteId,
      { referentiels },
      tx
    );
  }
}
