import { Injectable } from '@nestjs/common';
import { utilisateurSupportTable } from '@tet/backend/users/authorizations/roles/utilisateur-support.table';
import { utilisateurVerifieTable } from '@tet/backend/users/authorizations/roles/utilisateur-verifie.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { and, eq, sql } from 'drizzle-orm';
import {
  UpdateUserRoleError,
  UpdateUserRoleErrorEnum,
} from './update-user-role.error';

@Injectable()
export class UpdateUserRoleService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Change le rôle support d'un utilisateur
   * @param userId identifiant de l'utilisateur
   * @param isSupport
   */
  async setIsSupport(userId: string, isSupport: boolean): Promise<void> {
    await this.databaseService.db
      .update(utilisateurSupportTable)
      .set({ isSupport })
      .where(eq(utilisateurSupportTable.userId, userId));
  }

  /**
   * Active ou désactive le mode support pour un utilisateur
   * Nécessite que l'utilisateur ait déjà le rôle support (support = true)
   * @param userId identifiant de l'utilisateur
   * @param isActive vrai pour activer le mode support, faux pour le désactiver
   */
  async toggleSuperAdminRole({
    userId,
    isEnabled,
  }: {
    userId: string;
    isEnabled: boolean;
  }): Promise<Result<void, UpdateUserRoleError>> {
    const userWithSupportRole = await this.databaseService.db
      .select()
      .from(utilisateurSupportTable)
      .where(
        and(
          eq(utilisateurSupportTable.userId, userId),
          eq(utilisateurSupportTable.isSupport, true)
        )
      )
      .limit(1)
      .then((data) => data[0]);

    if (!userWithSupportRole) {
      return {
        success: false,
        error: UpdateUserRoleErrorEnum.USER_NOT_SUPPORT,
      };
    }

    await this.databaseService.db
      .update(utilisateurSupportTable)
      .set({ isSuperAdminRoleEnabled: isEnabled })
      .where(eq(utilisateurSupportTable.userId, userId));

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Change le rôle vérifié d'un utilisateur
   * @param userId identifiant de l'utilisateur
   * @param isVerified
   */
  async setIsVerified(
    userId: string,
    verifie: boolean,
    trx?: Transaction
  ): Promise<void> {
    await (trx || this.databaseService.db)
      .insert(utilisateurVerifieTable)
      .values({
        userId,
        verifie,
      })
      .onConflictDoUpdate({
        target: [utilisateurVerifieTable.userId],
        set: {
          verifie: sql.raw(`excluded.${utilisateurVerifieTable.verifie.name}`),
        },
      });
  }
}
