import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
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
    { user, isUserTrusted = false, tx }: ServiceSecondArg
  ): Promise<Result<TagWithCollectiviteId, MutateTagError>> {
    const unauthorized = await this.checkPermission(
      user,
      input.collectiviteId,
      'create',
      isUserTrusted
    );
    if (unauthorized) {
      return failure(unauthorized);
    }

    return this.mutateTagRepository.createTag(
      {
        ...input,
        createdBy: user.id,
      },
      tx
    );
  }

  async updateTag(
    input: UpdateTagInput,
    { user, isUserTrusted = false, tx }: ServiceSecondArg
  ): Promise<Result<TagWithCollectiviteId, MutateTagError>> {
    const unauthorized = await this.checkPermission(
      user,
      input.collectiviteId,
      'update',
      isUserTrusted
    );
    if (unauthorized) {
      return failure(unauthorized);
    }

    return this.mutateTagRepository.updateTag(input, tx);
  }

  async deleteTag(
    input: DeleteTagInput,
    { user, isUserTrusted = false, tx }: ServiceSecondArg
  ): Promise<Result<void, MutateTagError>> {
    const unauthorized = await this.checkPermission(
      user,
      input.collectiviteId,
      'delete',
      isUserTrusted
    );
    if (unauthorized) {
      return failure(unauthorized);
    }

    return this.mutateTagRepository.deleteTag(input, tx);
  }

  private async checkPermission(
    user: ServiceSecondArg['user'],
    collectiviteId: number,
    action: 'create' | 'update' | 'delete',
    isUserTrusted: boolean
  ): Promise<MutateTagError | undefined> {
    if (isUserTrusted) return;

    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.TAGS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    if (!isAllowed) {
      this.logger.log(
        `User ${user.id} is not allowed to ${action} tags for collectivité ${collectiviteId}`
      );
      return MutateTagErrorEnum.UNAUTHORIZED;
    }
  }
}
