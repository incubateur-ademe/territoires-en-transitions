import { Injectable } from '@nestjs/common';
import type { CollectivitePreferencesError } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.errors';
import { CollectivitePreferencesRepository } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.repository';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { actionCommentaireTable } from '@tet/backend/referentiels/models/action-commentaire.table';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { actionStatutTable } from '@tet/backend/referentiels/models/action-statut.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Result } from '@tet/backend/utils/result.type';
import {
  collectiviteReferentielDisplayIds,
  type CollectivitePreferences,
  type CollectiviteReferentielDisplayId,
} from '@tet/domain/collectivites';
import { and, count, eq, inArray, max } from 'drizzle-orm';
import { chunk } from 'es-toolkit';
import { shouldDisplayReferentielByCriteria } from './compute-referentiel-display.rules';

const CAE_ECI_REFERENTIELS = [
  'cae',
  'eci',
] as const satisfies readonly CollectiviteReferentielDisplayId[];

export type ResetAllCollectivitesDisplayPreferencesResult = Record<
  CollectiviteReferentielDisplayId,
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
    private readonly repository: CollectivitePreferencesRepository
  ) {}

  async resetCollectiviteDisplayPreferences(
    collectiviteId: number
  ): Promise<Result<CollectivitePreferences, CollectivitePreferencesError>> {
    const statutRows = await this.databaseService.db
      .select({
        referentiel: actionRelationTable.referentiel,
        actionStatutCount: count(),
        maxModifiedAt: max(actionStatutTable.modifiedAt),
      })
      .from(actionStatutTable)
      .innerJoin(
        actionRelationTable,
        eq(actionStatutTable.actionId, actionRelationTable.id)
      )
      .where(
        and(
          eq(actionStatutTable.collectiviteId, collectiviteId),
          inArray(actionRelationTable.referentiel, CAE_ECI_REFERENTIELS)
        )
      )
      .groupBy(actionRelationTable.referentiel);

    const commentaireRows = await this.databaseService.db
      .select({
        referentiel: actionRelationTable.referentiel,
        actionCommentaireCount: count(),
        maxModifiedAt: max(actionCommentaireTable.modifiedAt),
      })
      .from(actionCommentaireTable)
      .innerJoin(
        actionRelationTable,
        eq(actionCommentaireTable.actionId, actionRelationTable.id)
      )
      .where(
        and(
          eq(actionCommentaireTable.collectiviteId, collectiviteId),
          inArray(actionRelationTable.referentiel, CAE_ECI_REFERENTIELS)
        )
      )
      .groupBy(actionRelationTable.referentiel);

    const statutByReferentiel = Object.fromEntries(
      statutRows.map((r) => [
        r.referentiel,
        {
          actionStatutCount: Number(r.actionStatutCount ?? 0),
          maxModifiedAt: r.maxModifiedAt,
        },
      ])
    );
    const commentaireByReferentiel = Object.fromEntries(
      commentaireRows.map((r) => [
        r.referentiel,
        {
          actionCommentaireCount: Number(r.actionCommentaireCount ?? 0),
          maxModifiedAt: r.maxModifiedAt,
        },
      ])
    );

    const display: Record<CollectiviteReferentielDisplayId, boolean> = {
      cae: false,
      eci: false,
      te: true,
    };

    for (const ref of CAE_ECI_REFERENTIELS) {
      const statut = statutByReferentiel[ref];
      const commentaire = commentaireByReferentiel[ref];
      const actionStatutCount = statut?.actionStatutCount ?? 0;
      const actionCommentaireCount = commentaire?.actionCommentaireCount ?? 0;
      const lastActivityAt = this.mostRecentDate(
        statut?.maxModifiedAt,
        commentaire?.maxModifiedAt
      );
      display[ref] = shouldDisplayReferentielByCriteria({
        actionStatutCount,
        actionCommentaireCount,
        lastActivityAt,
      });
    }

    return this.repository.updatePreferences(collectiviteId, {
      referentiels: { display },
    });
  }

  async resetAllCollectivitesDisplayPreferences(): Promise<ResetAllCollectivitesDisplayPreferencesOutput> {
    const rows = await this.databaseService.db
      .select({ id: collectiviteTable.id })
      .from(collectiviteTable);

    const counts: ResetAllCollectivitesDisplayPreferencesResult =
      Object.fromEntries(
        collectiviteReferentielDisplayIds.map((id) => [id, 0])
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
          for (const ref of collectiviteReferentielDisplayIds) {
            if (result.data.referentiels.display[ref]) {
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

  private mostRecentDate(
    ...values: (string | null | undefined)[]
  ): Date | null {
    const dates = values
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .map((v) => new Date(v));
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }
}
