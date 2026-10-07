import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { ResourceType } from '@tet/domain/users';

@Injectable()
export class CollectiviteDocumentsAccessService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly collectivitesService: CollectivitesService
  ) {}

  async checkUserCanReadDocuments(
    { collectiviteId }: { collectiviteId: number },
    { user, tx }: ServiceSecondArg
  ): Promise<Result<{ canReadConfidentiel: boolean }, 'UNAUTHORIZED'>> {
    const [readResult, readConfidentielResult] = await Promise.all([
      this.permissionService.isAllowed(
        user,
        'collectivites.documents.read',
        ResourceType.COLLECTIVITE,
        { collectiviteId },
        tx
      ),
      this.permissionService.isAllowed(
        user,
        'collectivites.documents.read_confidentiel',
        ResourceType.COLLECTIVITE,
        { collectiviteId },
        tx
      ),
    ]);

    const canReadConfidentiel = readConfidentielResult.success;
    const hasNoDocumentsReadRight = !readResult.success && !canReadConfidentiel;
    if (hasNoDocumentsReadRight) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    const isAccesRestreint = await this.collectivitesService.isPrivate(
      collectiviteId
    );

    const canReachCollectivite = isAccesRestreint
      ? canReadConfidentiel
      : readResult.success;
    if (!canReachCollectivite) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    return success({ canReadConfidentiel });
  }
}
