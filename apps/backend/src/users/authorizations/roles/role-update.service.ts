import { Injectable } from '@nestjs/common';
import { utilisateurSupportTable } from '@tet/backend/users/authorizations/roles/utilisateur-support.table';
import { utilisateurVerifieTable } from '@tet/backend/users/authorizations/roles/utilisateur-verifie.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class RoleUpdateService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Change le rôle support d'un utilisateur
   * @param userId identifiant de l'utilisateur
   * @param isSupport
   */
  async setIsSupport(userId: string, isSupport: boolean): Promise<void> {
    await this.databaseService.db
      .update(utilisateurSupportTable)
      .set({ support: isSupport })
      .where(eq(utilisateurSupportTable.userId, userId));
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
