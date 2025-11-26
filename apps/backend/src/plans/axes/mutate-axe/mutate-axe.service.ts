import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { MethodResult } from '@/backend/utils/result.type';
import { Injectable, Logger } from '@nestjs/common';
import { AxeType } from '../../fiches/shared/models/axe.table';
import { MutateAxeError, MutateAxeErrorEnum } from './mutate-axe.errors';
import { MutateAxeInput } from './mutate-axe.input';
import { MutateAxeRepository } from './mutate-axe.repository';

@Injectable()
export class MutateAxeService {
  private readonly logger = new Logger(MutateAxeService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly mutateAxeRepository: MutateAxeRepository
  ) {}

  async mutateAxe(
    axe: MutateAxeInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<MethodResult<AxeType, MutateAxeError>> {
    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.MUTATE'],
      ResourceType.COLLECTIVITE,
      axe.collectiviteId,
      true
    );
    if (!isAllowed) {
      return {
        success: false,
        error: MutateAxeErrorEnum.UNAUTHORIZED,
      };
    }

    const result =
      'id' in axe
        ? await this.mutateAxeRepository.update(axe, user.id, tx)
        : await this.mutateAxeRepository.create(axe, user.id, tx);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }
    return { success: true, data: result.data };
  }
}
