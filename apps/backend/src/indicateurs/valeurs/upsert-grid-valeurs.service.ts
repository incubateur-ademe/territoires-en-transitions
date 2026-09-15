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
  IndicateurPeriods,
} from '@tet/domain/indicateurs';
import { getErrorMessage } from '@tet/domain/utils';
import { isNotNil, keyBy, round } from 'es-toolkit';
import { IndicateurDefinitionLockRepository } from '../definitions/indicateur-definition-lock.repository';
import { ListIndicateursService } from '../indicateurs/list-indicateurs/list-indicateurs.service';
import ComputeValeursService from './compute-valeurs.service';
import CrudValeursService from './crud-valeurs.service';
import { dehydrateIndicateurPeriod } from './indicateur-period.adapter';
import { IndicateurValeurLockRepository } from './indicateur-valeur-lock.repository';
import { UpsertGridValeursError } from './upsert-grid-valeurs.errors';
import { UpsertGridValeursInput } from './upsert-grid-valeurs.input';
import { UpsertGridValeursRepository } from './upsert-grid-valeurs.repository';
import { UserIndicateurValeurNotAllowedException } from './user-indicateur-valeur.errors';
import { assertUserIndicateurValeursAllowed } from './user-indicateur-valeur.rules';

type UpsertGridValeursContext = { user: AuthenticatedUser };

const mergeValeursByPeriod = (
  valeurs: UpsertGridValeursInput['valeurs']
): UpsertGridValeursInput['valeurs'] => {
  const valeursByPeriod = new Map<string, (typeof valeurs)[number]>();
  for (const valeur of valeurs) {
    const key = `${valeur.indicateurId}:${IndicateurPeriods.key(
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
    private readonly crudValeursService: CrudValeursService,
    private readonly listIndicateursService: ListIndicateursService,
    private readonly updateDefinitionService: UpdateDefinitionService,
    private readonly computeValeursService: ComputeValeursService,
    private readonly lockRepository: IndicateurValeurLockRepository,
    private readonly definitionLockRepository: IndicateurDefinitionLockRepository,
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

      await this.crudValeursService.canMutateValeurs(
        user,
        collectiviteId,
        indicateurs
      );

      for (const valeur of valeurs) {
        const definition = indicateursById[valeur.indicateurId];
        if (
          !definition ||
          (definition.periodiciteMode === 'imposee' &&
            valeur.period.periodicite !== definition.periodicite)
        ) {
          return failure('INVALID_GRID_VALEUR');
        }
      }

      const mergedValeurs = mergeValeursByPeriod(valeurs);

      const transactionResult = await this.transactionManager.executeSingle<
        IndicateurValeur[],
        UpsertGridValeursError
      >(async (tx) => {
        try {
          // Validate the catalogue policy again under the definition lock.
          const lockedDefinitions =
            await this.definitionLockRepository.lockDefinitions(
              indicateurIds,
              tx
            );
          if (lockedDefinitions.length !== indicateurIds.length) {
            return failure('NOT_FOUND');
          }
          assertUserIndicateurValeursAllowed(lockedDefinitions);
          const lockedDefinitionsById = keyBy(
            lockedDefinitions,
            (definition) => definition.id
          );
          const now = new Date().toISOString();
          const valeursToWrite: IndicateurValeurCreate[] = [];
          for (const valeur of mergedValeurs) {
            const definition = lockedDefinitionsById[valeur.indicateurId];
            if (!definition) {
              return failure('NOT_FOUND');
            }
            if (
              definition.periodiciteMode === 'imposee' &&
              valeur.period.periodicite !== definition.periodicite
            ) {
              return failure('INVALID_GRID_VALEUR');
            }
            const resultat = isNotNil(valeur.resultat)
              ? round(valeur.resultat, definition.precision)
              : valeur.resultat;
            const objectif = isNotNil(valeur.objectif)
              ? round(valeur.objectif, definition.precision)
              : valeur.objectif;
            valeursToWrite.push({
              collectiviteId,
              indicateurId: valeur.indicateurId,
              dateValeur: dehydrateIndicateurPeriod(valeur.period),
              periodicite: valeur.period.periodicite,
              ...(resultat !== undefined && { resultat }),
              ...(objectif !== undefined && { objectif }),
              metadonneeId: null,
              calculAuto: false,
              calculAutoIdentifiantsManquants: null,
              createdBy: user.id,
              modifiedBy: user.id,
              createdAt: now,
              modifiedAt: now,
            });
          }

          await this.lockRepository.lock(valeursToWrite, tx);
          const saved = await this.repository.upsert(valeursToWrite, tx);
          await this.updateDefinitionService.updateDefinitionsModifiedFields(
            { indicateurIds, collectiviteId, user },
            tx
          );
          const calculated =
            await this.computeValeursService.updateCalculatedIndicateurValeurs(
              saved.map((valeur) => ({ ...valeur })),
              tx
            );
          if (calculated.length > 0) {
            await this.crudValeursService.upsertIndicateurValeurs(calculated, {
              user,
              isUserTrusted: true,
              tx,
            });
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
