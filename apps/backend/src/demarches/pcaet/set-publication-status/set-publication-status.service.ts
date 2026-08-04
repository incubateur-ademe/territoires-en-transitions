import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  canPublishDemarchePcaetStatus,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import { DemarchePcaetGuardsService } from '../shared/demarche-pcaet-guards.service';
import { DemarchePcaetRefRepository } from '../shared/demarche-pcaet-ref.repository';
import {
  SetPublicationStatusError,
  SetPublicationStatusErrorEnum,
} from './set-publication-status.errors';
import { SetPublicationStatusInput } from './set-publication-status.input';
import { SetPublicationStatusRepository } from './set-publication-status.repository';

@Injectable()
export class SetPublicationStatusService {
  private readonly logger = new Logger(SetPublicationStatusService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly demarchePcaetRefRepository: DemarchePcaetRefRepository,
    private readonly setPublicationStatusRepository: SetPublicationStatusRepository,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository,
    private readonly guardsService: DemarchePcaetGuardsService
  ) {}

  /**
   * La publication est une visibilité, pas une étape du cycle de vie : elle
   * n'est permise qu'une fois le PCAET adopté (statut porté par le workflow).
   */
  async setPublicationStatus(
    input: SetPublicationStatusInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, SetPublicationStatusError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<DemarchePcaet, SetPublicationStatusError>> => {
      const demarche = await this.demarchePcaetRefRepository.findRef(
        input,
        { forUpdate: true },
        transaction
      );
      if (!demarche) {
        return failure(SetPublicationStatusErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
      }

      const permissionResult = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
        ResourceType.COLLECTIVITE,
        { collectiviteId: demarche.collectiviteId },
        transaction
      );
      if (!permissionResult.success) {
        return failure(SetPublicationStatusErrorEnum.UNAUTHORIZED);
      }

      if (!canPublishDemarchePcaetStatus(demarche.status)) {
        return failure(SetPublicationStatusErrorEnum.DEMARCHE_NON_PUBLIABLE);
      }

      const updateResult =
        await this.setPublicationStatusRepository.updatePublicationStatus(
          demarche,
          input.publicationStatus,
          user.id,
          transaction
        );
      if (!updateResult.success) {
        return failure(SetPublicationStatusErrorEnum.DATABASE_ERROR);
      }

      this.logger.log(
        `Publication status of demarche PCAET ${demarche.id} set to ${input.publicationStatus} by user ${user.id}`
      );

      const getResult = await this.getDemarchePcaetRepository.getDemarchePcaet(
        { demarcheId: demarche.id, collectiviteId: demarche.collectiviteId },
        transaction
      );
      if (!getResult.success) {
        return failure(SetPublicationStatusErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
      }
      return {
        success: true,
        data: this.guardsService.enrich(getResult.data, user),
      };
    };

    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(executeInTransaction);
  }
}
