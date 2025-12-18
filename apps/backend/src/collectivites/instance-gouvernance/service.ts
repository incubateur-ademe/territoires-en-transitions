import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { InstanceGouvernance } from '@tet/domain/collectivites';
import { PermissionOperationEnum } from '@tet/domain/users';
import { InstanceGouvernanceRepository } from './repository';
import { Result } from './result';

@Injectable()
export class InstanceGouvernanceService {
  constructor(
    private readonly instanceGouvernanceRepository: InstanceGouvernanceRepository,
    private readonly permissionService: PermissionService,
    private readonly logger: Logger
  ) {}

  async create(request: {
    nom: string;
    actionId: number;
    collectiviteId: number;
    user: AuthenticatedUser;
  }): Promise<Result<InstanceGouvernance>> {
    const isAllowed = await this.permissionService.isAllowed(
      request.user,
      PermissionOperationEnum['PLANS.FICHES.UPDATE'],
      ResourceType.COLLECTIVITE,
      request.collectiviteId
    );
    if (!isAllowed) {
      return {
        success: false,
        error: CommonErrorEnum.UNAUTHORIZED,
      };
    }
    const result = await this.instanceGouvernanceRepository.create({
      nom: request.nom,
      actionId: request.actionId,
      collectiviteId: request.collectiviteId,
      userId: request.user.id,
    });
    if (result.success === false) {
      this.logger.error({
        ctx: request,
        ...result,
      });
    }
    return result;
  }
  async list(request: {
    collectiviteId: number;
    user: AuthenticatedUser;
  }): Promise<Result<InstanceGouvernance[]>> {
    const isAllowed = await this.permissionService.isAllowed(
      request.user,
      PermissionOperationEnum['PLANS.FICHES.READ'],
      ResourceType.COLLECTIVITE,
      request.collectiviteId
    );
    if (!isAllowed) {
      return {
        success: false,
        error: CommonErrorEnum.UNAUTHORIZED,
      };
    }
    return this.instanceGouvernanceRepository.list(request.collectiviteId);
  }
  async delete(args: {
    id: number;
    user: AuthenticatedUser;
    collectiviteId: number;
  }): Promise<Result<boolean>> {
    const isAllowed = await this.permissionService.isAllowed(
      args.user,
      PermissionOperationEnum['PLANS.FICHES.UPDATE'],
      ResourceType.COLLECTIVITE,
      args.collectiviteId
    );
    if (!isAllowed) {
      return {
        success: false,
        error: CommonErrorEnum.UNAUTHORIZED,
      };
    }
    return this.instanceGouvernanceRepository.delete(args.id);
  }

  async update(args: {
    id: number;
    user: AuthenticatedUser;
    collectiviteId: number;
    nom: string;
  }): Promise<Result<InstanceGouvernance>> {
    const isAllowed = await this.permissionService.isAllowed(
      args.user,
      PermissionOperationEnum['PLANS.FICHES.UPDATE'],
      ResourceType.COLLECTIVITE,
      args.collectiviteId
    );
    if (!isAllowed) {
      return {
        success: false,
        error: CommonErrorEnum.UNAUTHORIZED,
      };
    }
    return this.instanceGouvernanceRepository.update(args.id, args.nom);
  }
}
