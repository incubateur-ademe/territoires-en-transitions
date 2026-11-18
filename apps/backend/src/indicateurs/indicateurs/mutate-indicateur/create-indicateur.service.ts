import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import {
  validateSousIndicateurPerso,
  type IndicateurInGroup,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { IndicateurValeurLockRepository } from '../../valeurs/indicateur-valeur-lock.repository';
import { UpsertIndicateurFichesService } from '../upsert-indicateur-fiches/upsert-indicateur-fiches.service';
import {
  CreateIndicateurError,
  CreateIndicateurErrorEnum,
} from './create-indicateur.errors';
import { CreateIndicateurInput } from './mutate-indicateur.input';
import { MutateIndicateurRepository } from './mutate-indicateur.repository';

type IndicateurShape = Readonly<{
  unite: string;
  periodicite: IndicateurPeriodicite;
  parent: IndicateurInGroup | null;
  estConfidentiel: boolean;
  datesToMove: readonly string[];
}>;

@Injectable()
export default class CreateIndicateurService {
  private readonly logger = new Logger(CreateIndicateurService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly repository: MutateIndicateurRepository,
    private readonly permissionService: PermissionService,
    private readonly indicateurLockRepository: IndicateurLockRepository,
    private readonly upsertIndicateurFichesService: UpsertIndicateurFichesService,
    private readonly indicateurValeurLockRepository: IndicateurValeurLockRepository
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
      { collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    this.logger.log(
      `Insère un indicateur personnalisé pour la collectivité "${collectiviteId}"`
    );

    const transactionResult = await this.transactionManager.executeSingle<
      number,
      CreateIndicateurError | Error
    >(async (transaction) => {
      // PostgreSQL verrouille la table avant d'exécuter un trigger
      // statement-level. L'application doit donc prendre le verrou de
      // graphe explicitement pour conserver l'ordre graphe -> tables.
      await this.indicateurLockRepository.lockForIndicateurMutation(
        transaction
      );

      const shapeResult = await this.resolveIndicateurShape(input, transaction);
      if (!shapeResult.success) {
        return failure(shapeResult.error);
      }
      const { unite, periodicite, parent, estConfidentiel, datesToMove } =
        shapeResult.data;

      const createdResult = await this.repository.createIndicateurPerso(
        {
          collectiviteId,
          titre: input.titre,
          unite,
          periodicite,
          thematiqueIds: input.thematiques.map(({ id }) => id),
          commentaire: input.commentaire,
          estFavori: input.estFavori,
          estConfidentiel,
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
        await this.lockThenMoveValeursSaisies(
          {
            fromIndicateurId: parent.id,
            toIndicateurId: indicateurId,
            collectiviteId,
            dates: datesToMove,
          },
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
        estConfidentiel: input.estConfidentiel ?? false,
        datesToMove: [],
      });
    }

    const parent = await this.repository.getIndicateurInGroup(
      { indicateurId: input.parentId, collectiviteId: input.collectiviteId },
      tx
    );
    if (!parent) {
      return failure(CreateIndicateurErrorEnum.PARENT_NOT_FOUND);
    }

    const datesToMove = await this.listDatesValeursToTake(
      { parent, collectiviteId: input.collectiviteId },
      tx
    );
    const estConfidentiel = await this.resolveEstConfidentiel(
      {
        requested: input.estConfidentiel,
        parent,
        collectiviteId: input.collectiviteId,
        hasValeursToTake: datesToMove.length > 0,
      },
      tx
    );

    return success({
      unite: parent.unite,
      periodicite: parent.periodicite,
      parent,
      estConfidentiel,
      datesToMove,
    });
  }

  private async listDatesValeursToTake(
    {
      parent,
      collectiviteId,
    }: { parent: IndicateurInGroup; collectiviteId: number },
    tx: Transaction
  ): Promise<string[]> {
    if (parent.hasChildren) {
      return [];
    }
    return this.repository.listDatesValeursSaisies(
      { indicateurId: parent.id, collectiviteId },
      tx
    );
  }

  private async resolveEstConfidentiel(
    {
      requested,
      parent,
      collectiviteId,
      hasValeursToTake,
    }: {
      requested: boolean | undefined;
      parent: IndicateurInGroup;
      collectiviteId: number;
      hasValeursToTake: boolean;
    },
    tx: Transaction
  ): Promise<boolean> {
    if (requested !== undefined) {
      return requested;
    }
    if (!hasValeursToTake) {
      return false;
    }
    return this.repository.isConfidentiel(
      { indicateurId: parent.id, collectiviteId },
      tx
    );
  }

  private async lockThenMoveValeursSaisies(
    {
      fromIndicateurId,
      toIndicateurId,
      collectiviteId,
      dates,
    }: {
      fromIndicateurId: number;
      toIndicateurId: number;
      collectiviteId: number;
      dates: readonly string[];
    },
    tx: Transaction
  ): Promise<void> {
    if (dates.length === 0) {
      return;
    }
    await this.indicateurValeurLockRepository.lock(
      dates.map((dateValeur) => ({ collectiviteId, dateValeur })),
      tx
    );
    await this.repository.moveValeursSaisies(
      { fromIndicateurId, toIndicateurId, collectiviteId },
      tx
    );
  }
}
