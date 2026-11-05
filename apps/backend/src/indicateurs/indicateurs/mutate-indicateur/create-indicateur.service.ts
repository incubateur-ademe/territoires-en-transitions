import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  validateSousIndicateurPerso,
  type IndicateurInGroup,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { UpsertIndicateurFichesService } from '../upsert-indicateur-fiches/upsert-indicateur-fiches.service';
import { CreateIndicateurError } from './create-indicateur.errors';
import { CreateIndicateurInput } from './mutate-indicateur.input';
import { MutateIndicateurRepository } from './mutate-indicateur.repository';

type IndicateurShape = Readonly<{
  unite: string;
  periodicite: IndicateurPeriodicite;
  parent: IndicateurInGroup | null;
}>;

@Injectable()
export default class CreateIndicateurService {
  private readonly logger = new Logger(CreateIndicateurService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly repository: MutateIndicateurRepository,
    private readonly permissionService: PermissionService,
    private readonly indicateurLockRepository: IndicateurLockRepository,
    private readonly upsertIndicateurFichesService: UpsertIndicateurFichesService
  ) {}

  async createIndicateurPerso(
    input: CreateIndicateurInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<number, CreateIndicateurError>> {
    const { collectiviteId } = input;

    const permissionResult = await this.permissionService.isAllowed(
      user,
      'indicateurs.indicateurs.create',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    if (!permissionResult.success) {
      return failure('UNAUTHORIZED');
    }

    this.logger.log(
      `Insère un indicateur personnalisé pour la collectivité "${collectiviteId}"`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      number,
      CreateIndicateurError | Error
    >(async (transaction) => {
      await this.indicateurLockRepository.lockForIndicateurMutation(
        transaction
      );

      const shapeResult = await this.resolveIndicateurShape(input, transaction);
      if (!shapeResult.success) {
        return failure(shapeResult.error);
      }
      const { unite, periodicite, parent } = shapeResult.data;

      const createdResult = await this.repository.createIndicateurPerso(
        {
          collectiviteId,
          titre: input.titre,
          unite,
          periodicite,
          thematiqueIds: input.thematiques.map(({ id }) => id),
          commentaire: input.commentaire,
          estFavori: input.estFavori,
          estConfidentiel: input.estConfidentiel,
          isApplicable: input.isApplicable,
          modifiedBy: user.id,
        },
        transaction
      );
      if (!createdResult.success) {
        return failure(createdResult.error, createdResult.cause);
      }
      const indicateurId = createdResult.data;

      if (parent) {
        const validation = validateSousIndicateurPerso({
          parent,
          child: {
            id: indicateurId,
            collectiviteId,
            unite,
            periodicite,
            parentId: null,
            hasChildren: false,
          },
        });
        if (!validation.success) {
          return failure(validation.error);
        }
        await this.repository.attachSousIndicateur(
          { parentId: parent.id, enfantId: indicateurId },
          transaction
        );
      }

      if (input.ficheId !== undefined) {
        const fichesResult =
          await this.upsertIndicateurFichesService.upsertIndicateurFiches(
            {
              indicateurId,
              collectiviteId,
              ficheIds: [input.ficheId],
            },
            { user, tx: transaction }
          );
        if (!fichesResult.success) {
          return failure(fichesResult.error);
        }
      }

      return success(indicateurId);
    }, tx);

    if (transactionResult.success) {
      this.logger.log(
        `Indicateur personnalisé "${transactionResult.data}" pour la collectivité "${collectiviteId}" inséré`
      );
      return success(transactionResult.data);
    }
    if (transactionResult.error instanceof Error) {
      throw transactionResult.cause ?? transactionResult.error;
    }
    return failure(transactionResult.error, transactionResult.cause);
  }

  private async resolveIndicateurShape(
    input: CreateIndicateurInput,
    tx: Transaction
  ): Promise<Result<IndicateurShape, CreateIndicateurError>> {
    const isSousIndicateur = input.parentId !== undefined;
    if (!isSousIndicateur) {
      return success({
        unite: input.unite ?? '',
        periodicite: input.periodicite,
        parent: null,
      });
    }

    const parent = await this.repository.getParentInGroup(
      { parentId: input.parentId, collectiviteId: input.collectiviteId },
      tx
    );
    if (!parent) {
      return failure('PARENT_NOT_FOUND');
    }

    return success({
      unite: parent.unite,
      periodicite: parent.periodicite,
      parent,
    });
  }
}
