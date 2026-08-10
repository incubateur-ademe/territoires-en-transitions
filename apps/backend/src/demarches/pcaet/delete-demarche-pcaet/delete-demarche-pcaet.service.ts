import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import { canDeleteDemarchePcaet } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarchePcaetRefRepository } from '../shared/demarche-pcaet-ref.repository';
import {
  DeleteDemarchePcaetError,
  DeleteDemarchePcaetErrorEnum,
} from './delete-demarche-pcaet.errors';
import { DeleteDemarchePcaetInput } from './delete-demarche-pcaet.input';
import { DeleteDemarchePcaetRepository } from './delete-demarche-pcaet.repository';

@Injectable()
export class DeleteDemarchePcaetService {
  private readonly logger = new Logger(DeleteDemarchePcaetService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly transactionManager: TransactionManager,
    private readonly demarchePcaetRefRepository: DemarchePcaetRefRepository,
    private readonly deleteDemarchePcaetRepository: DeleteDemarchePcaetRepository
  ) {}

  async deleteDemarchePcaet(
    input: DeleteDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<undefined, DeleteDemarchePcaetError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<undefined, DeleteDemarchePcaetError>> => {
      const demarche = await this.demarchePcaetRefRepository.findRef(
        input,
        { forUpdate: true },
        transaction
      );
      if (!demarche) {
        return failure(DeleteDemarchePcaetErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
      }

      const permissionResult = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
        ResourceType.COLLECTIVITE,
        { collectiviteId: demarche.collectiviteId },
        transaction
      );
      if (!permissionResult.success) {
        return failure(DeleteDemarchePcaetErrorEnum.UNAUTHORIZED);
      }

      // Un dossier déjà transmis est engagé dans le circuit d'avis
      // (demandes, instruction) : pas de suppression, même après reprise.
      if (!canDeleteDemarchePcaet(demarche)) {
        return failure(DeleteDemarchePcaetErrorEnum.DEMARCHE_NON_SUPPRIMABLE);
      }

      const deleteResult =
        await this.deleteDemarchePcaetRepository.deleteDemarche(
          demarche,
          transaction
        );
      if (!deleteResult.success) {
        return failure(DeleteDemarchePcaetErrorEnum.DATABASE_ERROR);
      }

      this.logger.log(
        `Demarche PCAET ${demarche.id} deleted (statut ${demarche.status}) by user ${user.id}`
      );
      return { success: true, data: undefined };
    };

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
