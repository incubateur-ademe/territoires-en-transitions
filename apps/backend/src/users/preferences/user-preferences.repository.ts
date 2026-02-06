import { Injectable, Logger } from '@nestjs/common';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
import {
  defaultUserPreferences,
  UserPreferences,
  userPreferencesSchema,
} from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { toMerged } from 'es-toolkit';
import z from 'zod';
import {
  unflattenPreferences,
  userPreferenceKeySchema,
} from './user-preference-key.schema';
import {
  UserPreferencesError,
  UserPreferencesErrorEnum,
} from './user-preferences.errors';

export const updateUserPreferencesInputSchema = z
  .object(userPreferencesSchema.shape)
  .partial();
export type UpdateUserPreferencesInput = z.infer<
  typeof updateUserPreferencesInputSchema
>;

export const updateUserPreferencesFlatInputSchema = z.partialRecord(
  userPreferenceKeySchema,
  z.unknown() // la validation se fait au moment de l'update seulement
);
export type UpdateUserPreferencesFlatInput = z.infer<
  typeof updateUserPreferencesFlatInputSchema
>;

@Injectable()
export class UserPreferencesRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(UserPreferencesRepository.name);

  constructor(private readonly database: DatabaseService) {}

  /**
   * Charge les préférences utilisateur (fusionne avec les préférences par défaut si nécessaire)
   */
  async getUserPreferencesByUserId(
    userId: string
  ): Promise<Result<UserPreferences, UserPreferencesError>> {
    const rows = await this.db
      .select({ preferences: dcpTable.preferences })
      .from(authUsersTable)
      .innerJoin(dcpTable, eq(dcpTable.id, authUsersTable.id))
      .where(eq(dcpTable.id, userId));
    const user = rows[0];
    return user
      ? { success: true, data: this.parsePreferences(user) }
      : { success: false, error: UserPreferencesErrorEnum.GET_PREFS_ERROR };
  }

  /**
   * Parse et fusionne les préférences utilisateur enregistrées et les préférences par défaut
   */
  private parsePreferences(user: { preferences: UserPreferences | null }) {
    if (!user.preferences) {
      return defaultUserPreferences;
    }
    const parsedPreferences = userPreferencesSchema.safeParse(
      toMerged(defaultUserPreferences, user.preferences)
    );
    return parsedPreferences.success
      ? parsedPreferences.data
      : defaultUserPreferences;
  }

  /** Met à jour les préférences utilisateur */
  async updateUserPreferences(
    userId: string,
    preferences: UpdateUserPreferencesInput
  ): Promise<Result<UserPreferences, UserPreferencesError>> {
    const currentPreferencesResult = await this.getUserPreferencesByUserId(
      userId
    );
    if (!currentPreferencesResult.success) {
      return currentPreferencesResult;
    }

    const currentPreferences = currentPreferencesResult.data;
    const parsedPreferences = userPreferencesSchema.safeParse(
      toMerged(currentPreferences, preferences)
    );

    if (parsedPreferences.error) {
      return {
        success: false,
        error: UserPreferencesErrorEnum.PARSE_PREFS_ERROR,
      };
    }
    const updatedPreferences = parsedPreferences.data;
    try {
      await this.db
        .update(dcpTable)
        .set({ preferences: updatedPreferences })
        .where(eq(dcpTable.id, userId));

      return { success: true, data: updatedPreferences };
    } catch (err) {
      this.logger.error(err);
      return {
        success: false,
        error: UserPreferencesErrorEnum.UPDATE_PREFS_ERROR,
      };
    }
  }

  async updateUserPreferencesFlat(
    userId: string,
    flatPreferences: UpdateUserPreferencesFlatInput
  ): Promise<Result<UserPreferences, UserPreferencesError>> {
    const unflattened = unflattenPreferences(flatPreferences);
    return this.updateUserPreferences(userId, unflattened);
  }
}
