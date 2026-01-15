import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import { TagWithCollectiviteId } from '@tet/domain/collectivites';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { MutateTagError, MutateTagErrorEnum } from './mutate-tag.errors';
import {
  CreateTagInput,
  DeleteTagInput,
  UpdateTagInput,
} from './mutate-tag.input';
import { MutateTagRepository } from './mutate-tag.repository';

@Injectable()
export class MutateTagService {
  private readonly logger = new Logger(MutateTagService.name);

  constructor(
    private readonly mutateTagRepository: MutateTagRepository,
    private readonly permissionService: PermissionService
  ) {}

  async createTag(
    input: CreateTagInput,
    { user, tx }: { user?: AuthenticatedUser; tx?: Transaction }
  ): Promise<Result<TagWithCollectiviteId, MutateTagError>> {
    if (user) {
      const isAllowed = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['COLLECTIVITES.TAGS.MUTATE'],
        ResourceType.COLLECTIVITE,
        input.collectiviteId
      );

      if (!isAllowed) {
        this.logger.log(
          `User ${user.id} is not allowed to create tags for collectivité ${input.collectiviteId}`
        );
        return failure(MutateTagErrorEnum.UNAUTHORIZED);
      }
    }

    return this.mutateTagRepository.createTag(input, tx);
  }

  async updateTag(
    input: UpdateTagInput,
    { user, tx }: { user?: AuthenticatedUser; tx?: Transaction }
  ): Promise<Result<TagWithCollectiviteId, MutateTagError>> {
    if (user) {
      const isAllowed = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['COLLECTIVITES.TAGS.MUTATE'],
        ResourceType.COLLECTIVITE,
        input.collectiviteId
      );

      if (!isAllowed) {
        this.logger.log(
          `User ${user.id} is not allowed to update tags for collectivité ${input.collectiviteId}`
        );
        return failure(MutateTagErrorEnum.UNAUTHORIZED);
      }
    }

    return this.mutateTagRepository.updateTag(input, tx);
  }

  async deleteTag(
    input: DeleteTagInput,
    { user, tx }: { user?: AuthenticatedUser; tx?: Transaction }
  ): Promise<Result<void, MutateTagError>> {
    if (user) {
      const isAllowed = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['COLLECTIVITES.TAGS.MUTATE'],
        ResourceType.COLLECTIVITE,
        input.collectiviteId
      );

      if (!isAllowed) {
        this.logger.log(
          `User ${user.id} is not allowed to delete tags for collectivité ${input.collectiviteId}`
        );
        return failure(MutateTagErrorEnum.UNAUTHORIZED);
      }
    }

    return this.mutateTagRepository.deleteTag(input, tx);
  }
}
