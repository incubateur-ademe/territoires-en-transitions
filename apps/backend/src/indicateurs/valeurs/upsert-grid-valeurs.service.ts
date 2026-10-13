import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpdateDefinitionService } from '@tet/backend/indicateurs/definitions/mutate-definition/update-definition.service';
import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  IndicateurValeur,
  IndicateurValeurCreate,
  IndicateurPeriodes,
} from '@tet/domain/indicateurs';
import { getErrorMessage } from '@tet/domain/utils';
import { isNotNil, keyBy, round } from 'es-toolkit';
import { ListIndicateursService } from '../indicateurs/list-indicateurs/list-indicateurs.service';
import ComputeValeursService from './compute-indicateur-valeurs/compute-valeurs.service';
import ManageIndicateurValeursService from './manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import { IndicateurValeurLockRepository } from './indicateur-valeur-lock.repository';
import { UpsertGridValeursError } from './upsert-grid-valeurs.errors';
import { UpsertGridValeursInput } from './upsert-grid-valeurs.input';
import { UpsertGridValeursRepository } from './upsert-grid-valeurs.repository';
import { UserIndicateurValeurNotAllowedException } from './write-indicateur-valeurs/user-indicateur-valeur.errors';
import { ValidateIndicateurValeursWriteService } from './write-indicateur-valeurs/validate-indicateur-valeurs-write.service';

type UpsertGridValeursContext = { user: AuthenticatedUser };

const mergeValeursByPeriod = (
  valeurs: UpsertGridValeursInput['valeurs']
): UpsertGridValeursInput['valeurs'] => {
  const valeursByPeriod = new Map<string, (typeof valeurs)[number]>();
  for (const valeur of valeurs) {
    const key = `${valeur.indicateurId}:${IndicateurPeriodes.key(
      valeur.period
    )}`;
    const previous = valeursByPeriod.get(key);
    valeursByPeriod.set(key, {
      ...previous,
      ...valeur,
      resultat:
        valeur.resultat !== undefined ? valeur.resultat : previous?.resultat,
      objectif:
        valeur.objectif !== undefined ? valeur.objectif : previous?.objectif,
    });
  }
  return [...valeursByPeriod.values()];
};

@Injectable()
export class UpsertGridValeursService {
  private readonly logger = new Logger(UpsertGridValeursService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly manageIndicateurValeursService: ManageIndicateurValeursService,
    private readonly listIndicateursService: ListIndicateursService,
    private readonly updateDefinitionService: UpdateDefinitionService,
    private readonly computeValeursService: ComputeValeursService,
    private readonly lockRepository: IndicateurValeurLockRepository,
    private readonly validationService: ValidateIndicateurValeursWriteService,
    private readonly repository: UpsertGridValeursRepository
  ) {}

  async upsertGridValeurs(
    { collectiviteId, valeurs }: UpsertGridValeursInput,
    { user }: UpsertGridValeursContext
  ): Promise<Result<IndicateurValeur[], UpsertGridValeursError>> {
    if (user.role !== AuthRole.AUTHENTICATED || !user.id) {
      return failure('UNAUTHORIZED');
    }

    try {
      const indicateurIds = [...new Set(valeurs.map((v) => v.indicateurId))];
      const { data: indicateurs } =
        await this.listIndicateursService.listIndicateurs(
          {
            collectiviteId,
            filters: { indicateurIds },
            queryOptions: { page: 1, limit: indicateurIds.length },
          },
          user
        );
      const indicateursById = keyBy(indicateurs, (item) => item.id);

      if (indicateurs.length !== indicateurIds.length) {
        return failure('NOT_FOUND');
      }

      await this.manageIndicateurValeursService.canMutateValeurs(
        user,
        collectiviteId,
        indicateurs
      );

      for (const valeur of valeurs) {
        const definition = indicateursById[valeur.indicateurId];
        if (
          !definition ||
          valeur.period.periodicite !== definition.periodicite
        ) {
          return failure('INVALID_GRID_VALEUR');
        }
      }

      const mergedValeurs = mergeValeursByPeriod(valeurs);

      const changed: IndicateurValeur[] = [];
      const transactionResult = await this.transactionManager.executeSingle<
        IndicateurValeur[],
        UpsertGridValeursError
      >(async (tx) => {
        try {
          const now = new Date().toISOString();
          const valeursToValidate: IndicateurValeurCreate[] =
            mergedValeurs.map(({ period, ...valeur }) => ({
              ...valeur,
              collectiviteId,
              dateValeur: IndicateurPeriodes.toDateValeur(period),
              periodicite: period.periodicite,
              metadonneeId: null,
              calculAuto: false,
              calculAutoIdentifiantsManquants: null,
              createdBy: user.id,
              modifiedBy: user.id,
              createdAt: now,
              modifiedAt: now,
            }));
          // Recheck catalogue policy and availability under transaction locks.
          const validation = await this.validationService.validate(
            { valeurs: valeursToValidate, definitions: indicateursById },
            { user, tx }
          );
          if (!validation.success) {
            return failure(
              validation.error === 'INVALID_VALUE'
                ? 'INVALID_GRID_VALEUR'
                : validation.error,
              validation.cause
            );
          }
          const valeursToWrite = valeursToValidate.map((valeur) => {
            const definition = validation.data[valeur.indicateurId];
            return {
              ...valeur,
              resultat: isNotNil(valeur.resultat)
                ? round(valeur.resultat, definition.precision)
                : valeur.resultat,
              objectif: isNotNil(valeur.objectif)
                ? round(valeur.objectif, definition.precision)
                : valeur.objectif,
            };
          });

          await this.lockRepository.lock(valeursToWrite, tx);
          const saved = await this.repository.upsert(valeursToWrite, tx);
          await this.updateDefinitionService.updateDefinitionsModifiedFields(
            { indicateurIds, collectiviteId, user },
            tx
          );
          const calculated =
            await this.computeValeursService.updateCalculatedIndicateurValeurs(
              saved,
              tx
            );
          changed.push(...saved);
          if (calculated.length > 0) {
            changed.push(
              ...(await this.manageIndicateurValeursService.upsertIndicateurValeurs(
                calculated,
                {
                  user,
                  isUserTrusted: true,
                  tx,
                }
              ))
            );
          }
          return success(saved);
        } catch (error) {
          if (error instanceof UserIndicateurValeurNotAllowedException) {
            return failure('USER_VALUE_NOT_ALLOWED', error);
          }
          return failure(
            'DATABASE_ERROR',
            error instanceof Error ? error : new Error(getErrorMessage(error))
          );
        }
      });
      if (!transactionResult.success) {
        return transactionResult;
      }
      // The transaction is committed: publication failures cannot undo it.
      try {
        await this.manageIndicateurValeursService.publishValeurUpsertedEvents(
          changed,
          user
        );
      } catch (error) {
        this.logger.error(
          `Échec de publication des événements d'upsert : ${getErrorMessage(error)}`
        );
      }
      return success(transactionResult.data);
    } catch (error) {
      if (error instanceof UserIndicateurValeurNotAllowedException) {
        return failure('USER_VALUE_NOT_ALLOWED', error);
      }
      if (error instanceof ForbiddenException) {
        return failure('UNAUTHORIZED', error);
      }
      if (error instanceof NotFoundException) {
        return failure('NOT_FOUND', error);
      }
      if (error instanceof BadRequestException) {
        return failure('INVALID_GRID_VALEUR', error);
      }
      this.logger.error(
        `Échec de l'upsert des valeurs de grille : ${getErrorMessage(error)}`
      );
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }
}
