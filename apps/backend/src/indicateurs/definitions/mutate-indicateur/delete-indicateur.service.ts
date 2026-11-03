import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DeleteIndicateurInput } from '@tet/backend/indicateurs/definitions/mutate-indicateur/mutate-indicateur.input';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ResourceType } from '@tet/domain/users';
import { IndicateurLockRepository } from '../indicateur-lock.repository';
import { MutateIndicateurRepository } from './mutate-indicateur.repository';

@Injectable()
export class DeleteIndicateurService {
  private readonly logger = new Logger(DeleteIndicateurService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly repository: MutateIndicateurRepository,
    private readonly permissionService: PermissionService,
    private readonly indicateurLockRepository: IndicateurLockRepository
  ) {}

  /**
   * Supprime un indicateur pour une collectivité
   */
  async deleteIndicateurPerso(
    { indicateurId, collectiviteId }: DeleteIndicateurInput,
    user: AuthUser
  ): Promise<void> {
    // Vérification des permissions
    await this.permissionService.assertAllowed(
      user,
      'indicateurs.indicateurs.delete',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    this.logger.log(
      `Suppression de l'indicateur dont l'id est ${indicateurId} pour la collectivité ${collectiviteId}`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      boolean,
      unknown
    >(async (tx) => {
      await this.indicateurLockRepository.lockForIndicateurMutation(tx);
      return success(
        await this.repository.deleteIndicateurPerso(
          { indicateurId, collectiviteId },
          tx
        )
      );
    });

    if (!transactionResult.success) {
      throw transactionResult.cause ?? transactionResult.error;
    }

    if (!transactionResult.data) {
      throw new NotFoundException(
        `Indicateur ${indicateurId} non trouvé pour la collectivité ${collectiviteId}`
      );
    }

    this.logger.log(
      `Indicateur ${indicateurId} supprimé avec succès pour la collectivité ${collectiviteId}`
    );
  }
}
