import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ServiceTag } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { HandleDefinitionServicesRepository } from './handle-definition-services.repository';

@Injectable()
export class HandleDefinitionServicesService {
  private readonly logger = new Logger(HandleDefinitionServicesService.name);

  constructor(
    private readonly repository: HandleDefinitionServicesRepository,
    private readonly permissionService: PermissionService,
    private readonly transactionManager: TransactionManager
  ) {}

  async listIndicateurServices({
    indicateurId,
    collectiviteId,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    user: AuthUser;
  }): Promise<ServiceTag[]> {
    await this.permissionService.assertAllowed(
      user,
      'indicateurs.indicateurs.read_confidentiel',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    this.logger.log(
      `Récupération des services pilotes de l'indicateur dont l'id est ${indicateurId}`
    );

    return this.repository.listIndicateurServices({
      indicateurId,
      collectiviteId,
    });
  }

  async upsertIndicateurServices(
    {
      indicateurId,
      collectiviteId,
      serviceIds,
    }: {
      indicateurId: number;
      collectiviteId: number;
      serviceIds: number[];
    },
    tx?: Transaction
  ): Promise<void> {
    this.logger.log(
      `Mise à jour des servicespilotes de l'indicateur dont l'id est ${indicateurId}`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      unknown
    >(async (transaction) => {
      const servicesBelongToCollectivite =
        await this.repository.areServicesOwnedByCollectivite(
          serviceIds,
          collectiviteId,
          transaction
        );
      if (!servicesBelongToCollectivite) {
        throw new BadRequestException(
          `Tous les services doivent appartenir à la collectivité ${collectiviteId}`
        );
      }

      await this.repository.upsertIndicateurServices(
        { indicateurId, collectiviteId, serviceIds },
        transaction
      );
      return success(undefined);
    }, tx);

    if (!transactionResult.success) {
      throw transactionResult.cause ?? transactionResult.error;
    }
  }
}
