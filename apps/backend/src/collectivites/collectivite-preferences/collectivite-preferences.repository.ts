import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import {
  CollectivitePreferences,
  collectivitePreferencesSchema,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import { toMerged } from 'es-toolkit';
import { z } from 'zod';
import {
  CollectivitePreferencesErrorEnum,
  type CollectivitePreferencesError,
} from './collectivite-preferences.errors';

export const updateCollectivitePreferencesInputSchema = z
  .object(collectivitePreferencesSchema.shape)
  .partial();
export type UpdateCollectivitePreferencesInput = z.infer<
  typeof updateCollectivitePreferencesInputSchema
>;

@Injectable()
export class CollectivitePreferencesRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(CollectivitePreferencesRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async getPreferencesByCollectiviteId(
    collectiviteId: number,
    options: { withLock?: boolean; tx?: Transaction } = {}
  ): Promise<
    Result<CollectivitePreferences | null, CollectivitePreferencesError>
  > {
    const db = options.tx ?? this.db;
    const query = db
      .select({ preferences: collectiviteTable.preferences })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId))
      .limit(1);
    // verrouille la ligne (FOR UPDATE) pour sérialiser les écritures concurrentes
    // au sein d'une transaction
    const [row] = options.withLock ? await query.for('update') : await query;
    if (!row?.preferences) {
      return success(null);
    }
    const parsed = collectivitePreferencesSchema.safeParse(row.preferences);
    if (!parsed.success) {
      return failure(
        CollectivitePreferencesErrorEnum.PREFERENCES_PARSE_ERROR,
        parsed.error
      );
    }
    return success(parsed.data);
  }

  async updatePreferences(
    collectiviteId: number,
    preferences: UpdateCollectivitePreferencesInput,
    tx?: Transaction
  ): Promise<Result<CollectivitePreferences, CollectivitePreferencesError>> {
    const db = tx ?? this.db;
    const currentResult = await this.getPreferencesByCollectiviteId(
      collectiviteId,
      { tx }
    );
    if (!currentResult.success) {
      return currentResult;
    }
    const base = currentResult.data ?? defaultCollectivitePreferences;
    const parsed = collectivitePreferencesSchema.safeParse(
      toMerged(base, preferences)
    );
    if (!parsed.success) {
      return failure(
        CollectivitePreferencesErrorEnum.PREFERENCES_PARSE_ERROR,
        parsed.error
      );
    }
    const updated = parsed.data;
    const result = await db
      .update(collectiviteTable)
      .set({ preferences: updated })
      .where(eq(collectiviteTable.id, collectiviteId));
    if (result.rowCount === 0) {
      return failure(
        CollectivitePreferencesErrorEnum.COLLECTIVITE_NOT_FOUND,
        new Error(`Collectivité ${collectiviteId} non trouvée`)
      );
    }

    return success(updated);
  }
}
