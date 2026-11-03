import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Thematique } from '@tet/domain/shared';
import { ResourceType } from '@tet/domain/users';
import { UpsertIndicateurThematiquesRepository } from './upsert-indicateur-thematiques.repository';

@Injectable()
export class UpsertIndicateurThematiquesService {
  private readonly logger = new Logger(UpsertIndicateurThematiquesService.name);

  constructor(
    private readonly repository: UpsertIndicateurThematiquesRepository,
    private readonly permissionService: PermissionService,
    private readonly transactionManager: TransactionManager
  ) {}

  async listIndicateurThematiques({
    indicateurId,
    collectiviteId,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    user: AuthUser;
  }): Promise<Thematique[]> {
    await this.permissionService.assertAllowed(
      user,
      'indicateurs.indicateurs.read_confidentiel',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    this.logger.log(
      `Récupération des thematiques de l'indicateur dont l'id est ${indicateurId}`
    );

    return this.repository.listIndicateurThematiques(indicateurId);
  }

  async upsertIndicateurThematiques(
    {
      indicateurId,
      thematiqueIds,
    }: {
      indicateurId: number;
      thematiqueIds: number[];
    },
    tx?: Transaction
  ): Promise<void> {
    this.logger.log(
      `Mise à jour des thematiques de l'indicateur dont l'id est ${indicateurId}`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      unknown
    >(async (transaction) => {
      await this.repository.upsertIndicateurThematiques(
        { indicateurId, thematiqueIds },
        transaction
      );
      return success(undefined);
    }, tx);

    if (!transactionResult.success) {
      throw transactionResult.cause ?? transactionResult.error;
    }
  }
}
