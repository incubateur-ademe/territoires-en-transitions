import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  CollectivitePreferencesErrorEnum,
  type CollectivitePreferencesError,
} from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.errors';
import { CollectivitePreferencesRepository } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.repository';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Result } from '@tet/backend/utils/result.type';
import { failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  collectiviteReferentielPreferenceIds,
  collectiviteTypeEnum,
  defaultCollectivitePreferences,
  deriveReferentielPreferences,
  getReferentielDisplayMap,
  type CollectivitePreferences,
  type CollectiviteReferentielPreferenceId,
} from '@tet/domain/collectivites';
import {
  getParcoursLabellisationStatus,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import { ne } from 'drizzle-orm';
import { chunk } from 'es-toolkit';
import { GetLabellisationService } from '../labellisations/get-labellisation.service';
import {
  getEligibiliteType,
  getSwitchToTeBlockers,
  type EligibiliteType,
} from '../switch-to-te/switch-to-te.rules';
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
 * A legacy referentiel (CAE/ECI) stays writable only if the collectivité is engaged on it.
 * Otherwise it is archived, and stays displayed unless no statut nor text has been filled in
 * Syndicats and DROM are not eligible to the new referentiel, and a collectivité
 * with an active COT, an audit or an audit request cannot switch yet: they keep
 * working on their legacy referentiels (see `deriveReferentielPreferences`)
 * Temporary need, must be removed once the new referentiel is released
 */
@Injectable()
export class ResetDisplayPreferencesService {
  private readonly logger = new Logger(ResetDisplayPreferencesService.name);

  private readonly PARALLEL_COLLECTIVITE_RESET_DISPLAY_PREFERENCES = 10;

  // référentiels dont un audit ou une demande d'audit bloque la bascule
  private static readonly SOURCE_REFERENTIELS = [
    ReferentielIdEnum.CAE,
    ReferentielIdEnum.ECI,
  ] as const;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly repository: CollectivitePreferencesRepository,
    private readonly transactionManager: TransactionManager,
    private readonly computeReferentielEngagementService: ComputeReferentielEngagementService,
    private readonly collectivitesService: CollectivitesService,
    private readonly getLabellisationService: GetLabellisationService
  ) {}

  async resetCollectiviteDisplayPreferences(
    collectiviteId: number
  ): Promise<Result<CollectivitePreferences, CollectivitePreferencesError>> {
    // le niveau de remplissage ne dépend que de l'activité (statuts/commentaires),
    // pas des préférences : on peut le calculer hors transaction pour réduire la durée du verrou
    const niveauxRemplissageResult =
      await this.computeReferentielEngagementService.computeNiveauxRemplissage(
        collectiviteId
      );
    if (!niveauxRemplissageResult.success) {
      return failure(
        CollectivitePreferencesErrorEnum.DATABASE_ERROR,
        niveauxRemplissageResult.cause
      );
    }
    const niveauxRemplissage = niveauxRemplissageResult.data;

    // le type de collectivité (syndicat / DROM) ne dépend pas non plus des
    // préférences : lu hors transaction lui aussi
    const eligibiliteResult = await this.getEligibiliteType(collectiviteId);
    if (!eligibiliteResult.success) {
      return eligibiliteResult;
    }
    const { isSyndicat, isDrom } = eligibiliteResult.data;

    // COT, audit et demande d'audit ne dépendent pas non plus des préférences
    const hasSwitchToTeBlockerResult = await this.hasSwitchToTeBlocker(
      collectiviteId
    );
    if (!hasSwitchToTeBlockerResult.success) {
      return hasSwitchToTeBlockerResult;
    }
    const hasSwitchToTeBlocker = hasSwitchToTeBlockerResult.data;

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
            {
              cae: niveauxRemplissage.cae,
              eci: niveauxRemplissage.eci,
              hasSwitchToTeBlocker,
              isSyndicat,
              isDrom,
            },
            existingPreferences.referentiels
          ),
        },
        tx
      );
    });
  }

  private async getEligibiliteType(
    collectiviteId: number
  ): Promise<Result<EligibiliteType, CollectivitePreferencesError>> {
    try {
      const collectivite =
        await this.collectivitesService.getCollectiviteAvecType(collectiviteId);
      return success(getEligibiliteType(collectivite));
    } catch (error) {
      if (error instanceof NotFoundException) {
        return failure(
          CollectivitePreferencesErrorEnum.COLLECTIVITE_NOT_FOUND,
          error
        );
      }
      this.logger.error(
        `Erreur inattendue lors de la lecture du type de la collectivité ${collectiviteId} : ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined
      );
      return failure(
        CollectivitePreferencesErrorEnum.DATABASE_ERROR,
        error as Error
      );
    }
  }

  /**
   * Vrai si la collectivité a un COT actif, ou un audit en cours ou une demande
   * d'audit envoyée sur CAE ou ECI. Contrairement à la bascule, on regarde les
   * deux référentiels quel que soit leur mode : le reset décide justement s'ils
   * restent en écriture.
   */
  private async hasSwitchToTeBlocker(
    collectiviteId: number
  ): Promise<Result<boolean, CollectivitePreferencesError>> {
    try {
      const [cotActif, referentielsEnWrite] = await Promise.all([
        this.getLabellisationService.isCotActif(collectiviteId),
        Promise.all(
          ResetDisplayPreferencesService.SOURCE_REFERENTIELS.map(
            async (referentiel) => ({
              referentiel,
              status: getParcoursLabellisationStatus(
                await this.getLabellisationService.getCurrentDemandeAndAudit(
                  collectiviteId,
                  referentiel
                )
              ),
            })
          )
        ),
      ]);

      // syndicat et DROM ont leur propre règle dans `deriveReferentielPreferences`
      const blockers = getSwitchToTeBlockers({
        cotActif,
        isSyndicat: false,
        isDrom: false,
        referentielsEnWrite,
      });
      return success(blockers.length > 0);
    } catch (error) {
      this.logger.error(
        `Erreur inattendue lors de la lecture des blocages de bascule de la collectivité ${collectiviteId} : ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined
      );
      return failure(
        CollectivitePreferencesErrorEnum.DATABASE_ERROR,
        error as Error
      );
    }
  }

  /**
   * Collectivités traitées par le reset global : les collectivités de test en
   * sont exclues, leurs préférences sont réglées à la main pour les démos et la
   * recette (le reset d'une collectivité donnée reste possible).
   */
  async listCollectiviteIdsToReset(): Promise<number[]> {
    const rows = await this.databaseService.db
      .select({ id: collectiviteTable.id })
      .from(collectiviteTable)
      .where(ne(collectiviteTable.type, collectiviteTypeEnum.TEST));
    return rows.map((row) => row.id);
  }

  async resetAllCollectivitesDisplayPreferences(): Promise<ResetAllCollectivitesDisplayPreferencesOutput> {
    const collectiviteIds = await this.listCollectiviteIdsToReset();

    const counts: ResetAllCollectivitesDisplayPreferencesResult =
      Object.fromEntries(
        collectiviteReferentielPreferenceIds.map((id) => [id, 0])
      ) as ResetAllCollectivitesDisplayPreferencesResult;

    let errorCount = 0;

    const collectiviteChunks = chunk(
      collectiviteIds,
      this.PARALLEL_COLLECTIVITE_RESET_DISPLAY_PREFERENCES
    );

    for (const collectiviteChunk of collectiviteChunks) {
      const results = await Promise.all(
        collectiviteChunk.map((collectiviteId) =>
          this.resetCollectiviteDisplayPreferences(collectiviteId)
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
