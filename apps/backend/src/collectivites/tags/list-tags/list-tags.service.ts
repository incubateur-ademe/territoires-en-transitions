import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum } from '@tet/domain/users';
import { ListTagsError, ListTagsErrorEnum } from './list-tags.errors';
import { ListTagsInput } from './list-tags.input';
import { ListTagsOutput } from './list-tags.output';
import { ListTagsRepository } from './list-tags.repository';

@Injectable()
export class ListTagsService {
  private readonly logger = new Logger(ListTagsService.name);

  constructor(
    private readonly listTagsRepository: ListTagsRepository,
    private readonly permissionService: PermissionService
  ) {}

  async listTags(
    input: ListTagsInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<ListTagsOutput, ListTagsError>> {
    // Check permission for single collectivite or first collectivite in array
    const collectiviteIdToCheck = input.collectiviteId ?? input.collectiviteIds?.[0];
    
    if (!collectiviteIdToCheck) {
      return {
        success: false,
        error: ListTagsErrorEnum.LIST_TAGS_ERROR,
      };
    }

    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.TAGS.READ'],
      ResourceType.COLLECTIVITE,
      collectiviteIdToCheck
    );

    if (!isAllowed) {
      this.logger.log(
        `User ${user.id} is not allowed to list tags for collectivité ${collectiviteIdToCheck}`
      );
      return {
        success: false,
        error: ListTagsErrorEnum.UNAUTHORIZED,
      };
    }

    return this.listTagsRepository.listTags(input, tx);
  }
}
