import { PermissionOperation } from '@/backend/users/authorizations/permission-operation.enum';
import { permissionsByRole } from '@/backend/users/authorizations/permission.models';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { UserRole } from '@/backend/users/authorizations/roles/role.enum';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { AuthRole, AuthUser } from '../models/auth.models';
import { RoleService } from './roles/role.service';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(private readonly roleService: RoleService) {}

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

  async hasSupportRole(
    user: AuthUser,
    resourceType: ResourceType,
    resourceId: number | null
  ): Promise<boolean> {
    const roles = await this.roleService.getUserRoles(
      user,
      resourceType,
      resourceId
    );
    const hasSupportRole = roles.includes(UserRole.SUPPORT);
    return hasSupportRole;
  }

  async hasADEMERole(
    user: AuthUser,
    resourceType: ResourceType,
    resourceId: number | null
  ): Promise<boolean> {
    const roles = await this.roleService.getUserRoles(
      user,
      resourceType,
      resourceId
    );
    const hasADMERole = roles.includes(UserRole.ADEME);
    return hasADMERole;
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
    doNotThrow?: boolean
  ): Promise<boolean> {
    this.logger.log(
      `Vérification que l'utilisateur ${user.id} possède l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId}`
    );
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

    // Récupère les rôles de l'utilisateur pour la ressource donnée
    const roles = await this.roleService.getUserRoles(
      user,
      resourceType,
      resourceId
    );

    if (roles.length == 0) {
      this.logger.log(
        `L'utilisateur ${user.id} n'a pas de rôles sur la ressource ${resourceType} ${resourceId}`
      );
      if (doNotThrow) {
        return false;
      }
      throw new ForbiddenException(`L'utilisateur n'a pas de rôles`);
    }

    // Récupère les autorisations des rôles de l'utilisateur
    const operations: Set<PermissionOperation> = new Set();
    for (const role of roles) {
      permissionsByRole[role].forEach((permission) =>
        operations.add(permission)
      );
    }

    this.logger.log(
      `L'utilisateur ${user.id} possède les autorisations ${JSON.stringify([
        ...operations,
      ])} sur la ressource ${resourceType} ${resourceId}`
    );

    // Vérifie si l'opération demandée est dans la liste des autorisations de l'utilisateur
    const hasTheRight = operations.has(operation);
    if (!hasTheRight) {
      this.logger.log(
        `L'utilisateur ${user.id} ne possède pas l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId}`
      );
      if (!doNotThrow) {
        throw new ForbiddenException(
          `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId}`
        );
      }
    } else {
      this.logger.log(
        `L'utilisateur ${user.id} possède l'autorisation ${operation} sur la ressource ${resourceType} ${resourceId}`
      );
    }

    return hasTheRight;
  }
}
