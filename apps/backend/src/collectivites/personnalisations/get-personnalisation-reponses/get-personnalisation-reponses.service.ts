import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { PersonnalisationReponse } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import {
  GetPersonnalisationReponsesErrorEnum,
  type GetPersonnalisationReponsesError,
} from './get-personnalisation-reponses.errors';
import type { GetPersonnalisationReponsesInput } from './get-personnalisation-reponses.input';
import { GetPersonnalisationReponsesRepository } from './get-personnalisation-reponses.repository';

@Injectable()
export class GetPersonnalisationReponsesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly getPersonnalisationReponsesRepository: GetPersonnalisationReponsesRepository
  ) {}

  async getPersonnalisationReponses(
    input: GetPersonnalisationReponsesInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<
    Result<PersonnalisationReponse[], GetPersonnalisationReponsesError>
  > {
    const { collectiviteId } = input;

    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<
      Result<PersonnalisationReponse[], GetPersonnalisationReponsesError>
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
          error: GetPersonnalisationReponsesErrorEnum.UNAUTHORIZED,
        };
      }

      return this.getPersonnalisationReponsesRepository.getReponses(
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
