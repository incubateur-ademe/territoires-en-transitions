import { PermissionLevel } from '@/backend/users/authorizations/roles/permission-level.enum';
import { utilisateurPermissionTable } from '@/backend/users/authorizations/roles/private-utilisateur-droit.table';
import { utilisateurSupportTable } from '@/backend/users/authorizations/roles/utilisateur-support.table';
import { utilisateurVerifieTable } from '@/backend/users/authorizations/roles/utilisateur-verifie.table';
import { DatabaseService } from '@/backend/utils';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

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

  /**
   * Change le niveau de permission d'un utilisateur sur une collectivité
   * @param userId identifiant de l'utilisateur
   * @param collectiviteId identifiant de la collectivité
   * @param permissionLevel nouveau niveau de permission
   * @param trx transaction optionnelle
   */
  async setPermissionLevel(
    userId: string,
    collectiviteId: number,
    permissionLevel: PermissionLevel,
    trx?: Transaction
  ): Promise<void> {
    this.logger.log(
      `Mise à jour du niveau de permission de l'utilisateur ${userId} sur la collectivité ${collectiviteId} vers ${permissionLevel}`
    );

    await (trx || this.databaseService.db)
      .update(utilisateurPermissionTable)
      .set({
        permissionLevel,
        modifiedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(utilisateurPermissionTable.userId, userId),
          eq(utilisateurPermissionTable.collectiviteId, collectiviteId),
          eq(utilisateurPermissionTable.isActive, true)
        )
      );
  }
}
