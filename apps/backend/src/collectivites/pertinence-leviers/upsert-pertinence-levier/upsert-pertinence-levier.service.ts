import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { canCategoriesHaveOwnPertinence } from '@tet/domain/collectivites';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { EnjeuPertinencesRepositories } from '../enjeu-pertinences.repositories';
import {
  PertinenceLeviersErrorEnum,
  type PertinenceLeviersError,
} from '../pertinence-leviers.errors';
import {
  LevierPertinenceTarget,
  PertinenceLeviersRepository,
} from '../pertinence-leviers.repository';
import { UpsertPertinenceLevierInput } from './upsert-pertinence-levier.input';

type CollectivitePertinenceLevier = Omit<UpsertPertinenceLevierInput, 'enjeu'>;

@Injectable()
export class UpsertPertinenceLevierService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly permissions: PermissionService,
    private readonly enjeuPertinencesRepositories: EnjeuPertinencesRepositories
  ) {}

  async upsertPertinence(
    { enjeu, ...collectivitePertinence }: UpsertPertinenceLevierInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, PertinenceLeviersError>> {
    const { collectiviteId } = collectivitePertinence;

    return this.transactionManager.executeSingle(async (transaction) => {
      const permissionResult = await this.permissions.isAllowed(
        user,
        PermissionOperationEnum['COLLECTIVITES.PERTINENCE-LEVIERS.MUTATE'],
        ResourceType.COLLECTIVITE,
        { collectiviteId },
        transaction
      );
      if (!permissionResult.success) {
        return failure(PertinenceLeviersErrorEnum.UNAUTHORIZED);
      }

      const pertinencesRepository =
        this.enjeuPertinencesRepositories.pertinencesOf(enjeu);

      const consistencyResult =
        await this.ensureCategoriePertinencesFollowLevier(
          pertinencesRepository,
          collectivitePertinence,
          transaction
        );
      if (!consistencyResult.success) {
        return failure(consistencyResult.error);
      }

      const upsertResult = await pertinencesRepository.upsert({
        ...collectivitePertinence,
        modifiedBy: user.id,
        tx: transaction,
      });
      if (!upsertResult.success) {
        return failure(upsertResult.error);
      }

      return success(undefined);
    }, tx);
  }

  private async ensureCategoriePertinencesFollowLevier(
    pertinencesRepository: PertinenceLeviersRepository,
    {
      collectiviteId,
      levierId,
      categorie,
      pertinence,
    }: CollectivitePertinenceLevier,
    tx: Transaction
  ): Promise<Result<void, PertinenceLeviersError>> {
    if (categorie !== undefined) {
      return this.validateLevierAdmitsCategoriePertinence(
        pertinencesRepository,
        { collectiviteId, levierId, tx }
      );
    }

    const levierAdmitsCategoriePertinence =
      canCategoriesHaveOwnPertinence(pertinence);
    if (levierAdmitsCategoriePertinence) {
      return success(undefined);
    }
    return pertinencesRepository.deleteCategoriePertinences({
      collectiviteId,
      levierId,
      tx,
    });
  }

  private async validateLevierAdmitsCategoriePertinence(
    pertinencesRepository: PertinenceLeviersRepository,
    target: LevierPertinenceTarget
  ): Promise<Result<void, PertinenceLeviersError>> {
    const levierPertinenceResult =
      await pertinencesRepository.getLevierPertinence(target);
    if (!levierPertinenceResult.success) {
      return failure(levierPertinenceResult.error);
    }

    const levierAdmitsCategoriePertinence = canCategoriesHaveOwnPertinence(
      levierPertinenceResult.data
    );
    if (levierAdmitsCategoriePertinence) {
      return success(undefined);
    }
    return failure(PertinenceLeviersErrorEnum.CATEGORIE_PERTINENCE_NOT_ALLOWED);
  }
}
