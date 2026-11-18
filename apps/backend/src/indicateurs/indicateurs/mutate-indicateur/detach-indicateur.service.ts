import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import {
  DetachIndicateurError,
  DetachIndicateurErrorEnum,
} from './detach-indicateur.errors';
import { DetachIndicateurInput } from './mutate-indicateur.input';
import { MutateIndicateurRepository } from './mutate-indicateur.repository';
import { UpdateIndicateurService } from './update-indicateur.service';

@Injectable()
export class DetachIndicateurService {
  private readonly logger = new Logger(DetachIndicateurService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly repository: MutateIndicateurRepository,
    private readonly updateIndicateurService: UpdateIndicateurService,
    private readonly indicateurLockRepository: IndicateurLockRepository,
    private readonly permissionService: PermissionService
  ) {}

  async detachIndicateur(
    { indicateurId, collectiviteId }: DetachIndicateurInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, DetachIndicateurError>> {
    const apiKeyPermissionResult = this.permissionService.isApiKeyAllowed(
      user,
      'indicateurs.indicateurs.update'
    );
    if (!apiKeyPermissionResult.success) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    const canUpdateSousIndicateur =
      await this.updateIndicateurService.canUpdateIndicateur(
        { user, collectiviteId, indicateurId },
        tx
      );
    if (!canUpdateSousIndicateur) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    this.logger.log(
      `Dissocie le sous-indicateur "${indicateurId}" de son parent pour la collectivité "${collectiviteId}"`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      DetachIndicateurError | Error
    >(async (transaction) => {
      await this.indicateurLockRepository.lockForIndicateurMutation(
        transaction
      );

      const sousIndicateur = await this.repository.getIndicateurInGroup(
        { indicateurId, collectiviteId },
        transaction
      );
      const isSousIndicateurOfCollectivite =
        sousIndicateur !== null &&
        sousIndicateur.collectiviteId === collectiviteId;
      if (!isSousIndicateurOfCollectivite) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }
      if (sousIndicateur.parentId === null) {
        return failure(
          DetachIndicateurErrorEnum.INDICATEUR_NOT_SOUS_INDICATEUR
        );
      }

      const canUpdateParent =
        await this.updateIndicateurService.canUpdateIndicateur(
          { user, collectiviteId, indicateurId: sousIndicateur.parentId },
          transaction
        );
      if (!canUpdateParent) {
        return failure(CommonErrorEnum.UNAUTHORIZED);
      }

      await this.repository.detachSousIndicateur(
        {
          parentId: sousIndicateur.parentId,
          sousIndicateurId: indicateurId,
          collectiviteId,
        },
        transaction
      );
      await this.updateIndicateurService.updateIndicateursModifiedFields(
        {
          indicateurIds: [indicateurId, sousIndicateur.parentId],
          collectiviteId,
          user,
        },
        transaction
      );
      return success(undefined);
    }, tx);

    if (transactionResult.success) {
      return success(undefined);
    }
    if (transactionResult.error instanceof Error) {
      throw transactionResult.cause ?? transactionResult.error;
    }
    return failure(transactionResult.error, transactionResult.cause);
  }
}
