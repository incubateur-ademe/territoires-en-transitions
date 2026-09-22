import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { EnjeuPertinencesRepositories } from '../enjeu-pertinences.repositories';
import {
  PertinenceLeviersErrorEnum,
  type PertinenceLeviersError,
} from '../pertinence-leviers.errors';
import { UpsertPertinenceLevierInput } from './upsert-pertinence-levier.input';

@Injectable()
export class UpsertPertinenceLevierService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly permissions: PermissionService,
    private readonly enjeuPertinencesRepositories: EnjeuPertinencesRepositories
  ) {}

  async upsertPertinence(
    { enjeu, ...collectivitePertinence }: UpsertPertinenceLevierInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, PertinenceLeviersError>> {
    return this.transactionManager.executeSingle(async (transaction) => {
      const permissionResult = await this.permissions.isAllowed(
        user,
        PermissionOperationEnum['COLLECTIVITES.PERTINENCE-LEVIERS.MUTATE'],
        ResourceType.COLLECTIVITE,
        { collectiviteId: collectivitePertinence.collectiviteId },
        transaction
      );
      if (!permissionResult.success) {
        return failure(PertinenceLeviersErrorEnum.UNAUTHORIZED);
      }

      const upsertResult = await this.enjeuPertinencesRepositories
        .pertinencesOf(enjeu)
        .upsert({
          ...collectivitePertinence,
          modifiedBy: user.id,
          tx: transaction,
        });
      if (!upsertResult.success) {
        return failure(upsertResult.error);
      }

      return success(undefined);
    }, tx);
  }
}
