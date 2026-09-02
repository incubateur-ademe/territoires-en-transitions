import { Injectable } from '@nestjs/common';
import {
  CollectivitePreferencesErrorEnum,
  type CollectivitePreferencesError,
} from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.errors';
import { CollectivitePreferencesRepository } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.repository';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Result } from '@tet/backend/utils/result.type';
import { failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  collectiviteReferentielPreferenceIds,
  defaultCollectivitePreferences,
  deriveReferentielPreferences,
  getReferentielDisplayMap,
  type CollectivitePreferences,
  type CollectiviteReferentielPreferenceId,
} from '@tet/domain/collectivites';
import { chunk } from 'es-toolkit';
import { ComputeReferentielEngagementService } from './compute-referentiel-engagement.service';

export type ResetAllCollectivitesDisplayPreferencesResult = Record<
  CollectiviteReferentielPreferenceId,
  number
>;

export type ResetAllCollectivitesDisplayPreferencesOutput = {
  counts: ResetAllCollectivitesDisplayPreferencesResult;
  errorCount: number;
};

/**
 * This service is used to reset the display preferences for a collectivité based on its activities
 * If nothing has been done on ECI, no need to display it but only the new referentiel
 * Temporary need, must be removed once the new referentiel is released
 */
@Injectable()
export class ResetDisplayPreferencesService {
  private readonly PARALLEL_COLLECTIVITE_RESET_DISPLAY_PREFERENCES = 10;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly repository: CollectivitePreferencesRepository,
    private readonly transactionManager: TransactionManager,
    private readonly computeReferentielEngagementService: ComputeReferentielEngagementService
  ) {}

  async resetCollectiviteDisplayPreferences(
    collectiviteId: number
  ): Promise<Result<CollectivitePreferences, CollectivitePreferencesError>> {
    // le calcul de l'affichage ne dépend que de l'activité (statuts/commentaires),
    // pas des préférences : on peut le faire hors transaction pour réduire la durée du verrou
    const displayResult =
      await this.computeReferentielEngagementService.computeEngagement(
        collectiviteId
      );
    if (!displayResult.success) {
      return failure(
        CollectivitePreferencesErrorEnum.DATABASE_ERROR,
        displayResult.cause
      );
    }
    const display = displayResult.data;

    // verrou + revalidation + écriture dans une transaction : la lecture verrouillée
    // (FOR UPDATE) sérialise les resets/bascules concurrents, et on revalide
    // `populatedFromCaeEci` juste avant de persister pour éviter d'écraser une bascule
    return this.transactionManager.executeSingle<
      CollectivitePreferences,
      CollectivitePreferencesError
    >(async (tx) => {
      const existingResult =
        await this.repository.getPreferencesByCollectiviteId(collectiviteId, {
          withLock: true,
          tx,
        });
      if (!existingResult.success) {
        return existingResult;
      }

      const existingPreferences =
        existingResult.data ?? defaultCollectivitePreferences;
      // revalide l'état courant immédiatement avant l'écriture : si la collectivité
      // a déjà basculé vers TE, le reset est un no-op
      if (existingPreferences.referentiels.te.populatedFromCaeEci) {
        return success(existingPreferences);
      }

      return this.repository.updatePreferences(
        collectiviteId,
        {
          referentiels: deriveReferentielPreferences(
            { caeEngaged: display.cae, eciEngaged: display.eci },
            existingPreferences.referentiels
          ),
        },
        tx
      );
    });
  }

  async resetAllCollectivitesDisplayPreferences(): Promise<ResetAllCollectivitesDisplayPreferencesOutput> {
    const rows = await this.databaseService.db
      .select({ id: collectiviteTable.id })
      .from(collectiviteTable);

    const counts: ResetAllCollectivitesDisplayPreferencesResult =
      Object.fromEntries(
        collectiviteReferentielPreferenceIds.map((id) => [id, 0])
      ) as ResetAllCollectivitesDisplayPreferencesResult;

    let errorCount = 0;

    const collectiviteChunks = chunk(
      rows,
      this.PARALLEL_COLLECTIVITE_RESET_DISPLAY_PREFERENCES
    );

    for (const collectiviteChunk of collectiviteChunks) {
      const results = await Promise.all(
        collectiviteChunk.map((row) =>
          this.resetCollectiviteDisplayPreferences(row.id)
        )
      );
      for (const result of results) {
        if (result.success) {
          for (const ref of collectiviteReferentielPreferenceIds) {
            if (getReferentielDisplayMap(result.data.referentiels)[ref]) {
              counts[ref]++;
            }
          }
        } else {
          errorCount++;
        }
      }
    }

    return { counts, errorCount };
  }
}
