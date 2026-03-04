import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { InferSelectModel } from 'drizzle-orm';
import { reponseBinaireTable } from '../models/reponse-binaire.table';
import { reponseChoixTable } from '../models/reponse-choix.table';
import { reponseProportionTable } from '../models/reponse-proportion.table';
import {
  SetPersonnalisationReponseError,
  SetPersonnalisationReponseErrorEnum,
} from './set-personnalisation-reponse.errors';
import { SetPersonnalisationReponseInput } from './set-personnalisation-reponse.input';
import { SetPersonnalisationReponseRepository } from './set-personnalisation-reponse.repository';

type ReponseBinaireType = InferSelectModel<typeof reponseBinaireTable>;
type ReponseProportionType = InferSelectModel<typeof reponseProportionTable>;
type ReponseChoixType = InferSelectModel<typeof reponseChoixTable>;

type PersonnalisationReponseType =
  | ReponseBinaireType
  | ReponseProportionType
  | ReponseChoixType;

@Injectable()
export class SetPersonnalisationReponseService {
  private readonly logger = new Logger(SetPersonnalisationReponseService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly setPersonalisationReponseRepository: SetPersonnalisationReponseRepository
  ) {}

  async setPersonnalisationReponse(
    input: SetPersonnalisationReponseInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<
    Result<PersonnalisationReponseType, SetPersonnalisationReponseError>
  > {
    const { collectiviteId } = input;

    // vérifie les permissions d'écriture sur la collectivité
    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!isAllowed) {
      return {
        success: false,
        error: SetPersonnalisationReponseErrorEnum.UNAUTHORIZED,
      };
    }

    const executeInTransaction = async (transaction: Transaction) => {
      return this.setPersonalisationReponseRepository.setReponse(
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
