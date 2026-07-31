import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PermissionService,
  type ReferentielPermissionOperation,
} from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Discussion, DiscussionMessage } from '@tet/domain/collectivites';
import {
  getReferentielIdFromActionId,
  ReferentielId,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DiscussionDomainService } from '../domain/discussion-domain-service';
import {
  DiscussionError,
  DiscussionErrorEnum,
} from '../domain/discussion.errors';
import { ListDiscussionService } from '../domain/list-discussion-service';
import { type DiscussionRepository } from '../infrastructure/discussion-repository.interface';
import { DiscussionResult } from '../infrastructure/discussion.results';
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
    @Inject('DiscussionRepository')
    private readonly discussionRepository: DiscussionRepository,
    private readonly logger: Logger
  ) {}

  // SÉCURITÉ (pentest V2 / ORHUS-302) : ces helpers vérifient que la ressource
  // existante (discussion ou message) appartient bien à la `collectiviteId`
  // déclarée dans le payload avant toute mutation. Sans ce contrôle, un
  // utilisateur ayant des droits sur sa propre collectivité pouvait manipuler
  // les discussions/messages d'une autre collectivité en passant simplement
  // leur identifiant.
  private async assertDiscussionInCollectivite(
    discussionId: number,
    collectiviteId: number
  ): Promise<DiscussionResult<Discussion, DiscussionError>> {
    const result = await this.discussionRepository.findById(discussionId);
    if (!result.success) {
      return result;
    }
    if (result.data.collectiviteId !== collectiviteId) {
      // On renvoie volontairement un NOT_FOUND plutôt qu'un FORBIDDEN pour
      // ne pas confirmer l'existence d'une discussion étrangère.
      return { success: false, error: DiscussionErrorEnum.NOT_FOUND };
    }
    return { success: true, data: result.data };
  }

  private async assertMessageInCollectivite(
    messageId: number,
    collectiviteId: number
  ): Promise<DiscussionResult<Discussion, DiscussionError>> {
    const result = await this.discussionRepository.findDiscussionByMessageId(
      messageId
    );
    if (!result.success) {
      return result;
    }
    if (result.data.collectiviteId !== collectiviteId) {
      return { success: false, error: DiscussionErrorEnum.NOT_FOUND };
    }
    return { success: true, data: result.data };
  }

  private getReferentielIdFromActionIdOrFailure(
    actionId: string
  ): DiscussionResult<ReferentielId, DiscussionError> {
    try {
      return {
        success: true,
        data: getReferentielIdFromActionId(actionId),
      };
    } catch {
      return { success: false, error: DiscussionErrorEnum.BAD_REQUEST };
    }
  }

  private async checkDiscussionReferentielPermission(
    user: AuthUser,
    operation: ReferentielPermissionOperation,
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<DiscussionResult<void, DiscussionError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      operation,
      ResourceType.REFERENTIEL,
      {
        collectiviteId,
        referentielId,
      }
    );

    if (!permissionResult.success) {
      if (permissionResult.error === 'REFERENTIEL_NOT_WRITABLE') {
        return { success: false, error: DiscussionErrorEnum.FORBIDDEN };
      }
      this.logger.error(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation ${operation} sur le référentiel ${referentielId} de la collectivité ${collectiviteId}`
      );
      return { success: false, error: DiscussionErrorEnum.UNAUTHORIZED };
    }

    return { success: true, data: undefined };
  }

  async createDiscussion(
    discussion: CreateDiscussionRequest,
    user: AuthUser
  ): Promise<DiscussionResult<CreateDiscussionResponse, DiscussionError>> {
    const referentielIdResult = this.getReferentielIdFromActionIdOrFailure(
      discussion.actionId
    );
    if (!referentielIdResult.success) {
      return referentielIdResult;
    }

    const permissionCheck = await this.checkDiscussionReferentielPermission(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.MUTATE'],
      discussion.collectiviteId,
      referentielIdResult.data
    );
    if (!permissionCheck.success) {
      return permissionCheck;
    }

    if (discussion.discussionId) {
      const check = await this.assertDiscussionInCollectivite(
        discussion.discussionId,
        discussion.collectiviteId
      );
      if (!check.success) {
        return check;
      }
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
  ): Promise<DiscussionResult<void, DiscussionError>> {
    const { collectiviteId, discussionId } = input;
    const ownershipCheck = await this.assertDiscussionInCollectivite(
      discussionId,
      collectiviteId
    );
    if (!ownershipCheck.success) {
      return ownershipCheck;
    }

    const referentielIdResult = this.getReferentielIdFromActionIdOrFailure(
      ownershipCheck.data.actionId
    );
    if (!referentielIdResult.success) {
      return referentielIdResult;
    }

    const permissionCheck = await this.checkDiscussionReferentielPermission(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.MUTATE'],
      collectiviteId,
      referentielIdResult.data
    );
    if (!permissionCheck.success) {
      return permissionCheck;
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
  ): Promise<DiscussionResult<void, DiscussionError>> {
    const { collectiviteId, messageId, discussionId } = input;
    const ownershipCheck = await this.assertMessageInCollectivite(
      messageId,
      collectiviteId
    );
    if (!ownershipCheck.success) {
      return ownershipCheck;
    }

    const referentielIdResult = this.getReferentielIdFromActionIdOrFailure(
      ownershipCheck.data.actionId
    );
    if (!referentielIdResult.success) {
      return referentielIdResult;
    }

    const permissionCheck = await this.checkDiscussionReferentielPermission(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.MUTATE'],
      collectiviteId,
      referentielIdResult.data
    );
    if (!permissionCheck.success) {
      return permissionCheck;
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
  ): Promise<DiscussionResult<DiscussionsMessagesListType, DiscussionError>> {
    const { collectiviteId, referentielId, filters, options } = input;
    this.logger.log(
      `Lister les discussions pour la collectivité ${collectiviteId} referentiel ${referentielId} ${
        filters ? ` avec les filtres ${filters}` : ''
      } ${options ? ` avec les options ${options}` : ''}`
    );
    const permissionCheck = await this.checkDiscussionReferentielPermission(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.READ'],
      collectiviteId,
      referentielId
    );
    if (!permissionCheck.success) {
      return permissionCheck;
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
  ): Promise<DiscussionResult<Discussion, DiscussionError>> {
    const { collectiviteId, discussionId, status } = input;
    const ownershipCheck = await this.assertDiscussionInCollectivite(
      discussionId,
      collectiviteId
    );
    if (!ownershipCheck.success) {
      return ownershipCheck;
    }

    const referentielIdResult = this.getReferentielIdFromActionIdOrFailure(
      ownershipCheck.data.actionId
    );
    if (!referentielIdResult.success) {
      return referentielIdResult;
    }

    const permissionCheck = await this.checkDiscussionReferentielPermission(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.MUTATE'],
      collectiviteId,
      referentielIdResult.data
    );
    if (!permissionCheck.success) {
      return permissionCheck;
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
  ): Promise<DiscussionResult<DiscussionMessage, DiscussionError>> {
    const { collectiviteId, messageId, message } = input;
    const ownershipCheck = await this.assertMessageInCollectivite(
      messageId,
      collectiviteId
    );
    if (!ownershipCheck.success) {
      return ownershipCheck;
    }

    const referentielIdResult = this.getReferentielIdFromActionIdOrFailure(
      ownershipCheck.data.actionId
    );
    if (!referentielIdResult.success) {
      return referentielIdResult;
    }

    const permissionCheck = await this.checkDiscussionReferentielPermission(
      user,
      PermissionOperationEnum['REFERENTIELS.DISCUSSIONS.MUTATE'],
      collectiviteId,
      referentielIdResult.data
    );
    if (!permissionCheck.success) {
      return permissionCheck;
    }

    const result = await this.discussionDomainService.updateDiscussionMessage(
      messageId,
      message
    );
    return result;
  }
}
