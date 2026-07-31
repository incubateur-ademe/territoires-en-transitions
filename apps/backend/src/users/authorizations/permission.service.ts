import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { CollectivitePreferencesRepository } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.repository';
import { REFERENTIEL_NOT_WRITABLE_MESSAGE } from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import {
  defaultCollectivitePreferences,
  type CollectiviteReferentielPreferences,
} from '@tet/domain/collectivites';
import type { ReferentielId } from '@tet/domain/referentiels';
import {
  hasPermission,
  isReferentielOperationAllowed,
  PermissionOperation,
  ResourceType,
  type UserRolesAndPermissions,
} from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { AuthRole, AuthUser } from '../models/auth.models';
import { GetUserRolesAndPermissionsService } from './get-user-roles-and-permissions/get-user-roles-and-permissions.service';

export type ReferentielPermissionResource = {
  collectiviteId: number;
  referentielId: ReferentielId;
};

export type AuditPermissionResource = {
  auditId: number;
};

export type CollectivitePermissionResource = {
  collectiviteId: number;
};

export type PermissionResourceId =
  | ReferentielPermissionResource
  | AuditPermissionResource
  | CollectivitePermissionResource
  | null;

export type ReferentielPermissionOperation = Extract<
  PermissionOperation,
  `referentiels.${string}`
>;

export type NonReferentielPermissionOperation = Exclude<
  PermissionOperation,
  ReferentielPermissionOperation
>;

export type PermissionDenial = 'UNAUTHORIZED' | 'REFERENTIEL_NOT_WRITABLE';

function isAuditPermissionResource(
  resourceId: PermissionResourceId
): resourceId is AuditPermissionResource {
  return (
    typeof resourceId === 'object' &&
    resourceId !== null &&
    'auditId' in resourceId
  );
}

function isReferentielPermissionResource(
  resourceId: PermissionResourceId
): resourceId is ReferentielPermissionResource {
  return (
    typeof resourceId === 'object' &&
    resourceId !== null &&
    'referentielId' in resourceId
  );
}

function isCollectivitePermissionResource(
  resourceId: PermissionResourceId
): resourceId is CollectivitePermissionResource {
  return (
    typeof resourceId === 'object' &&
    resourceId !== null &&
    'collectiviteId' in resourceId &&
    !('referentielId' in resourceId) &&
    !('auditId' in resourceId)
  );
}

function formatResourceLabel(resourceId: PermissionResourceId): string {
  if (isReferentielPermissionResource(resourceId)) {
    return `${resourceId.collectiviteId}/${resourceId.referentielId}`;
  }
  if (isAuditPermissionResource(resourceId)) {
    return String(resourceId.auditId);
  }
  if (isCollectivitePermissionResource(resourceId)) {
    return String(resourceId.collectiviteId);
  }
  return String(resourceId);
}

/** Resolves collectiviteId + referentielId from the audit entry in user permissions. */
function findAuditPermissionContext(
  user: UserRolesAndPermissions,
  auditId: number
): ReferentielPermissionResource | null {
  for (const collectivite of user.collectivites) {
    const audit = collectivite.audits.find((a) => a.auditId === auditId);
    if (audit) {
      return {
        collectiviteId: collectivite.collectiviteId,
        referentielId: audit.referentielId,
      };
    }
  }
  return null;
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    private readonly getUserPermissionsService: GetUserRolesAndPermissionsService,
    private readonly collectivitePreferencesRepository: CollectivitePreferencesRepository,
    private readonly databaseService: DatabaseService
  ) {}

  hasServiceRole(
    user: AuthUser | null | undefined,
    doNotThrow?: boolean
  ): boolean {
    if (user?.role !== AuthRole.SERVICE_ROLE) {
      if (!doNotThrow) {
        throw new ForbiddenException(
          `Droits insuffisants, l'utilisateur n'a pas le rôle ${AuthRole.SERVICE_ROLE}`
        );
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  throwForbiddenException(
    user: AuthUser,
    operation: PermissionOperation,
    resourceType: ResourceType,
    resourceId: PermissionResourceId
  ) {
    throw new ForbiddenException(
      `Droits insuffisants, l'utilisateur ${
        user.id
      } n'a pas l'autorisation ${operation} sur la ressource ${resourceType} ${formatResourceLabel(
        resourceId
      )}`
    );
  }

  /**
   * Vérifie l'autorisation de l'utilisateur sur une ressource.
   * Retourne un Result au lieu de lever une exception.
   *
   * - referentiels.* + AUDIT → { auditId } (rôle + mode via audit context)
   * - referentiels.* + REFERENTIEL → { collectiviteId, referentielId }
   * - referentiels.* + COLLECTIVITE → { collectiviteId } (rôle seul, sans filtre mode)
   * - autres ops + COLLECTIVITE → { collectiviteId }
   * - autres ops + PLATEFORME → null
   */
  isAllowed(
    user: AuthUser,
    operation: ReferentielPermissionOperation,
    resourceType: typeof ResourceType.AUDIT,
    resourceId: AuditPermissionResource,
    tx?: Transaction
  ): Promise<Result<void, PermissionDenial>>;
  isAllowed(
    user: AuthUser,
    operation: ReferentielPermissionOperation,
    resourceType: typeof ResourceType.REFERENTIEL,
    resourceId: ReferentielPermissionResource,
    tx?: Transaction
  ): Promise<Result<void, PermissionDenial>>;
  isAllowed(
    user: AuthUser,
    operation: ReferentielPermissionOperation,
    resourceType: typeof ResourceType.COLLECTIVITE,
    resourceId: CollectivitePermissionResource,
    tx?: Transaction
  ): Promise<Result<void, PermissionDenial>>;
  isAllowed(
    user: AuthUser,
    operation: NonReferentielPermissionOperation,
    resourceType: typeof ResourceType.COLLECTIVITE,
    resourceId: CollectivitePermissionResource,
    tx?: Transaction
  ): Promise<Result<void, PermissionDenial>>;
  isAllowed(
    user: AuthUser,
    operation: NonReferentielPermissionOperation,
    resourceType: typeof ResourceType.PLATEFORME,
    resourceId: null,
    tx?: Transaction
  ): Promise<Result<void, PermissionDenial>>;
  async isAllowed(
    user: AuthUser,
    operation: PermissionOperation,
    resourceType: ResourceType,
    resourceId: PermissionResourceId,
    tx?: Transaction
  ): Promise<Result<void, PermissionDenial>> {
    return this.checkIsAllowed(user, operation, resourceType, resourceId, tx);
  }

  /**
   * Vérifie l'autorisation et lève une ForbiddenException en cas de refus.
   * À utiliser dans les routers qui n'ont pas encore migré vers Result.
   * @deprecated Instead use isAllowed() with pattern Result
   */
  assertAllowed(
    user: AuthUser,
    operation: ReferentielPermissionOperation,
    resourceType: typeof ResourceType.AUDIT,
    resourceId: AuditPermissionResource,
    tx?: Transaction
  ): Promise<void>;
  assertAllowed(
    user: AuthUser,
    operation: ReferentielPermissionOperation,
    resourceType: typeof ResourceType.REFERENTIEL,
    resourceId: ReferentielPermissionResource,
    tx?: Transaction
  ): Promise<void>;
  assertAllowed(
    user: AuthUser,
    operation: ReferentielPermissionOperation,
    resourceType: typeof ResourceType.COLLECTIVITE,
    resourceId: CollectivitePermissionResource,
    tx?: Transaction
  ): Promise<void>;
  assertAllowed(
    user: AuthUser,
    operation: NonReferentielPermissionOperation,
    resourceType: typeof ResourceType.COLLECTIVITE,
    resourceId: CollectivitePermissionResource,
    tx?: Transaction
  ): Promise<void>;
  assertAllowed(
    user: AuthUser,
    operation: NonReferentielPermissionOperation,
    resourceType: typeof ResourceType.PLATEFORME,
    resourceId: null,
    tx?: Transaction
  ): Promise<void>;
  async assertAllowed(
    user: AuthUser,
    operation: PermissionOperation,
    resourceType: ResourceType,
    resourceId: PermissionResourceId,
    tx?: Transaction
  ): Promise<void> {
    const result = await this.checkIsAllowed(
      user,
      operation,
      resourceType,
      resourceId,
      tx
    );

    if (result.success) {
      return;
    }

    if (result.error === 'REFERENTIEL_NOT_WRITABLE') {
      throw new ForbiddenException(REFERENTIEL_NOT_WRITABLE_MESSAGE);
    }

    if (
      user.jwtPayload?.permissions &&
      !user.jwtPayload.permissions.includes(operation)
    ) {
      throw new ForbiddenException(
        `Droits insuffisants, la clé d'api n'a pas l'autorisation ${operation}.`
      );
    }

    this.throwForbiddenException(user, operation, resourceType, resourceId);
  }

  private async checkIsAllowed(
    user: AuthUser,
    operation: PermissionOperation,
    resourceType: ResourceType,
    resourceId: PermissionResourceId,
    tx?: Transaction
  ): Promise<Result<void, PermissionDenial>> {
    if (user.role === AuthRole.SERVICE_ROLE) {
      return success(undefined);
    }

    if (user.jwtPayload?.permissions) {
      this.logger.log(
        `Checking restricted permissions for client_id ${user.jwtPayload.client_id}`
      );
      if (!user.jwtPayload.permissions.includes(operation)) {
        this.logger.log(
          `La clé d'api n'a pas l'autorisation ${operation}: permissions ${user.jwtPayload.permissions.join(
            ', '
          )}`
        );
        return failure('UNAUTHORIZED');
      }
    }

    if (!user.id) {
      return failure('UNAUTHORIZED');
    }

    const userPermissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: user.id,
        tx,
      });

    if (!userPermissionsResult.success) {
      return failure('UNAUTHORIZED');
    }

    if (isAuditPermissionResource(resourceId)) {
      const roleAllows = hasPermission(userPermissionsResult.data, operation, {
        auditId: resourceId.auditId,
      });

      if (!roleAllows) {
        this.logger.warn(
          `L'utilisateur ${user.id} ne possède pas l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId.auditId}`
        );
        return failure('UNAUTHORIZED');
      }

      // Mode: resolve audit → collectiviteId + referentielId (payload, else DB).
      const auditContext =
        findAuditPermissionContext(
          userPermissionsResult.data,
          resourceId.auditId
        ) ?? (await this.loadAuditPermissionContext(resourceId.auditId, tx));

      if (!auditContext) {
        this.logger.warn(
          `Impossible de résoudre le contexte mode pour l'audit ${resourceId.auditId}`
        );
        return failure('UNAUTHORIZED');
      }

      const modeResult = await this.checkReferentielMode(
        userPermissionsResult.data,
        operation,
        auditContext,
        tx
      );
      if (!modeResult.success) {
        return modeResult;
      }

      this.logger.log(
        `L'utilisateur ${user.id} possède l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId.auditId}`
      );
      return success(undefined);
    }

    if (isReferentielPermissionResource(resourceId)) {
      const roleAllows = hasPermission(userPermissionsResult.data, operation, {
        collectiviteId: resourceId.collectiviteId,
      });

      if (!roleAllows) {
        this.logger.warn(
          `L'utilisateur ${user.id} ne possède pas l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId.collectiviteId}/${resourceId.referentielId}`
        );
        return failure('UNAUTHORIZED');
      }

      const modeResult = await this.checkReferentielMode(
        userPermissionsResult.data,
        operation,
        resourceId,
        tx
      );
      if (!modeResult.success) {
        return modeResult;
      }

      this.logger.log(
        `L'utilisateur ${user.id} possède l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId.collectiviteId}/${resourceId.referentielId}`
      );
      return success(undefined);
    }

    if (isCollectivitePermissionResource(resourceId)) {
      const hasPermissionResult = hasPermission(
        userPermissionsResult.data,
        operation,
        { collectiviteId: resourceId.collectiviteId }
      );

      if (!hasPermissionResult) {
        this.logger.warn(
          `L'utilisateur ${user.id} ne possède pas l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId.collectiviteId}`
        );
        return failure('UNAUTHORIZED');
      }

      this.logger.log(
        `L'utilisateur ${user.id} possède l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId.collectiviteId}`
      );
      return success(undefined);
    }

    // ResourceType.PLATEFORME → resourceId null
    const hasPermissionResult = hasPermission(
      userPermissionsResult.data,
      operation
    );

    if (!hasPermissionResult) {
      this.logger.warn(
        `L'utilisateur ${user.id} ne possède pas l'autorisation ${operation} sur la ressource ${resourceType}`
      );
      return failure('UNAUTHORIZED');
    }

    this.logger.log(
      `L'utilisateur ${user.id} possède l'autorisation ${operation} sur la ressource ${resourceType}`
    );

    return success(undefined);
  }

  /**
   * Mode filter using preferences from the permission payload, falling back to DB
   * when the user has no collectivite membership (e.g. SUPER_ADMIN support).
   */
  private async checkReferentielMode(
    userPermissions: UserRolesAndPermissions,
    operation: PermissionOperation,
    resource: ReferentielPermissionResource,
    tx?: Transaction
  ): Promise<Result<void, PermissionDenial>> {
    const collectivite = userPermissions.collectivites.find(
      (c) => c.collectiviteId === resource.collectiviteId
    );

    let referentielPreferences: CollectiviteReferentielPreferences | undefined =
      collectivite?.collectivitePreferences.referentiels;

    if (!referentielPreferences) {
      const prefsResult =
        await this.collectivitePreferencesRepository.getPreferencesByCollectiviteId(
          resource.collectiviteId,
          { tx }
        );
      if (!prefsResult.success) {
        this.logger.warn(
          `Unable to load preferences for collectivite ${resource.collectiviteId}`
        );
        return failure('UNAUTHORIZED');
      }
      referentielPreferences = (
        prefsResult.data ?? defaultCollectivitePreferences
      ).referentiels;
    }

    if (
      !isReferentielOperationAllowed(
        operation,
        resource.referentielId,
        referentielPreferences
      )
    ) {
      this.logger.warn(
        `Référentiel ${resource.referentielId} non modifiable pour la collectivité ${resource.collectiviteId}`
      );
      return failure('REFERENTIEL_NOT_WRITABLE');
    }

    return success(undefined);
  }

  private async loadAuditPermissionContext(
    auditId: number,
    tx?: Transaction
  ): Promise<ReferentielPermissionResource | null> {
    const db = tx ?? this.databaseService.db;
    const [audit] = await db
      .select({
        collectiviteId: auditTable.collectiviteId,
        referentielId: auditTable.referentielId,
      })
      .from(auditTable)
      .where(eq(auditTable.id, auditId))
      .limit(1);

    if (!audit) {
      return null;
    }

    return {
      collectiviteId: audit.collectiviteId,
      referentielId: audit.referentielId as ReferentielId,
    };
  }
}
