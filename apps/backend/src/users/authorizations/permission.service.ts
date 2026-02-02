import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  hasPermission,
  PermissionOperation,
  ResourceType,
} from '@tet/domain/users';
import { AuthRole, AuthUser } from '../models/auth.models';
import { GetUserRolesAndPermissionsService } from './get-user-roles-and-permissions/get-user-roles-and-permissions.service';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    private readonly getUserPermissionsService: GetUserRolesAndPermissionsService
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
    resourceId: number | null
  ) {
    throw new ForbiddenException(
      `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId}`
    );
  }

  /**
   * Vérifie l'autorisation de l'utilisateur sur une ressource
   * @param user
   * @param operation
   * @param resourceType type de la ressource
   * @param resourceId identifiant de la ressource, null si resourceType = PLATEFORME
   * @param doNotThrow vrai pour ne pas générer une erreur si l'utilisateur n'a pas l'autorisation
   */
  async isAllowed(
    user: AuthUser,
    operation: PermissionOperation,
    resourceType: ResourceType,
    resourceId: number | null,
    doNotThrow?: boolean,
    tx?: Transaction
  ): Promise<boolean> {
    if (user.role === AuthRole.SERVICE_ROLE) {
      // Le service rôle a tous les droits
      return true;
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
        if (doNotThrow) {
          return false;
        }
        throw new ForbiddenException(
          `Droits insuffisants, la clé d'api n'a pas l'autorisation ${operation}.`
        );
      }
    }

    if (!user.id) {
      if (!doNotThrow) {
        this.throwForbiddenException(user, operation, resourceType, resourceId);
      }

      return false;
    }

    const userPermissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: user.id,
        tx,
      });

    if (!userPermissionsResult.success) {
      if (!doNotThrow) {
        this.throwForbiddenException(user, operation, resourceType, resourceId);
      }

      return false;
    }

    const hasPermissionResult = hasPermission(
      userPermissionsResult.data,
      operation,
      resourceType === ResourceType.COLLECTIVITE && resourceId
        ? { collectiviteId: resourceId }
        : resourceType === ResourceType.AUDIT && resourceId
        ? { auditId: resourceId }
        : undefined
    );

    if (!hasPermissionResult) {
      this.logger.log(
        `L'utilisateur ${user.id} ne possède pas l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId}`
      );
      if (!doNotThrow) {
        this.throwForbiddenException(user, operation, resourceType, resourceId);
      }
    } else {
      this.logger.log(
        `L'utilisateur ${user.id} possède l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId}`
      );
    }

    return hasPermissionResult;
  }
}
