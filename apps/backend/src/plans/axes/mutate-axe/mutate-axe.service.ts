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
import { MutateAxeInput } from './mutate-axe.input';
import { MutateAxeRepository } from './mutate-axe.repository';

@Injectable()
export class MutateAxeService {
  private readonly logger = new Logger(MutateAxeService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly mutateAxeRepository: MutateAxeRepository,
    private readonly databaseService: DatabaseService
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
      const { indicateurs, ...axeProps } = axe;

      const result =
        'id' in axeProps
          ? await this.mutateAxeRepository.update(
              axeProps,
              user.id,
              transaction
            )
          : await this.mutateAxeRepository.create(
              axeProps,
              user.id,
              transaction
            );

      if (!result.success) {
        return result;
      }

      if (indicateurs === null || indicateurs) {
        const setIndicateursResult =
          await this.mutateAxeRepository.setIndicateurs(
            result.data.id,
            indicateurs,
            transaction
          );
        if (!setIndicateursResult.success) {
          return setIndicateursResult;
        }
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
