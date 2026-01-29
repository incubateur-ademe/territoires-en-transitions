import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { AxeLight } from '@tet/domain/plans';
import { PermissionOperationEnum } from '@tet/domain/users';
import { UpsertAxeError, UpsertAxeErrorEnum } from './upsert-axe.errors';
import {
  baseUpdateAxeSchema,
  createAxeSchema,
  UpsertAxeInput,
} from './upsert-axe.input';
import { UpsertAxeRepository } from './upsert-axe.repository';

@Injectable()
export class UpsertAxeService {
  private readonly logger = new Logger(UpsertAxeService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly upsertAxeRepository: UpsertAxeRepository
  ) {}

  async upsertAxe(
    axe: UpsertAxeInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<AxeLight, UpsertAxeError>> {
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
        error: UpsertAxeErrorEnum.UNAUTHORIZED,
      };
    }

    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<AxeLight, UpsertAxeError>> => {
      const { indicateurs, ...axeProps } = axe;
      const updateAxeProps = baseUpdateAxeSchema.safeParse(axeProps);

      let result;
      if (updateAxeProps.success) {
        result = await this.upsertAxeRepository.update(
          updateAxeProps.data,
          user.id,
          transaction
        );
      } else {
        const createAxeProps = createAxeSchema.safeParse(axeProps);
        if (createAxeProps.success) {
          result = await this.upsertAxeRepository.create(
            createAxeProps.data,
            user.id,
            transaction
          );
        } else {
          this.logger.log(
            `Parsing error detected ${createAxeProps.error.message}`
          );
          return { success: false, error: UpsertAxeErrorEnum.CREATE_AXE_ERROR };
        }
      }

      if (!result?.success) {
        return (
          result || {
            success: false,
            error: UpsertAxeErrorEnum.UPDATE_AXE_ERROR,
          }
        );
      }

      if (indicateurs === null || indicateurs) {
        const setIndicateursResult =
          await this.upsertAxeRepository.setIndicateurs(
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
