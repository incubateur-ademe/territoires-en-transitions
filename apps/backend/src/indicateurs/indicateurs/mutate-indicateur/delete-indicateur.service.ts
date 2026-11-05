import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DeleteIndicateurInput } from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/mutate-indicateur.input';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { listSousIndicateursBecomingAutonomous } from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
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

  async listSousIndicateursBecomingAutonomous(
    { indicateurId, collectiviteId }: DeleteIndicateurInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<number[], 'UNAUTHORIZED'>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      'indicateurs.indicateurs.delete',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure('UNAUTHORIZED');
    }

    const sousIndicateurs = await this.repository.listSousIndicateurs(
      { parentId: indicateurId, collectiviteId },
      tx
    );

    return success(
      listSousIndicateursBecomingAutonomous({
        parentId: indicateurId,
        indicateurs: sousIndicateurs,
      }).map(({ id }) => id)
    );
  }

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
