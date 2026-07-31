import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  HistoriqueUtilisateur,
  ListHistoriqueUtilisateurInput,
} from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { ListHistoriqueUtilisateurRepository } from './list-historique-utilisateur.repository';

@Injectable()
export class ListHistoriqueUtilisateurService {
  constructor(
    private readonly listHistoriqueUtilisateurRepository: ListHistoriqueUtilisateurRepository,
    private readonly permissions: PermissionService,
    private readonly collectivites: CollectivitesService
  ) {}

  async listHistoriqueUtilisateur(
    { collectiviteId }: ListHistoriqueUtilisateurInput,
    user: AuthenticatedUser
  ): Promise<HistoriqueUtilisateur[]> {
    const collectivitePrivate = await this.collectivites.isPrivate(
      collectiviteId
    );
    await this.permissions.assertAllowed(
      user,
      collectivitePrivate
        ? 'collectivites.read_confidentiel'
        : 'collectivites.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    return this.listHistoriqueUtilisateurRepository.listContributors(
      collectiviteId
    );
  }
}
