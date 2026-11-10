import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { GetUserRolesAndPermissionsService } from '@tet/backend/users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { isDemarchePcaetDemo } from '@tet/domain/demarches';
import { hasRole, PlatformRole } from '@tet/domain/users';
import { and, eq, isNull, or } from 'drizzle-orm';

/**
 * Services instructeurs fictifs, créés par la migration
 * `demarche/pcaet_services_demo` : sans territoire, aucune vraie transmission
 * ne les atteint.
 */
export const SERVICES_DEMO = [
  { nom: 'DREAL (démonstration)', type: collectiviteTypeEnum.DREAL },
  { nom: 'Région (démonstration)', type: collectiviteTypeEnum.REGION },
] as const;

@Injectable()
export class DemarchePcaetDemoService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly getUserRolesAndPermissions: GetUserRolesAndPermissionsService
  ) {}

  async isSuperAdmin(
    user: AuthenticatedUser | null,
    tx?: Transaction
  ): Promise<boolean> {
    if (!user) {
      return false;
    }
    const roles =
      await this.getUserRolesAndPermissions.getUserRolesAndPermissions({
        userId: user.id,
        tx,
      });
    return roles.success && hasRole(roles.data, PlatformRole.SUPER_ADMIN);
  }

  /** Double verrou : collectivité de test ET super admin (cf. `isDemarchePcaetDemo`). */
  async isDemo(
    user: AuthenticatedUser | null,
    collectiviteId: number,
    tx?: Transaction
  ): Promise<boolean> {
    const [collectivite] = await (tx ?? this.databaseService.db)
      .select({ type: collectiviteTable.type })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId))
      .limit(1);
    if (collectivite?.type !== collectiviteTypeEnum.TEST) {
      return false;
    }
    return isDemarchePcaetDemo({
      collectiviteType: collectivite.type,
      isSuperAdmin: await this.isSuperAdmin(user, tx),
    });
  }

  async listServicesDemo(
    tx?: Transaction
  ): Promise<{ id: number; type: string }[]> {
    return (tx ?? this.databaseService.db)
      .select({ id: collectiviteTable.id, type: collectiviteTable.type })
      .from(collectiviteTable)
      .where(
        and(
          isNull(collectiviteTable.regionCode),
          or(
            ...SERVICES_DEMO.map((service) =>
              and(
                eq(collectiviteTable.nom, service.nom),
                eq(collectiviteTable.type, service.type)
              )
            )
          )
        )
      );
  }
}
