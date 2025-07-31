import { utilisateurSupportTable } from '@/backend/users/authorizations/roles/utilisateur-support.table';
import { utilisateurVerifieTable } from '@/backend/users/authorizations/roles/utilisateur-verifie.table';
import { DatabaseService } from '@/backend/utils';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class RoleUpdateService {
  private readonly logger = new Logger(RoleUpdateService.name);

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
