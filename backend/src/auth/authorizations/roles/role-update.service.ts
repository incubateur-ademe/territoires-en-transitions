import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/backend/utils';
import { utilisateurSupportTable } from '@/backend/auth/authorizations/roles/utilisateur-support.table';
import { eq } from 'drizzle-orm';
import { utilisateurVerifieTable } from '@/backend/auth/authorizations/roles/utilisateur-verifie.table';

@Injectable()
export class RoleUpdateService {
  private readonly logger = new Logger(RoleUpdateService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Change le rôle support d'un utilisateur
   * @param userId identifiant de l'utilisateur
   * @param isSupport
   */
  async setIsSupport(userId: string, isSupport : boolean): Promise<void> {
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
  async setIsVerified(userId: string, isVerified : boolean): Promise<void> {
    await this.databaseService.db
      .update(utilisateurVerifieTable)
      .set({ verifie: isVerified })
      .where(eq(utilisateurVerifieTable.userId, userId));
  }
}
