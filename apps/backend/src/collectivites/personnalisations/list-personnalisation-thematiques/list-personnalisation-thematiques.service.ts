import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { PersonnalisationThematique } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { ListPersonnalisationThematiquesRepository } from './list-personnalisation-thematiques.repository';

@Injectable()
export class ListPersonnalisationThematiquesService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly collectiviteService: CollectivitesService,
    private readonly listThematiquesRepository: ListPersonnalisationThematiquesRepository
  ) {}

  async listThematiques(
    collectiviteId: number,
    user: AuthenticatedUser
  ): Promise<PersonnalisationThematique[]> {
    const collectivitePrivate = await this.collectiviteService.isPrivate(
      collectiviteId
    );

    await this.permissionService.isAllowed(
      user,
      collectivitePrivate
        ? 'referentiels.read_confidentiel'
        : 'referentiels.read',
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    return this.databaseService.db.transaction(async (tx) =>
      this.listThematiquesRepository.listByCollectiviteId(collectiviteId, tx)
    );
  }
}
