import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import {
  defaultUserPreferences,
  UserPreferences,
  userPreferencesSchema,
} from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { merge } from 'es-toolkit';
import z from 'zod';
import { AuthenticatedUser } from '../../models/auth.models';
import { dcpTable } from '../../models/dcp.table';
import { ListUsersService } from '../list-users/list-users.service';

export const updateUserInputSchema = z
  .object({
    telephone: z.string(),
    prenom: z.string(),
    nom: z.string(),
  })
  .partial();

export const updateUserPreferencesInputSchema = z
  .object(userPreferencesSchema.shape)
  .partial();

@Injectable()
export class UpdateUserService {
  private db = this.database.db;
  private readonly logger = new Logger(UpdateUserService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly listUsersService: ListUsersService
  ) {}

  async updateUser(
    { prenom, nom, telephone }: z.infer<typeof updateUserInputSchema>,
    user: AuthenticatedUser
  ) {
    if (prenom || nom || telephone) {
      const userAttributes = {
        ...(prenom && { prenom }),
        ...(nom && { nom }),
        ...(telephone && { telephone }),
      };

      await this.db
        .update(dcpTable)
        .set(userAttributes)
        .where(eq(dcpTable.id, user.id));
    }
  }

  async updateUserPreferences(
    user: AuthenticatedUser,
    preferences: Partial<UserPreferences>
  ): Promise<Result<UserPreferences, CommonError>> {
    const currentPreferencesResult =
      await this.listUsersService.getUserPreferences({ userId: user.id });
    const currentPreferences =
      (currentPreferencesResult.success && currentPreferencesResult.data) ||
      defaultUserPreferences;
    const parsedPreferences = userPreferencesSchema.safeParse(
      merge(currentPreferences, preferences)
    );

    if (parsedPreferences.error) {
      return { success: false, error: CommonErrorEnum.SERVER_ERROR };
    }
    const updatedPreferences = parsedPreferences.data;
    try {
      await this.db
        .update(dcpTable)
        .set({ preferences: updatedPreferences })
        .where(eq(dcpTable.id, user.id));

      return { success: true, data: updatedPreferences };
    } catch (err) {
      this.logger.error(err);
      return { success: false, error: CommonErrorEnum.SERVER_ERROR };
    }
  }
}
