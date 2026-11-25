import { Injectable, Logger } from '@nestjs/common';
import { UpdateIndicateurService } from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/update-indicateur.service';
import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import {
  catchDatabaseFailure,
  toDatabaseFailure,
} from '@tet/backend/utils/database/catch-database-failure';
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
import {
  isUpsertGridValeursError,
  toGridFailure,
  UpsertGridValeursError,
} from './upsert-grid-valeurs.errors';
import { UpsertGridValeursInput } from './upsert-grid-valeurs.input';
import { UpsertGridValeursRepository } from './upsert-grid-valeurs.repository';
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
    private readonly updateIndicateurService: UpdateIndicateurService,
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

    return catchDatabaseFailure(async () => {
      const indicateurIds = [...new Set(valeurs.map((v) => v.indicateurId))];
      const listResult = await this.listIndicateursService.listIndicateurs(
        {
          collectiviteId,
          filters: { indicateurIds },
          queryOptions: { page: 1, limit: indicateurIds.length },
        },
        user
      );
      if (!listResult.success) {
        return failure(
          listResult.error === 'INDICATEUR_NOT_FOUND'
            ? 'NOT_FOUND'
            : listResult.error,
          listResult.cause
        );
      }
      const { data: indicateurs } = listResult.data;
      const indicateursById = keyBy(indicateurs, (item) => item.id);

      if (indicateurs.length !== indicateurIds.length) {
        return failure('NOT_FOUND');
      }

      const canMutate =
        await this.manageIndicateurValeursService.canMutateValeurs(
          user,
          collectiviteId,
          indicateurs
        );
      if (!canMutate.success) return toGridFailure(canMutate);

      for (const valeur of valeurs) {
        const indicateur = indicateursById[valeur.indicateurId];
        if (
          !indicateur ||
          valeur.period.periodicite !== indicateur.periodicite
        ) {
          return failure('INVALID_GRID_VALEUR');
        }
      }

      const mergedValeurs = mergeValeursByPeriod(valeurs);

      const changed: IndicateurValeur[] = [];
      const transactionResult = await this.transactionManager.executeSingle<
        IndicateurValeur[],
        UpsertGridValeursError | Error
      >((tx) =>
        catchDatabaseFailure(async () => {
          const now = new Date().toISOString();
          const valeursToValidate: IndicateurValeurCreate[] = mergedValeurs.map(
            ({ period, ...valeur }) => ({
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
            })
          );
          // Recheck catalogue policy and availability under transaction locks.
          const validation = await this.validationService.validate(
            { valeurs: valeursToValidate },
            { user, tx }
          );
          if (!validation.success) {
            return toGridFailure(validation);
          }
          const valeursToWrite = valeursToValidate.map((valeur) => {
            const indicateur = validation.data[valeur.indicateurId];
            return {
              ...valeur,
              resultat: isNotNil(valeur.resultat)
                ? round(valeur.resultat, indicateur.precision)
                : valeur.resultat,
              objectif: isNotNil(valeur.objectif)
                ? round(valeur.objectif, indicateur.precision)
                : valeur.objectif,
            };
          });

          await this.lockRepository.lock(valeursToWrite, tx);
          const savedResult = await this.repository.upsert(valeursToWrite, tx);
          if (!savedResult.success) return savedResult;
          const saved = savedResult.data;
          await this.updateIndicateurService.updateIndicateursModifiedFields(
            { indicateurIds, collectiviteId, user },
            tx
          );
          const calculated =
            await this.computeValeursService.updateCalculatedIndicateurValeurs(
              saved,
              tx
            );
          if (!calculated.success) {
            return toDatabaseFailure(calculated);
          }
          changed.push(...saved);
          if (calculated.data.length > 0) {
            const upsertedCalculated =
              await this.manageIndicateurValeursService.upsertIndicateurValeurs(
                calculated.data,
                {
                  user,
                  isUserTrusted: true,
                  tx,
                }
              );
            if (!upsertedCalculated.success) {
              return toGridFailure(upsertedCalculated);
            }
            changed.push(...upsertedCalculated.data);
          }
          return success(saved);
        })
      );
      if (!transactionResult.success) {
        return isUpsertGridValeursError(transactionResult.error)
          ? failure(transactionResult.error, transactionResult.cause)
          : toDatabaseFailure({
              error: String(transactionResult.error),
              cause:
                transactionResult.error instanceof Error
                  ? transactionResult.error
                  : undefined,
            });
      }
      // The transaction is committed: publication failures cannot undo it.
      try {
        await this.manageIndicateurValeursService.publishValeurUpsertedEvents(
          changed,
          user
        );
      } catch (error) {
        this.logger.error(
          `Échec de publication des événements d'upsert : ${getErrorMessage(
            error
          )}`
        );
      }
      return success(transactionResult.data);
    });
  }
}
