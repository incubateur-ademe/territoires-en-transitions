import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import { Role } from '@/backend/auth/authorizations/roles/role.enum';
import { auditeurTable } from '@/backend/referentiels/labellisations/auditeur.table';
import { DatabaseService } from '@/backend/utils';
import {
  dcpTable,
  UtilisateurPermission,
  utilisateurPermissionTable,
} from '@/domain/auth';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { AuthRole, AuthUser } from '../../models/auth.models';
import { PermissionLevel } from './niveau-acces.enum';
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
      roles.push(Role.CONNECTE);

      // VERIFIE
      const estVerifie = await this.isVerifie(user.id);
      if (estVerifie) {
        roles.push(Role.VERIFIE);
      }

      // SUPPORT
      const estSupport = await this.isSupport(user.id);
      if (estSupport) {
        roles.push(Role.SUPPORT);
      }

      // ADEME
      const estAdeme = await this.isAdeme(user.id);
      if (estAdeme) {
        roles.push(Role.ADEME);
      }

      // Resource COLLECTIVITE : Rôles LECTURE, EDITION, ADMIN
      if (resourceType === ResourceType.COLLECTIVITE && resourceId) {
        const droits = await this.getPermissions({
          userId: user.id,
          collectiviteId: resourceId,
        });

        for (const droit of droits) {
          switch (droit.niveau) {
            case PermissionLevel.LECTURE:
              if (!roles.includes(Role.LECTURE)) roles.push(Role.LECTURE);
              break;
            case PermissionLevel.EDITION:
              if (!roles.includes(Role.EDITION)) roles.push(Role.EDITION);
              break;
            case PermissionLevel.ADMIN:
              if (!roles.includes(Role.ADMIN)) roles.push(Role.ADMIN);
              break;
          }
        }
      }

      // Resource AUDIT : AUDITEUR
      if (resourceType === ResourceType.AUDIT && resourceId) {
        const isAuditeurForAudit = await this.isAuditeurForAudit({
          userId: user.id,
          auditId: resourceId,
        });

        if (isAuditeurForAudit) {
          roles.push(Role.AUDITEUR);
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
  }: {
    userId: string;
    collectiviteId?: number;
  }): Promise<UtilisateurPermission[]> {
    const query = this.databaseService.db
      .select()
      .from(utilisateurPermissionTable);

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

    return query;
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
   * Vérifie que l'utilisateur est un auditeur de la collectivité
   * @param userId identifiant de l'utilisateur
   * @param collectiviteId identifiant de la collectivité
   */
  private async isAuditeurForCollectivite(
    userId: string,
    collectiviteId: number
  ): Promise<boolean> {
    const result = await this.databaseService.db.execute(
      sql`SELECT *
          FROM audit_auditeur aa
                 JOIN labellisation.audit a ON aa.audit_id = a.id
          WHERE a.clos IS FALSE
            AND a.collectivite_id = ${collectiviteId}
            AND aa.auditeur = ${userId}`
    );

    return (result?.rowCount && result.rowCount > 0) || false;
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
}
