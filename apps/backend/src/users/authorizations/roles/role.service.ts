import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { auditeurTable } from '@/backend/referentiels/labellisations/auditeur.table';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { utilisateurCollectiviteAccessTable } from '@/backend/users/authorizations/roles/private-utilisateur-droit.table';
import { AuthRole, AuthUser } from '@/backend/users/models/auth.models';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import {
  AuditRole,
  CollectiviteAccess,
  Role,
  UserRole,
  UtilisateurCollectiviteAccess,
} from '@/domain/users';
import { Injectable, Logger } from '@nestjs/common';
import { and, asc, count, eq, getTableColumns, not } from 'drizzle-orm';
import { auditTable } from '../../../referentiels/labellisations/audit.table';
import { utilisateurSupportTable } from './utilisateur-support.table';
import { utilisateurVerifieTable } from './utilisateur-verifie.table';
import { permissionsByRole } from '@/domain/users';

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
        const droits = await this.listActiveCollectiviteAccessLevels({
          userId: user.id,
          collectiviteId: resourceId,
        });

        roles.push(...new Set(droits.map((droit) => droit.accessLevel)));
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

  async getCollectiviteAccesses(userId: string): Promise<CollectiviteAccess[]> {
    const collectiviteAccessLevels =
      await this.listActiveCollectiviteAccessLevels({
        userId,
      });
    const accesses: CollectiviteAccess[] = collectiviteAccessLevels.map(
      (collectiviteAccessLevel) => ({
        collectiviteId: collectiviteAccessLevel.collectiviteId,
        nom: collectiviteAccessLevel.collectiviteNom,
        niveauAcces: collectiviteAccessLevel.accessLevel,
        permissions: collectiviteAccessLevel.accessLevel
          ? permissionsByRole[collectiviteAccessLevel.accessLevel]
          : [],
        accesRestreint:
          collectiviteAccessLevel.collectiviteAccesRestreint || false,
        isRoleAuditeur: false,
        isReadOnly:
          !collectiviteAccessLevel.accessLevel ||
          collectiviteAccessLevel.accessLevel === 'lecture',
        isSimplifiedView:
          collectiviteAccessLevel.accessLevel === 'edition_fiches_indicateurs',
      })
    );

    const collectivitesWhereUserIsAuditeur =
      await this.listCollectivitesWhereUserIsAuditeur(userId);
    this.logger.log(
      `L'utilisateur ${userId} a le rôle auditeur pour les collectivités ${collectivitesWhereUserIsAuditeur
        .map((c) => c.collectiviteId)
        .join(', ')}`
    );

    const collectiviteIdsWhereUserIsAuditeur = new Set(
      collectivitesWhereUserIsAuditeur.map((c) => c.collectiviteId)
    );

    const accessesWithAuditeurRoleUpdated = accesses.map((access) =>
      collectiviteIdsWhereUserIsAuditeur.has(access.collectiviteId)
        ? {
            ...access,
            isRoleAuditeur: true,
            permissions: [
              ...new Set([
                ...(access.permissions || []),
                ...permissionsByRole['auditeur'],
              ]),
            ],
          }
        : access
    );

    const missingAuditeurAccesses: CollectiviteAccess[] =
      collectivitesWhereUserIsAuditeur
        .filter(
          (c) => !accesses.some((a) => a.collectiviteId === c.collectiviteId)
        )
        .map((collectivite) => {
          const access: CollectiviteAccess = {
            collectiviteId: collectivite.collectiviteId,
            nom: collectivite.collectiviteNom,
            niveauAcces: null,
            permissions: permissionsByRole['auditeur'],
            accesRestreint: collectivite.collectiviteAccesRestreint || false,
            isRoleAuditeur: true,
            isReadOnly: false,
            isSimplifiedView: false,
          };
          return access;
        });

    return [...accessesWithAuditeurRoleUpdated, ...missingAuditeurAccesses];
  }

  private async listCollectivitesWhereUserIsAuditeur(userId: string) {
    // TODO: change this in order to add an audit permission when affecting an audit to a user ?
    return this.databaseService.db
      .select({
        collectiviteId: auditTable.collectiviteId,
        collectiviteNom: collectiviteTable.nom,
        collectiviteAccesRestreint: collectiviteTable.accesRestreint,
      })
      .from(auditeurTable)
      .innerJoin(auditTable, eq(auditTable.id, auditeurTable.auditId))
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, auditTable.collectiviteId)
      )
      .where(and(eq(auditeurTable.auditeur, userId), not(auditTable.clos)));
  }

  async listActiveCollectiviteAccessLevels({
    userId,
    collectiviteId,
  }: {
    userId: string;
    collectiviteId?: number;
  }): Promise<UtilisateurCollectiviteAccess[]> {
    const query = this.databaseService.db
      .select({
        ...getTableColumns(utilisateurCollectiviteAccessTable),
        collectiviteNom: collectiviteTable.nom,
        collectiviteAccesRestreint: collectiviteTable.accesRestreint,
      })
      .from(utilisateurCollectiviteAccessTable)
      .innerJoin(
        collectiviteTable,
        eq(
          collectiviteTable.id,
          utilisateurCollectiviteAccessTable.collectiviteId
        )
      );

    if (collectiviteId) {
      query.where(
        and(
          eq(utilisateurCollectiviteAccessTable.isActive, true),
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId)
        )
      );
    } else {
      query.where(
        and(
          eq(utilisateurCollectiviteAccessTable.isActive, true),
          eq(utilisateurCollectiviteAccessTable.userId, userId)
        )
      );
    }

    return query.orderBy(asc(collectiviteTable.nom));
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
}
