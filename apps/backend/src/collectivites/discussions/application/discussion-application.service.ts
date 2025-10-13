import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { UserRole } from '@/backend/users/authorizations/roles/role.enum';
import { RoleService } from '@/backend/users/authorizations/roles/role.service';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { DiscussionDomainService } from '../domain/discussion-domain-service';
import {
  DiscussionError,
  DiscussionErrorEnum,
} from '../domain/discussion.errors';
import { QueryOptionsType } from '../domain/discussion.query-options';
import {
  CreateDiscussionData,
  CreateDiscussionResponse,
  DiscussionMessages,
  ReferentielEnum,
} from '../domain/discussion.types';
import { ListDiscussionService } from '../domain/list-discussion-service';
import { Result } from '../infrastructure/discussion.results';
import { DiscussionType } from '../infrastructure/discussion.tables';
import {
  CreateDiscussionRequest,
  DeleteDiscussionAndDiscussionMessageRequest,
  ListDiscussionsRequestFilters,
  UpdateDiscussionRequest,
} from '../presentation/discussion.schemas';

@Injectable()
export class DiscussionApplicationService {
  constructor(
    private readonly discussionDomainService: DiscussionDomainService,
    private readonly listDiscussionService: ListDiscussionService,
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly roleService: RoleService,
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
    const roles = await this.roleService.getUserRoles(
      user,
      ResourceType.COLLECTIVITE,
      discussion.collectiviteId
    );

    const hasSupportRole = roles.includes(UserRole.SUPPORT);
    const hasADMERole = roles.includes(UserRole.ADEME);

    if (hasSupportRole || hasADMERole) {
      this.logger.error(
        `L'utilisateur ${user.id} avec le rôle Support ou ADEME ne peut pas créer une discussion sur la collectivité ${discussion.collectiviteId}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };
    }

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
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };
    }
    const discussionMessageResult =
      await this.discussionDomainService.deleteDiscussionAndDiscussionMessage(
        discussionId
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
  ): Promise<Result<DiscussionMessages[], DiscussionError>> {
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
  ): Promise<Result<DiscussionType, DiscussionError>> {
    const { collectiviteId, discussionId, status } = input;
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
