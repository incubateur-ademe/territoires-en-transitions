import { PermissionService } from '@/backend/users/authorizations/permission.service';
import {
  PermissionOperationEnum,
  ResourceType,
} from '@/backend/users/index-domain';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { DiscussionDomainService } from '../domain/discussion-domain-service';
import {
  CreateDiscussionData,
  CreateDiscussionRequest,
  CreateDiscussionResponse,
  DiscussionError,
  DiscussionErrorEnum,
  Result,
} from '../domain/discussion.type';

@Injectable()
export class DiscussionApplicationService {
  constructor(
    private readonly discussionDomainService: DiscussionDomainService,
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly logger: Logger
  ) {}

  async insertDiscussionMessage(
    request: CreateDiscussionRequest,
    user: AuthUser
  ): Promise<Result<CreateDiscussionResponse, DiscussionError>> {
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.LECTURE'],
      ResourceType.COLLECTIVITE,
      request.collectiviteId
    );
    if (!hasPermission) {
      this.logger.error(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation create discussion sur la ressource Collectivité ${request.collectiviteId}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED as DiscussionError,
      };
    }

    const result: Result<CreateDiscussionResponse, DiscussionError> =
      await this.databaseService.db.transaction(async (tx) => {
        const newDiscussionResult = await this.discussionDomainService.insert(
          this.toDiscussionData(request, user),
          tx
        );
        if (!newDiscussionResult.success) {
          return newDiscussionResult;
        }
        return {
          success: true,
          data: newDiscussionResult.data,
        };
      });

    return result;
  }

  private toDiscussionData = (
    discussionRequest: CreateDiscussionRequest,
    user: AuthUser
  ): CreateDiscussionData => {
    return {
      ...discussionRequest,
      discussionId: discussionRequest.discussionId,
      createdBy: user.id || '',
    };
  };
}
