import { Injectable } from '@nestjs/common';
import { RecherchesCollectivite } from '@tet/backend/collectivites/recherches/collectivites.response';
import { FiltersRequest } from '@tet/backend/collectivites/recherches/filters.request';
import { RecherchesPlan } from '@tet/backend/collectivites/recherches/plans.response';
import { RecherchesReferentiel } from '@tet/backend/collectivites/recherches/referentiels.response';
import { GetUserRolesAndPermissionsService } from '@tet/backend/users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { hasRole, PlatformRole } from '@tet/domain/users';
import { RecherchesRepository } from './recherches.repository';

@Injectable()
export default class RecherchesService {
  constructor(
    private readonly recherchesRepository: RecherchesRepository,
    private readonly getUserRolesAndPermissions: GetUserRolesAndPermissionsService
  ) {}

  async collectivites(
    filters: FiltersRequest,
    { user }: { user: AuthenticatedUser }
  ): Promise<{ count: number; items: RecherchesCollectivite[] }> {
    return this.withContactsFor(
      user,
      this.recherchesRepository.listCollectivites(filters)
    );
  }

  async referentiels(
    filters: FiltersRequest,
    { user }: { user: AuthenticatedUser }
  ): Promise<{ count: number; items: RecherchesReferentiel[] }> {
    return this.withContactsFor(
      user,
      this.recherchesRepository.listReferentiels(filters)
    );
  }

  async plans(
    filters: FiltersRequest,
    { user }: { user: AuthenticatedUser }
  ): Promise<{ count: number; items: RecherchesPlan[] }> {
    return this.withContactsFor(
      user,
      this.recherchesRepository.listPlans(filters)
    );
  }

  /**
   * Les contacts (nom, e-mail, téléphone) sont réservés aux utilisateurs
   * vérifiés et membres actifs d'au moins une collectivité, ainsi qu'au
   * support, aux super-admins et à l'ADEME. Les entrées sans rôle (auditeur
   * seulement) ne valent pas appartenance.
   */
  private async canSeeContacts(user: AuthenticatedUser): Promise<boolean> {
    const result =
      await this.getUserRolesAndPermissions.getUserRolesAndPermissions({
        userId: user.id,
      });
    if (!result.success) {
      return false;
    }
    const roles = result.data;
    const hasPlatformAccess = [
      PlatformRole.SUPPORT,
      PlatformRole.SUPER_ADMIN,
      PlatformRole.ADEME,
    ].some((role) => hasRole(roles, role));
    return (
      hasPlatformAccess ||
      (hasRole(roles, PlatformRole.VERIFIED) &&
        roles.collectivites.some((c) => c.role !== null))
    );
  }

  private async withContactsFor<T extends { contacts: unknown[] }>(
    user: AuthenticatedUser,
    pagePromise: Promise<{ count: number; items: T[] }>
  ): Promise<{ count: number; items: T[] }> {
    const [page, canSeeContacts] = await Promise.all([
      pagePromise,
      this.canSeeContacts(user),
    ]);
    if (canSeeContacts) {
      return page;
    }
    return {
      ...page,
      items: page.items.map((item) => ({ ...item, contacts: [] })),
    };
  }
}
