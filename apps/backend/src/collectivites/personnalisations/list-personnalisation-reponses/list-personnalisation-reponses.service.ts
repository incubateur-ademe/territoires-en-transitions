import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { PersonnalisationReponse } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import {
  ListPersonnalisationReponsesErrorEnum,
  type ListPersonnalisationReponsesError,
} from './list-personnalisation-reponses.errors';
import type { ListPersonnalisationReponsesInput } from './list-personnalisation-reponses.input';
import { ListPersonnalisationReponsesRepository } from './list-personnalisation-reponses.repository';

@Injectable()
export class ListPersonnalisationReponsesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly listPersonnalisationReponsesRepository: ListPersonnalisationReponsesRepository
  ) {}

  async listPersonnalisationReponses(
    input: ListPersonnalisationReponsesInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<
    Result<PersonnalisationReponse[], ListPersonnalisationReponsesError>
  > {
    const { collectiviteId } = input;

    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<
      Result<PersonnalisationReponse[], ListPersonnalisationReponsesError>
    > => {
      const isAllowed = await this.permissionService.isAllowed(
        user,
        'referentiels.read',
        ResourceType.COLLECTIVITE,
        collectiviteId,
        true,
        transaction
      );
      if (!isAllowed) {
        return {
          success: false,
          error: ListPersonnalisationReponsesErrorEnum.UNAUTHORIZED,
        };
      }

      return this.listPersonnalisationReponsesRepository.listReponses(
        input,
        transaction
      );
    };

    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(async (newTx) =>
          executeInTransaction(newTx)
        );
  }
}
