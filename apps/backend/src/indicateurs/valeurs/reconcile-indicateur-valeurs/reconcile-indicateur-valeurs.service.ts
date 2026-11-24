import { Injectable, Logger } from '@nestjs/common';
import { chunk } from 'es-toolkit';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  catchDatabaseFailure,
  toDatabaseFailure,
} from '@tet/backend/utils/database/catch-database-failure';
import { Result, success } from '@tet/backend/utils/result.type';
import {
  TransactionExecutionOptions,
  TransactionManager,
} from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  IndicateurPredefini,
  IndicateurValeur,
  IndicateurValeurCreate,
  IndicateurValeurWithIdentifiant,
} from '@tet/domain/indicateurs';
import { ListIndicateursPredefinisRepository } from '../../indicateurs/list-indicateurs-predefinis/list-indicateurs-predefinis.repository';
import ComputeValeursService from '../compute-indicateur-valeurs/compute-valeurs.service';
import { IndicateurValeurLockRepository } from '../indicateur-valeur-lock.repository';
import { IndicateurValeursRepository } from '../indicateur-valeurs.repository';
import {
  IndicateurValeursContext,
  IndicateurValeursWriteContext,
} from '../indicateur-valeurs-context.types';
import { IndicateurValeursError } from '../indicateur-valeurs.errors';
import { ValidateIndicateurValeursWriteService } from '../write-indicateur-valeurs/validate-indicateur-valeurs-write.service';
import { IndicateurValeurConflict } from '../write-indicateur-valeurs/fill-missing-indicateur-valeurs.rules';
import { WriteIndicateurValeursService } from '../write-indicateur-valeurs/write-indicateur-valeurs.service';

/** Taille d'un lot de recalcul : réglée sur le nombre d'allers-retours, pas sur la mémoire. */
export const RECOMPUTE_COLLECTIVITES_BATCH_SIZE = 50;

export type RecomputedCollectiviteIndicateurValeurs = {
  collectiviteId: number;
  valeursCount: number;
  identifiants: string[];
};

type PropagatedDeletion = {
  deletedValeurs: IndicateurValeur[];
  upsertedValeurs: IndicateurValeurWithIdentifiant[];
};

/** Applies source changes and derived values together, including deletion propagation. */
@Injectable()
export class ReconcileIndicateurValeursService {
  private readonly logger = new Logger(ReconcileIndicateurValeursService.name);
  constructor(
    private readonly repository: IndicateurValeursRepository,
    private readonly computeValeursService: ComputeValeursService,
    private readonly validationService: ValidateIndicateurValeursWriteService,
    private readonly writer: WriteIndicateurValeursService,
    private readonly listIndicateursPredefinisRepository: ListIndicateursPredefinisRepository,
    private readonly transactionManager: TransactionManager,
    private readonly valeurLockRepository: IndicateurValeurLockRepository
  ) {}

  upsert(
    valeurs: IndicateurValeurCreate[],
    context: IndicateurValeursContext
  ): Promise<
    Result<IndicateurValeurWithIdentifiant[], IndicateurValeursError>
  > {
    return this.upsertBatch(valeurs, context, { undoWritesOnFailure: true });
  }

  private upsertWithinPropagation(
    valeurs: IndicateurValeurCreate[],
    context: IndicateurValeursContext
  ): Promise<
    Result<IndicateurValeurWithIdentifiant[], IndicateurValeursError>
  > {
    return this.upsertBatch(valeurs, context, {});
  }

  private async upsertBatch(
    valeurs: IndicateurValeurCreate[],
    context: IndicateurValeursContext,
    options: TransactionExecutionOptions
  ): Promise<
    Result<IndicateurValeurWithIdentifiant[], IndicateurValeursError>
  > {
    if (valeurs.length === 0) return success([]);
    const prepared = await this.validationService.prepare(valeurs, context);
    if (!prepared.success) return prepared;
    return this.transactionManager.executeSingle(
      (tx) =>
        catchDatabaseFailure(async () => {
          const written = await this.writer.saveBatch(prepared.data, {
            ...context,
            tx,
          });
          if (!written.success) return written;
          const dependent = written.data.length
            ? await this.propagateUpdated(written.data, { ...context, tx })
            : success([]);
          if (!dependent.success) return dependent;
          return success([...written.data, ...dependent.data]);
        }),
      context.tx,
      options
    );
  }

  /**
   * Complète les cellules absentes sous les verrous ordinaires.
   * L'autorisation de métadonnée est accordée par l'orchestration propriétaire
   * du plan ou de la démarche, jamais à partir d'un identifiant de requête seul.
   */
  async fillMissing(
    valeurs: IndicateurValeurCreate[],
    context: Extract<
      IndicateurValeursContext<AuthenticatedUser>,
      { user: AuthenticatedUser }
    >
  ): Promise<
    Result<
      {
        valeurs: IndicateurValeurWithIdentifiant[];
        conflits: IndicateurValeurConflict[];
      },
      IndicateurValeursError
    >
  > {
    if (valeurs.length === 0) return success({ valeurs: [], conflits: [] });
    return this.transactionManager.executeSingle(
      (tx) =>
        catchDatabaseFailure(async () => {
          const writeContext = {
            user: context.user,
            metadataAuthorization: context.metadataAuthorization,
            tx,
          };
          const prepared = await this.validationService.prepare(
            valeurs,
            writeContext
          );
          if (!prepared.success) return prepared;
          const written = await this.writer.fillMissing(
            prepared.data,
            writeContext
          );
          if (!written.success) return written;
          const dependent = written.data.valeurs.length
            ? await this.propagateUpdated(written.data.valeurs, writeContext)
            : success([]);
          if (!dependent.success) return dependent;
          return success({
            valeurs: [...written.data.valeurs, ...dependent.data],
            conflits: written.data.conflits,
          });
        }),
      context.tx
    );
  }

  async propagateUpdated(
    valeurs: IndicateurValeur[],
    context: IndicateurValeursWriteContext
  ): Promise<
    Result<IndicateurValeurWithIdentifiant[], IndicateurValeursError>
  > {
    const calculated =
      await this.computeValeursService.updateCalculatedIndicateurValeurs(
        valeurs,
        context.tx
      );
    if (!calculated.success) return toDatabaseFailure(calculated);
    return this.upsertWithinPropagation(calculated.data, {
      isUserTrusted: true,
      tx: context.tx,
    });
  }

  propagateDeleted(
    valeurs: IndicateurValeur[],
    context: IndicateurValeursWriteContext
  ): Promise<Result<PropagatedDeletion, IndicateurValeursError>> {
    return this.propagateDeletedInTransaction(valeurs, context.tx);
  }

  private propagateDeletedInTransaction(
    initialDeletedValeurs: IndicateurValeur[],
    tx: Transaction
  ): Promise<Result<PropagatedDeletion, IndicateurValeursError>> {
    return catchDatabaseFailure(async () => {
      let deletedValeursToPropagate = initialDeletedValeurs;
      const allDeletedValeurs: IndicateurValeur[] = [];
      const allUpsertedValeurs: IndicateurValeurWithIdentifiant[] = [];

      while (deletedValeursToPropagate.length > 0) {
        const reconciliation =
          await this.computeValeursService.reconcileDeletedIndicateurValeurs(
            deletedValeursToPropagate,
            tx
          );
        if (!reconciliation.success) return toDatabaseFailure(reconciliation);
        const { valeurIdsToDelete, valeursToUpsert } = reconciliation.data;
        const deletedDependentValeurs = valeurIdsToDelete.length
          ? await this.repository.deleteAutomaticValeurs(
              valeurIdsToDelete,
              {},
              tx
            )
          : [];
        const upsertedDependentValeurs = valeursToUpsert.length
          ? await this.upsertWithinPropagation(valeursToUpsert, {
              isUserTrusted: true,
              tx,
            })
          : success([]);
        if (!upsertedDependentValeurs.success) return upsertedDependentValeurs;

        allDeletedValeurs.push(...deletedDependentValeurs);
        allUpsertedValeurs.push(...upsertedDependentValeurs.data);
        deletedValeursToPropagate = deletedDependentValeurs;
      }

      return success({
        deletedValeurs: allDeletedValeurs,
        upsertedValeurs: allUpsertedValeurs,
      });
    });
  }

  async reconcileCollectivite(
    input: { collectiviteId: number; indicateurs: IndicateurPredefini[] },
    context: IndicateurValeursWriteContext
  ): Promise<
    Result<RecomputedCollectiviteIndicateurValeurs, IndicateurValeursError>
  > {
    const results = await this.reconcileInTransaction(
      [input.collectiviteId],
      input.indicateurs,
      context.tx
    );
    if (!results.success) return results;
    return success(results.data[0]);
  }

  /** Recalcule un lot de collectivités : une entrée par collectivité, même sans écriture. */
  reconcileCollectivites(
    input: { collectiviteIds: number[]; indicateurs: IndicateurPredefini[] },
    context: IndicateurValeursWriteContext
  ): Promise<
    Result<RecomputedCollectiviteIndicateurValeurs[], IndicateurValeursError>
  > {
    return this.reconcileInTransaction(
      input.collectiviteIds,
      input.indicateurs,
      context.tx
    );
  }

  private reconcileInTransaction(
    collectiviteIds: number[],
    indicateursPredefinis: IndicateurPredefini[],
    tx: Transaction
  ): Promise<
    Result<RecomputedCollectiviteIndicateurValeurs[], IndicateurValeursError>
  > {
    return catchDatabaseFailure(async () => {
      const recomputedResult =
        await this.computeValeursService.recomputeCollectivitesCalculatedIndicateurValeurs(
          collectiviteIds,
          indicateursPredefinis.map(({ id }) => id),
          tx
        );
      if (!recomputedResult.success) return toDatabaseFailure(recomputedResult);
      const recomputed = recomputedResult.data;

      const deletedValeurs = recomputed.valeurIdsToDelete.length
        ? await this.repository.deleteAutomaticValeurs(
            recomputed.valeurIdsToDelete,
            { collectiviteIds },
            tx
          )
        : [];

      // Peut recalculer récursivement les indicateurs qui dépendent des
      // résultats produits. Le même tx conserve le snapshot et les verrous
      // jusqu'au dernier upsert de la chaîne.
      const insertedResult = recomputed.valeursToUpsert.length
        ? await this.upsertWithinPropagation(recomputed.valeursToUpsert, {
            isUserTrusted: true,
            tx,
          })
        : success([]);
      if (!insertedResult.success) return insertedResult;
      const insertedValeurs = insertedResult.data;

      // Une ligne automatique retirée devient une suppression explicite
      // pour les formules en aval. `null` reste ainsi réservé aux
      // observations réellement présentes.
      const propagatedResult = deletedValeurs.length
        ? await this.propagateDeletedInTransaction(deletedValeurs, tx)
        : success({ deletedValeurs: [], upsertedValeurs: [] });
      if (!propagatedResult.success) return propagatedResult;
      const propagated = propagatedResult.data;
      const allDeletedValeurs = [
        ...deletedValeurs,
        ...propagated.deletedValeurs,
      ];
      const allInsertedValeurs = [
        ...insertedValeurs,
        ...propagated.upsertedValeurs,
      ];
      const results = collectiviteIds.map((collectiviteId) => {
        const inserted = allInsertedValeurs.filter(
          (valeur) => valeur.collectiviteId === collectiviteId
        );
        const deletedCount = allDeletedValeurs.filter(
          (valeur) => valeur.collectiviteId === collectiviteId
        ).length;
        const identifiants = [
          ...new Set(
            [
              ...recomputed.indicateurIdentifiants,
              ...inserted.map((v) => v.indicateurIdentifiant),
            ].filter((v): v is string => Boolean(v))
          ),
        ];
        return {
          valeursCount: inserted.length + deletedCount,
          identifiants,
          collectiviteId,
        };
      });
      this.logger.log(
        `Recalculated ${allInsertedValeurs.length} inserted and ${allDeletedValeurs.length} deleted indicateur valeurs for ${collectiviteIds.length} collectivites`
      );
      return success(results);
    });
  }

  recomputeAll(
    input: { collectiviteId?: number; indicateurs?: IndicateurPredefini[] },
    context: IndicateurValeursContext
  ): Promise<
    Result<RecomputedCollectiviteIndicateurValeurs[], IndicateurValeursError>
  > {
    return catchDatabaseFailure(async () => {
      const listed = input.indicateurs
        ? success(input.indicateurs)
        : await this.listIndicateursPredefinisRepository.listIndicateursPredefinisHavingComputedValue(
            {},
            context.tx
          );
      if (!listed.success) return toDatabaseFailure(listed);
      const indicateurs = listed.data;
      const sourceIdentifiantsResult =
        await this.computeValeursService.getAllSourceIdentifiants(indicateurs);
      if (!sourceIdentifiantsResult.success)
        return toDatabaseFailure(sourceIdentifiantsResult);
      const sourceIdentifiants = sourceIdentifiantsResult.data;
      const collectiviteIds = input.collectiviteId
        ? [input.collectiviteId]
        : await this.repository.listRecomputeCandidateCollectiviteIds(
            {
              sourceIdentifiants,
              computedIndicateurIds: indicateurs.map(({ id }) => id),
            },
            context.tx
          );
      const results: RecomputedCollectiviteIndicateurValeurs[] = [];
      // Catalogue imports share their transaction; standalone recalculations use one per lot.
      // A shared transaction keeps every lock until commit: one table lock
      // replaces the per-period locks, which would overflow PostgreSQL's lock table.
      if (context.tx && collectiviteIds.length > 1) {
        await this.valeurLockRepository.lockAllPeriodes(context.tx);
      }
      // Par lots : le graphe, les règles et les métadonnées ne sont relus
      // qu'une fois par lot, et chaque requête couvre toutes ses collectivités.
      const batches = chunk(
        [...collectiviteIds].sort((left, right) => left - right),
        RECOMPUTE_COLLECTIVITES_BATCH_SIZE
      );
      for (const [index, batch] of batches.entries()) {
        const result = await this.transactionManager.executeSingle(
          async (tx) =>
            this.reconcileCollectivites(
              { collectiviteIds: batch, indicateurs },
              { ...context, tx }
            ),
          context.tx
        );
        if (!result.success) return result;
        results.push(...result.data);
        this.logger.log(
          `Recalcul des indicateurs : lot ${index + 1}/${batches.length} (${
            batch.length
          } collectivités)`
        );
      }
      return success(results);
    });
  }
}
