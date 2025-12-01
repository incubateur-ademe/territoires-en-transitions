import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Discussion, DiscussionMessage } from '@tet/domain/collectivites';
import { PermissionOperationEnum } from '@tet/domain/users';
import { DiscussionDomainService } from '../domain/discussion-domain-service';
import {
  DiscussionError,
  DiscussionErrorEnum,
} from '../domain/discussion.errors';
import { ListDiscussionService } from '../domain/list-discussion-service';
import { Result } from '../infrastructure/discussion.results';
import {
  CreateDiscussionData,
  CreateDiscussionRequest,
  CreateDiscussionResponse,
  DeleteDiscussionAndDiscussionMessageRequest,
  DeleteDiscussionMessageRequest,
  DiscussionsMessagesListType,
  ListDiscussionsRequest,
  UpdateDiscussionMessageRequest,
  UpdateDiscussionRequest,
} from '../presentation/discussion.schemas';

@Injectable()
export class DiscussionApplicationService {
  constructor(
    private readonly discussionDomainService: DiscussionDomainService,
    private readonly listDiscussionService: ListDiscussionService,
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly logger: Logger
  ) {}

  async createDiscussion(
    discussion: CreateDiscussionRequest,
    user: AuthUser
  ): Promise<Result<CreateDiscussionResponse, DiscussionError>> {
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.MUTATE'],
      ResourceType.COLLECTIVITE,
      discussion.collectiviteId,
      true
    );
    if (!hasPermission) {
      this.logger.error(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation create discussion sur la ressource Collectivité ${discussion.collectiviteId}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };
    }

    this.logger.log(
      `Créer une discussion pour la collectivité ${
        discussion.collectiviteId
      } actionId ${discussion.actionId} (${JSON.stringify(discussion)})`
    );

    const result = await this.databaseService.db.transaction(async (tx) => {
      return await this.discussionDomainService.createOrUpdateDiscussion(
        this.toDiscussionData(discussion, user),
        tx
      );
    });

    return result;
  }

  async deleteDiscussionAndDiscussionMessage(
    input: DeleteDiscussionAndDiscussionMessageRequest,
    user: AuthUser
  ): Promise<Result<void, DiscussionError>> {
    const { collectiviteId, discussionId } = input;
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!hasPermission) {
      this.logger.error(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation supprimer le message de discussion sur la ressource Collectivité ${collectiviteId}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };
    }
    const discussionMessageResult =
      await this.discussionDomainService.deleteDiscussionAndDiscussionMessage(
        discussionId
      );
    return discussionMessageResult;
  }

  async deleteDiscussionMessage(
    input: DeleteDiscussionMessageRequest,
    user: AuthUser
  ): Promise<Result<void, DiscussionError>> {
    const { collectiviteId, messageId, discussionId } = input;
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );

    if (!hasPermission) {
      this.logger.error(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation supprimer le message de discussion sur la ressource Collectivité ${collectiviteId}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };
    }
    const discussionMessageResult =
      await this.discussionDomainService.deleteDiscussionMessage(
        messageId,
        discussionId
      );
    return discussionMessageResult;
  }

  async listDiscussionsWithMessages(
    input: ListDiscussionsRequest,
    user: AuthUser
  ): Promise<Result<DiscussionsMessagesListType, DiscussionError>> {
    const { collectiviteId, referentielId, filters, options } = input;
    this.logger.log(
      `Lister les discussions pour la collectivité ${collectiviteId} referentiel ${referentielId} ${
        filters ? ` avec les filtres ${filters}` : ''
      } ${options ? ` avec les options ${options}` : ''}`
    );
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.READ'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!hasPermission) {
      this.logger.error(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation lister les discussions sur la ressource Collectivité ${collectiviteId}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };
    }

    const discussionsResult = await this.listDiscussionService.listDiscussions(
      collectiviteId,
      referentielId,
      filters,
      options
    );
    if (!discussionsResult.success) {
      return {
        success: false,
        error: discussionsResult.error,
      };
    }
    return discussionsResult;
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

  async updateDiscussion(
    input: UpdateDiscussionRequest,
    user: AuthUser
  ): Promise<Result<Discussion, DiscussionError>> {
    const { collectiviteId, discussionId, status } = input;
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!hasPermission) {
      this.logger.error(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation mettre à jour la discussion sur la ressource Collectivité ${collectiviteId}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };
    }
    const result = await this.discussionDomainService.updateDiscussion(
      discussionId,
      status
    );
    return result;
  }

  async updateDiscussionMessage(
    input: UpdateDiscussionMessageRequest,
    user: AuthUser
  ): Promise<Result<DiscussionMessage, DiscussionError>> {
    const { collectiviteId, messageId, message } = input;
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!hasPermission) {
      this.logger.error(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation mettre à jour le message de discussion sur la ressource Collectivité ${collectiviteId}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };
    }
    const result = await this.discussionDomainService.updateDiscussionMessage(
      messageId,
      message
    );
    return result;
  }
}
