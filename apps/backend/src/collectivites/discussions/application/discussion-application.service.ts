import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { DiscussionDomainService } from '../domain/discussion-domain-service';
import {
  CreateDiscussionData,
  CreateDiscussionRequest,
  CreateDiscussionResponse,
  Discussion,
  DiscussionError,
  DiscussionErrorEnum,
  DiscussionStatut,
  DiscussionType,
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

  async createDiscussion(
    discussion: CreateDiscussionRequest,
    user: AuthUser
  ): Promise<Result<CreateDiscussionResponse, DiscussionError>> {
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.LECTURE'],
      ResourceType.COLLECTIVITE,
      discussion.collectiviteId
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
      return await this.discussionDomainService.insert(
        this.toDiscussionData(discussion, user),
        tx
      );
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
    const discussionMessageResult =
      await this.discussionDomainService.deleteDiscussionMessage(
        discussionMessageId
      );
    return discussionMessageResult;
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
  ): Promise<Result<Discussion, DiscussionError>> {
    this.logger.log(
      `Lister les discussions pour la collectivité ${collectiviteId} referentiel ${referentielId} ${
        filters ? ` avec les filtres ${filters}` : ''
      } ${options ? ` avec les options ${options}` : ''}`
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

    const discussionsResult = await this.discussionDomainService.list(
      collectiviteId,
      referentielId,
      filters,
      options
    );

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
    discussionId: number,
    status: DiscussionStatut,
    collectiviteId: number,
    user: AuthUser
  ): Promise<Result<DiscussionType, DiscussionError>> {
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
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
}
