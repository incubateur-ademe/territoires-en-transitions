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
  DiscussionList,
  DiscussionListResponse,
  ListDiscussionsRequestFilters,
  QueryOptionsType,
  ReferentielEnum,
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

  async deleteDiscussionMessage(
    discussionMessageId: number,
    collectiviteId: number,
    user: AuthUser
  ): Promise<Result<void, DiscussionError>> {
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );
    if (!hasPermission) {
      this.logger.error(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation supprimer le message de discussion sur la ressource Collectivité ${collectiviteId}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED as DiscussionError,
      };
    }
    const result: Result<void, DiscussionError> =
      await this.databaseService.db.transaction(async (tx) => {
        const discussionMessageResult =
          await this.discussionDomainService.deleteDiscussionMessage(
            discussionMessageId
          );
        return discussionMessageResult;
      });
    return result;
  }

  async listDiscussionsWithMessages(
    {
      collectiviteId,
      referentielId,
      filters,
      options,
    }: {
      collectiviteId: number;
      referentielId: ReferentielEnum;
      filters?: ListDiscussionsRequestFilters;
      options?: QueryOptionsType;
    },
    user: AuthUser
  ): Promise<Result<DiscussionListResponse, DiscussionError>> {
    this.logger.log(
      `Fetching detailed discussions for collectivité ${collectiviteId} referentiel ${referentielId} ${
        filters ? ` with filters ${filters}` : ''
      } ${options ? ` with options ${options}` : ''}`
    );
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );
    if (!hasPermission) {
      this.logger.error(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation lister les discussions sur la ressource Collectivité ${collectiviteId}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED as DiscussionError,
      };
    }

    const result: Result<
      {
        data: DiscussionList[];
        count: number;
      },
      DiscussionError
    > = await this.databaseService.db.transaction(async (tx) => {
      const discussionsResult = await this.discussionDomainService.list(
        collectiviteId,
        referentielId,
        filters,
        options
      );
      return discussionsResult;
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
