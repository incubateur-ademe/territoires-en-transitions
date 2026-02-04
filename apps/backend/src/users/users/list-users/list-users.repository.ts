import { Injectable } from '@nestjs/common';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import {
  defaultUserPreferences,
  UserInfo,
  UserPreferences,
  userPreferencesSchema,
} from '@tet/domain/users';
import { and, eq, inArray, SQL, SQLWrapper } from 'drizzle-orm';
import { merge } from 'es-toolkit';
import { utilisateurSupportTable } from '../../authorizations/roles/utilisateur-support.table';
import { utilisateurVerifieTable } from '../../authorizations/roles/utilisateur-verifie.table';

@Injectable()
export class ListUsersRepository {
  private readonly db = this.database.db;

  constructor(private readonly database: DatabaseService) {}

  async listUserInfosBy({
    userId,
    emails,
  }: {
    userId?: string;
    emails?: string[];
  }): Promise<UserInfo[]> {
    const where = [
      userId ? eq(dcpTable.id, userId) : undefined,
      emails ? inArray(dcpTable.email, emails) : undefined,
    ];

    return this.listUsersInfoBy(where);
  }

  private async listUsersInfoBy(where: (SQLWrapper | SQL | undefined)[]) {
    return this.db
      .select({
        id: dcpTable.id,
        email: dcpTable.email,
        nom: dcpTable.nom,
        prenom: dcpTable.prenom,
        telephone: dcpTable.telephone,
        cguAccepteesLe: dcpTable.cguAccepteesLe,
      })
      .from(authUsersTable)
      .innerJoin(dcpTable, eq(dcpTable.id, authUsersTable.id))
      .leftJoin(
        utilisateurSupportTable,
        eq(utilisateurSupportTable.userId, authUsersTable.id)
      )
      .leftJoin(
        utilisateurVerifieTable,
        eq(utilisateurVerifieTable.userId, authUsersTable.id)
      )
      .where(and(...where));
  }

  /**
   * Charge les préférences utilisateur (fusionne avec les préférences par défaut si nécessaire)
   */
  async getUserPreferencesByUserId(
    userId: string
  ): Promise<Result<UserPreferences, CommonError>> {
    const rows = await this.db
      .select({ preferences: dcpTable.preferences })
      .from(authUsersTable)
      .innerJoin(dcpTable, eq(dcpTable.id, authUsersTable.id))
      .where(eq(dcpTable.id, userId));
    const user = rows[0];
    return user
      ? { success: true, data: this.parsePreferences(user) }
      : { success: false, error: CommonErrorEnum.NOT_FOUND };
  }

  /**
   * Parse et fusionne les préférences utilisateur enregistrées et les préférences par défaut
   */
  private parsePreferences(user: { preferences: UserPreferences | null }) {
    if (!user.preferences) {
      return defaultUserPreferences;
    }
    const parsedPreferences = userPreferencesSchema.safeParse(
      merge(defaultUserPreferences, user.preferences)
    );
    return parsedPreferences.success
      ? parsedPreferences.data
      : defaultUserPreferences;
  }
}
