import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  UpdateActionDeReferenceInput,
  UpdateActionDeReferenceOutput,
} from '@tet/domain/shared';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import {
  ActionsDeReferenceErrorEnum,
  UpdateActionDeReferenceError,
} from '../actions-de-reference.errors';
import { ActionsDeReferenceRepository } from '../actions-de-reference.repository';

type UpdateActionDeReference = (
  input: UpdateActionDeReferenceInput,
  secondArg: ServiceSecondArg
) => Promise<
  Result<UpdateActionDeReferenceOutput, UpdateActionDeReferenceError>
>;

@Injectable()
export class UpdateActionDeReferenceService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly permissions: PermissionService,
    private readonly repository: ActionsDeReferenceRepository
  ) {}

  updateAction: UpdateActionDeReference = ({ id, ...changes }, { user, tx }) =>
    this.transactionManager.executeSingle(async (transaction) => {
      const permissionResult = await this.permissions.isAllowed(
        user,
        PermissionOperationEnum['SHARED.ACTIONS-DE-REFERENCE.MUTATE'],
        ResourceType.PLATEFORME,
        null,
        transaction
      );
      if (!permissionResult.success) {
        return failure(ActionsDeReferenceErrorEnum.UNAUTHORIZED);
      }

      return this.repository.update({ id, changes, tx: transaction });
    }, tx);
}
