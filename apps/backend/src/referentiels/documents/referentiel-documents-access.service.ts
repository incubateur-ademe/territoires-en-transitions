import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ReferentielId } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';

@Injectable()
export class ReferentielDocumentsAccessService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly collectivitesService: CollectivitesService
  ) {}

  async checkUserCanReadDocuments(
    {
      collectiviteId,
      referentielId,
    }: { collectiviteId: number; referentielId: ReferentielId },
    { user, tx }: ServiceSecondArg
  ): Promise<Result<{ canReadConfidentiel: boolean }, 'UNAUTHORIZED'>> {
    const isCollectivitePrivate = await this.collectivitesService.isPrivate(
      collectiviteId
    );

    const [readResult, readConfidentielResult] = await Promise.all([
      this.permissions.isAllowed(
        user,
        isCollectivitePrivate
          ? 'referentiels.read_confidentiel'
          : 'referentiels.read',
        ResourceType.REFERENTIEL,
        { collectiviteId, referentielId },
        tx
      ),
      this.permissions.isAllowed(
        user,
        'collectivites.documents.read_confidentiel',
        ResourceType.COLLECTIVITE,
        { collectiviteId },
        tx
      ),
    ]);

    if (!readResult.success) {
      return failure('UNAUTHORIZED');
    }

    return success({ canReadConfidentiel: readConfidentielResult.success });
  }
}
