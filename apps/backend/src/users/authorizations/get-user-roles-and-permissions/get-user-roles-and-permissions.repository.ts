import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { auditeurTable } from '@tet/backend/referentiels/labellisations/auditeur.table';
import { utilisateurSupportTable } from '@tet/backend/users/authorizations/roles/utilisateur-support.table';
import { utilisateurVerifieTable } from '@tet/backend/users/authorizations/roles/utilisateur-verifie.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, sql } from 'drizzle-orm';

export type PlatformRolesRow = {
  isVerified: boolean;
  isSupport: boolean;
  isSupportModeEnabled: boolean;
  isAdeme: boolean;
};

export type CollectiviteRolesRow = {
  collectiviteId: number;
  collectiviteNom: string;
  collectiviteAccesRestreint: boolean;
  role: CollectiviteRole;
};

export type AuditRolesRow = {
  auditId: number;
  collectiviteId: number;
};

@Injectable()
export class GetUserRolesAndPermissionsRepository {
  private readonly db = this.databaseService.db;

  constructor(private readonly databaseService: DatabaseService) {}

  async getPlatformRoles({
    userId,
  }: {
    userId: string;
  }): Promise<PlatformRolesRow | null> {
    const [user] = await this.db
      .select({
        isVerified: sql<boolean>`coalesce(${utilisateurVerifieTable.verifie}, false)`,
        isSupport: sql<boolean>`coalesce(${utilisateurSupportTable.isSupport}, false)`,
        isSupportModeEnabled: sql<boolean>`coalesce(${utilisateurSupportTable.isSupportModeEnabled}, false)`,
        isAdeme: sql<boolean>`coalesce(${dcpTable.email} LIKE '%@ademe.fr', false)`,
      })
      .from(dcpTable)
      .leftJoin(
        utilisateurSupportTable,
        eq(utilisateurSupportTable.userId, dcpTable.id)
      )
      .leftJoin(
        utilisateurVerifieTable,
        eq(utilisateurVerifieTable.userId, dcpTable.id)
      )
      .where(eq(dcpTable.id, userId))
      .limit(1);

    return user ?? null;
  }

  async getCollectiviteRoles({
    userId,
  }: {
    userId: string;
  }): Promise<CollectiviteRolesRow[]> {
    return this.db
      .select({
        collectiviteId: utilisateurCollectiviteAccessTable.collectiviteId,
        collectiviteNom: collectiviteTable.nom,
        collectiviteAccesRestreint: sql<boolean>`coalesce(${collectiviteTable.accesRestreint}, false)`,
        role: utilisateurCollectiviteAccessTable.accessLevel,
      })
      .from(utilisateurCollectiviteAccessTable)
      .innerJoin(
        collectiviteTable,
        eq(
          collectiviteTable.id,
          utilisateurCollectiviteAccessTable.collectiviteId
        )
      )
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.isActive, true)
        )
      );
  }

  async getAuditRoles({
    userId,
  }: {
    userId: string;
  }): Promise<AuditRolesRow[]> {
    return this.db
      .select({
        auditId: auditTable.id,
        collectiviteId: auditTable.collectiviteId,
      })
      .from(auditeurTable)
      .innerJoin(auditTable, eq(auditTable.id, auditeurTable.auditId))
      .where(
        and(eq(auditeurTable.auditeur, userId), eq(auditTable.clos, false))
      );
  }
}
