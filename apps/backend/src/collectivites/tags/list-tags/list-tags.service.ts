import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { TagWithCollectiviteId } from '@tet/domain/collectivites';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { ListTagsError, ListTagsErrorEnum } from './list-tags.errors';
import { ListTagsInput } from './list-tags.input';
import { ListTagsRepository } from './list-tags.repository';

@Injectable()
export class ListTagsService {
  constructor(
    private readonly listTagsRepository: ListTagsRepository,
    private readonly permissionService: PermissionService
  ) {}

  async listTags(
    { collectiviteId, tagType }: ListTagsInput,
    { user, tx }: { user?: AuthenticatedUser; tx?: Transaction }
  ): Promise<Result<TagWithCollectiviteId[], ListTagsError>> {
    if (user) {
      const canReadTags = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['COLLECTIVITES.TAGS.READ'],
        ResourceType.COLLECTIVITE,
        collectiviteId,
        true
      );

      if (!canReadTags) {
        return {
          success: false,
          error: ListTagsErrorEnum.UNAUTHORIZED,
        };
      }
    }

    return this.listTagsRepository.listTags({ collectiviteId, tagType }, tx);
  }
}
