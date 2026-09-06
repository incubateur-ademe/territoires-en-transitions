import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DeleteIndicateurDefinitionInput } from '@tet/backend/indicateurs/definitions/mutate-definition/mutate-definition.input';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ResourceType } from '@tet/domain/users';
import { IndicateurDefinitionLockRepository } from '../indicateur-definition-lock.repository';
import { MutateDefinitionRepository } from './mutate-definition.repository';

@Injectable()
export class DeleteDefinitionService {
  private readonly logger = new Logger(DeleteDefinitionService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly repository: MutateDefinitionRepository,
    private readonly permissionService: PermissionService,
    private readonly definitionLockRepository: IndicateurDefinitionLockRepository
  ) {}

  /**
   * Supprime un indicateur pour une collectivité
   */
  async deleteIndicateurPerso(
    { indicateurId, collectiviteId }: DeleteIndicateurDefinitionInput,
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
      await this.definitionLockRepository.lockForDefinitionMutation(tx);
      return success(
        await this.repository.deletePersonalizedDefinition(
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
