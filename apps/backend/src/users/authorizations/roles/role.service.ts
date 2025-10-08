import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { auditeurTable } from '@/backend/referentiels/labellisations/auditeur.table';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import {
  UtilisateurPermission,
  utilisateurPermissionTable,
} from '@/backend/users/authorizations/roles/private-utilisateur-droit.table';
import {
  AuditRole,
  CollectiviteRole,
  Role,
  UserRole,
} from '@/backend/users/authorizations/roles/role.enum';
import { AuthRole, AuthUser } from '@/backend/users/models/auth.models';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, asc, count, eq, getTableColumns, not } from 'drizzle-orm';
import { auditTable } from '../../../referentiels/labellisations/audit.table';
import { PermissionLevelEnum } from './permission-level.enum';
import { utilisateurSupportTable } from './utilisateur-support.table';
import { utilisateurVerifieTable } from './utilisateur-verifie.table';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getUserRoles(
    user: AuthUser,
    resourceType: ResourceType,
    resourceId: number | null
  ): Promise<Role[]> {
    this.logger.log(
      `Récupération des rôles de l'utilisateur ${user.id} sur la ressource ${resourceType} ${resourceId}`
    );
    const roles: Role[] = [];

    if (user.role === AuthRole.AUTHENTICATED && user.id) {
      // CONNECTE
      roles.push(UserRole.CONNECTE);

      // VERIFIE
      const estVerifie = await this.isVerifie(user.id);
      if (estVerifie) {
        roles.push(UserRole.VERIFIE);
      }

      // SUPPORT
      const estSupport = await this.isSupport(user.id);
      if (estSupport) {
        roles.push(UserRole.SUPPORT);
      }

      // ADEME
      const estAdeme = await this.isAdeme(user.id);
      if (estAdeme) {
        roles.push(UserRole.ADEME);
      }

      // Resource COLLECTIVITE : Rôles LECTURE, EDITION, ADMIN
      if (resourceType === ResourceType.COLLECTIVITE && resourceId) {
        const droits = await this.getPermissions({
          userId: user.id,
          collectiviteId: resourceId,
        });

        for (const droit of droits) {
          switch (droit.permissionLevel) {
            case PermissionLevelEnum.LECTURE:
              if (!roles.includes(CollectiviteRole.LECTURE))
                roles.push(CollectiviteRole.LECTURE);
              break;
            case PermissionLevelEnum.EDITION:
              if (!roles.includes(CollectiviteRole.EDITION))
                roles.push(CollectiviteRole.EDITION);
              break;
            case PermissionLevelEnum.ADMIN:
              if (!roles.includes(CollectiviteRole.ADMIN))
                roles.push(CollectiviteRole.ADMIN);
              break;
          }
        }
      }

      // TODO: find a way to check the referentiel too
      if (resourceType === ResourceType.COLLECTIVITE && resourceId) {
        const isAuditeurForCollectivite =
          await this.isCurrentAuditeurForCollectivite({
            userId: user.id,
            collectiviteId: resourceId,
          });

        if (isAuditeurForCollectivite) {
          roles.push(AuditRole.AUDITEUR);
        }
      }

      // Resource AUDIT : AUDITEUR
      if (resourceType === ResourceType.AUDIT && resourceId) {
        const isAuditeurForAudit = await this.isAuditeurForAudit({
          userId: user.id,
          auditId: resourceId,
        });

        if (isAuditeurForAudit) {
          roles.push(AuditRole.AUDITEUR);
        }
      }
    }

    this.logger.log(
      `L'utilisateur ${
        user.id
      } possède le(s) rôle(s) ${roles.toString()} sur la ressource ${resourceType} ${resourceId}`
    );

    return roles;
  }

  async getPermissions({
    userId,
    collectiviteId,
    addCollectiviteNom,
  }: {
    userId: string;
    collectiviteId?: number;
    addCollectiviteNom?: boolean;
  }): Promise<UtilisateurPermission[]> {
    const query = this.databaseService.db
      .select(
        addCollectiviteNom
          ? {
              ...getTableColumns(utilisateurPermissionTable),
              collectiviteNom: collectiviteTable.nom,
            }
          : {
              ...getTableColumns(utilisateurPermissionTable),
            }
      )
      .from(utilisateurPermissionTable);

    if (addCollectiviteNom) {
      query.leftJoin(
        collectiviteTable,
        eq(collectiviteTable.id, utilisateurPermissionTable.collectiviteId)
      );
    }

    if (collectiviteId) {
      query.where(
        and(
          eq(utilisateurPermissionTable.userId, userId),
          eq(utilisateurPermissionTable.collectiviteId, collectiviteId)
        )
      );
    } else {
      query.where(eq(utilisateurPermissionTable.userId, userId));
    }

    return query.orderBy(
      asc(
        addCollectiviteNom
          ? collectiviteTable.nom
          : utilisateurPermissionTable.collectiviteId
      )
    );
  }

  /**
   * Vérifie si l'utilisateur a un rôle support
   * @param userId identifiant de l'utilisateur
   * @return vrai si l'utilisateur a un rôle support
   */
  private async isSupport(userId: string): Promise<boolean> {
    const result = await this.databaseService.db
      .select()
      .from(utilisateurSupportTable)
      .where(eq(utilisateurSupportTable.userId, userId));
    return (result.length && result[0]?.support) || false;
  }

  /**
   * Vérifie si l'utilisateur est vérifié
   * @param userId identifiant de l'utilisateur
   * @return vrai si l'utilisateur est vérifié
   */
  private async isVerifie(userId: string): Promise<boolean> {
    const result = await this.databaseService.db
      .select()
      .from(utilisateurVerifieTable)
      .where(eq(utilisateurVerifieTable.userId, userId));

    return result[0].verifie || false;
  }

  /**
   * Vérifie si l'utilisateur a une adresse ademe
   * @param userId identifiant de l'utilisateur
   * @return vrai si l'utilisateur vient de l'ademe
   */
  private async isAdeme(userId: string): Promise<boolean> {
    const result = await this.databaseService.db
      .select()
      .from(dcpTable)
      .where(eq(dcpTable.userId, userId));

    const email: string = result[0].email;

    return email?.includes('@ademe.fr') || false;
  }

  /**
   * Vérifie que l'utilisateur est un auditeur pour un audit donné
   */
  private async isCurrentAuditeurForCollectivite({
    userId,
    collectiviteId,
  }: {
    userId: string;
    collectiviteId: number;
  }) {
    return this.databaseService.db
      .select({ count: count() })
      .from(auditTable)
      .leftJoin(auditeurTable, eq(auditeurTable.auditId, auditTable.id))
      .where(
        and(
          eq(auditTable.collectiviteId, collectiviteId),
          not(auditTable.clos),
          eq(auditeurTable.auditeur, userId)
        )
      )
      .then((data) => data[0].count > 0);
  }

  /**
   * Vérifie que l'utilisateur est un auditeur pour un audit donné
   */
  private async isAuditeurForAudit({
    userId,
    auditId,
  }: {
    userId: string;
    auditId: number;
  }) {
    return this.databaseService.db
      .$count(
        auditeurTable,
        and(
          eq(auditeurTable.auditId, auditId),
          eq(auditeurTable.auditeur, userId)
        )
      )
      .then((count) => count > 0);
  }

  /**
   * Check if the user is an active member of the collectivite
   * @param userId user to check
   * @param collectiviteId collectivite to check
   * @param tx optional transaction
   */
  async isActiveMembre({
    userId,
    collectiviteId,
    tx,
  }: {
    userId: string;
    collectiviteId: number;
    tx?: Transaction;
  }): Promise<boolean> {
    const [utilisateur] = await (tx ?? this.databaseService.db)
      .select()
      .from(utilisateurPermissionTable)
      .where(
        and(
          eq(utilisateurPermissionTable.userId, userId),
          eq(utilisateurPermissionTable.isActive, true),
          eq(utilisateurPermissionTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);

    return !!utilisateur;
  }
}
