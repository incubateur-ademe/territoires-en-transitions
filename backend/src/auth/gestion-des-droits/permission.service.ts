import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthRole, AuthUser } from '../models/auth.models';
import { RoleService } from './roles/role.service';
import { Authorization } from '@/backend/auth/gestion-des-droits/authorization.enum';
import { ResourceType } from '@/backend/auth/gestion-des-droits/resource-type.enum';
import { Permission } from '@/backend/auth/gestion-des-droits/permission.models';
import { Role } from '@/backend/auth/gestion-des-droits/roles/role.enum';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(private readonly roleService: RoleService) {}

  /**
   * Vérifie l'autorisation de l'utilisateur sur une ressource
   * @param user
   * @param authorization
   * @param resourceType type de la ressource
   * @param resourceId identifiant de la ressource, null si resourceType = PLATEFORME
   * @param doNotThrow vrai pour ne pas générer une erreur si l'utilisateur n'a pas l'autorisation
   */
  async hasTheRightTo(
    user: AuthUser,
    authorization: Authorization,
    resourceType: ResourceType,
    resourceId: number | null,
    doNotThrow?: boolean
  ): Promise<boolean> {
    this.logger.log(
      `Vérification que l'utilisateur ${user.id} possède l'autorisation ${authorization} sur la ressource ${resourceType} ${resourceId}`
    );
    if (user.role === AuthRole.SERVICE_ROLE) {
      // Le service rôle à tous les droits
      return true;
    }

    // Récupère les rôles de l'utilisateur pour la ressource donnée
    const roles = await this.roleService.getUserRolesForAResource(
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
      throw new UnauthorizedException(`L'utilisateur n'a pas de rôles`);
    }

    // Récupère les autorisations des rôles de l'utilisateur
    const authorizations: Set<Authorization> = new Set();
    for (const role of roles) {
      Permission[role as Role].forEach((permission) =>
        authorizations.add(permission)
      );
    }

    this.logger.log(
      `L'utilisateur ${user.id} possède les autorisations ${JSON.stringify([
        ...authorizations,
      ])} sur la ressource ${resourceType} ${resourceId}`
    );

    // Vérifie si l'autorisation demandée est dans la liste des autorisations de l'utilisateur
    const hasTheRight = authorizations.has(authorization);
    if (!hasTheRight) {
      this.logger.log(
        `L'utilisateur ${user.id} ne possède pas l'autorisation ${authorization} sur la ressource ${resourceType} ${resourceId}`
      );
      if(!doNotThrow){
        throw new UnauthorizedException(
          `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation ${authorization} sur la ressource ${resourceType} ${resourceId}`
        );
      }
    }else{
      this.logger.log(
        `L'utilisateur ${user.id} possède l'autorisation ${authorization} sur la ressource ${resourceType} ${resourceId}`
      );
    }

    return hasTheRight;
  }
}
