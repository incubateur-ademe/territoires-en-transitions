import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { MethodResult } from '@/backend/utils/result.type';
import { Injectable, Logger } from '@nestjs/common';
import { AxeType } from '../../fiches/shared/models/axe.table';
import { MutateAxeError, MutateAxeErrorEnum } from './mutate-axe.errors';
import {
  createAxeSchema,
  MutateAxeInput,
  updateAxeSchema,
} from './mutate-axe.input';
import { MutateAxeRepository } from './mutate-axe.repository';

@Injectable()
export class MutateAxeService {
  private readonly logger = new Logger(MutateAxeService.name);

  constructor(
    private readonly databaseService: DatabaseService,
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

    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<MethodResult<AxeType, MutateAxeError>> => {
      const axeProps = axe;
      const updateAxeProps = updateAxeSchema.safeParse(axeProps);

      let result;
      if (updateAxeProps.success) {
        result = await this.mutateAxeRepository.update(
          updateAxeProps.data,
          user.id,
          transaction
        );
      } else {
        const createAxeProps = createAxeSchema.safeParse(axeProps);
        if (createAxeProps.success) {
          result = await this.mutateAxeRepository.create(
            createAxeProps.data,
            user.id,
            transaction
          );
        }
      }

      if (!result?.success) {
        return (
          result || {
            success: false,
            error: MutateAxeErrorEnum.CREATE_AXE_ERROR,
          }
        );
      }

      return { success: true, data: result.data };
    };

    // Utiliser la transaction fournie ou en crée une nouvelle
    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(async (newTx) =>
          executeInTransaction(newTx)
        );
  }
}
