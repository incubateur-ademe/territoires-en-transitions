import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  canDeleteDemarchePcaet,
  isDemarchePcaetSuppressionForcee,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarchePcaetExportsStorageService } from '../exports/demarche-pcaet-exports-storage.service';
import { DemarchePcaetDemoService } from '../demo/demarche-pcaet-demo.service';
import {
  DemarchePcaetRefRepository,
  type DemarchePcaetRef,
} from '../shared/demarche-pcaet-ref.repository';
import {
  DemarchePcaetActeurEnum,
  DemarchePcaetEventEnum,
} from '../shared/tracking/demarche-pcaet-tracking.constants';
import { DemarchePcaetTrackingService } from '../shared/tracking/demarche-pcaet-tracking.service';
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
    private readonly deleteDemarchePcaetRepository: DeleteDemarchePcaetRepository,
    private readonly trackingService: DemarchePcaetTrackingService,
    private readonly demoService: DemarchePcaetDemoService,
    private readonly exportsStorageService: DemarchePcaetExportsStorageService
  ) {}

  async deleteDemarchePcaet(
    input: DeleteDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<undefined, DeleteDemarchePcaetError>> {
    let deleted: DemarchePcaetRef | undefined;
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

      // Passé l'élaboration, le dossier est engagé dans le circuit d'avis
      // (demandes, instruction) : seul le super admin le supprime encore.
      const isSuperAdmin = await this.demoService.isSuperAdmin(
        user,
        transaction
      );
      if (!canDeleteDemarchePcaet(demarche, { isSuperAdmin })) {
        return failure(DeleteDemarchePcaetErrorEnum.DEMARCHE_NON_SUPPRIMABLE);
      }
      const isForcee = isDemarchePcaetSuppressionForcee(demarche);

      const deleteResult =
        await this.deleteDemarchePcaetRepository.deleteDemarche(
          demarche,
          { avecSaisines: isForcee },
          transaction
        );
      if (!deleteResult.success) {
        return failure(DeleteDemarchePcaetErrorEnum.DATABASE_ERROR);
      }

      deleted = demarche;
      this.logger.log(
        `Demarche PCAET ${demarche.id} deleted (statut ${demarche.status}${
          isForcee ? ', suppression forcée par un super admin' : ''
        }) by user ${user.id}`
      );
      return { success: true, data: undefined };
    };

    const result = await this.transactionManager.executeSingle(
      executeInTransaction,
      tx
    );
    if (result.success && deleted) {
      // Suppose que ce service possède sa transaction (pas de `tx` englobant) :
      // un rollback ultérieur ferait revenir les lignes sans leurs fichiers.
      // La cascade a retiré les lignes de suivi des classeurs figés, pas les
      // fichiers, qui contiennent des fiches restreintes. Une fois la
      // suppression acquise seulement, et au mieux : un échec est journalisé.
      await this.exportsStorageService.removeAll(deleted.id);
      this.trackingService.track(DemarchePcaetEventEnum.SUPPRIMEE, deleted, {
        userId: user.id,
        acteur: DemarchePcaetActeurEnum.COLLECTIVITE,
      });
    }
    return result;
  }
}
