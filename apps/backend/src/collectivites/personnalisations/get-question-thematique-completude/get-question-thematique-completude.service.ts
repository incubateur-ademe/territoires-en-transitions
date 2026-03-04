import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ResourceType } from '@tet/domain/users';
import type { QuestionThematiqueCompletude } from '@tet/domain/collectivites';
import { GetQuestionThematiqueCompletudeRepository } from './get-question-thematique-completude.repository';

@Injectable()
export class GetQuestionThematiqueCompletudeService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly collectiviteService: CollectivitesService,
    private readonly getQuestionThematiqueCompletudeRepository: GetQuestionThematiqueCompletudeRepository
  ) {}

  async getQuestionThematiqueCompletude(
    collectiviteId: number,
    user: AuthenticatedUser
  ): Promise<QuestionThematiqueCompletude[]> {
    const collectivitePrivate =
      await this.collectiviteService.isPrivate(collectiviteId);

    await this.permissionService.isAllowed(
      user,
      collectivitePrivate
        ? 'referentiels.read_confidentiel'
        : 'referentiels.read',
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    return this.getQuestionThematiqueCompletudeRepository.listByCollectiviteId(
      collectiviteId,
      user
    );
  }
}
