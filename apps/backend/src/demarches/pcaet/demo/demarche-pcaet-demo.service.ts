import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { GetUserRolesAndPermissionsService } from '@tet/backend/users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  collectiviteTypeEnum,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import { isDemarchePcaetDemo } from '@tet/domain/demarches';
import { hasRole, PlatformRole } from '@tet/domain/users';
import { and, eq, isNull, or } from 'drizzle-orm';

/**
 * Services instructeurs fictifs, créés à la première transmission de démo :
 * sans territoire, aucune vraie transmission ne les atteint. Pas de migration :
 * jouée sur une base vide, elle prendrait les premiers ids, que les seeds
 * attendent pour leurs collectivités.
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

  /** Les services fictifs, créés au passage s'ils n'existent pas encore. */
  async ensureServicesDemo(
    tx?: Transaction
  ): Promise<{ id: number; type: string }[]> {
    const db = tx ?? this.databaseService.db;
    const existants = await this.listServicesDemo(tx);
    const manquants = SERVICES_DEMO.filter(
      (service) =>
        !existants.some(
          (existant) =>
            existant.nom === service.nom && existant.type === service.type
        )
    );
    if (manquants.length === 0) {
      return existants;
    }
    const crees = await db
      .insert(collectiviteTable)
      .values(
        manquants.map((service) => ({
          ...service,
          preferences: defaultCollectivitePreferences,
        }))
      )
      .returning({
        id: collectiviteTable.id,
        nom: collectiviteTable.nom,
        type: collectiviteTable.type,
      });
    return [...existants, ...crees];
  }

  async listServicesDemo(
    tx?: Transaction
  ): Promise<{ id: number; nom: string; type: string }[]> {
    return (tx ?? this.databaseService.db)
      .select({
        id: collectiviteTable.id,
        nom: collectiviteTable.nom,
        type: collectiviteTable.type,
      })
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
