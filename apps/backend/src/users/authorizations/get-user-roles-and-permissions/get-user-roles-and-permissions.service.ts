import { Injectable, NotFoundException } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { UserRolesAndPermissions } from '@tet/domain/users';
import { toUserRolesAndPermissions } from './get-user-roles-and-permissions.adapter';
import { GetUserRolesAndPermissionsRepository } from './get-user-roles-and-permissions.repository';

@Injectable()
export class GetUserRolesAndPermissionsService {
  constructor(
    private readonly getUserPermissionsRepository: GetUserRolesAndPermissionsRepository
  ) {}

  async getUserRolesAndPermissions({
    userId,
    tx,
  }: {
    userId: string;
    tx?: Transaction;
  }): Promise<Result<UserRolesAndPermissions, NotFoundException>> {
    const platformRoles =
      await this.getUserPermissionsRepository.getPlatformRoles(userId, tx);

    if (!platformRoles) {
      return {
        success: false,
        error: new NotFoundException(`Utilisateur ${userId} non trouvé`),
      };
    }

    const [collectiviteRoles, auditRoles] = await Promise.all([
      this.getUserPermissionsRepository.getCollectiviteRoles({ userId }),
      this.getUserPermissionsRepository.getAuditRoles({ userId }),
    ]);

    const userPermissions = toUserRolesAndPermissions({
      platformRolesRow: platformRoles,
      collectiviteRolesRows: collectiviteRoles,
      auditRolesRows: auditRoles,
    });

    return {
      success: true,
      data: userPermissions,
    };
  }
}
