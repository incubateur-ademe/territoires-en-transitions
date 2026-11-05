import { Injectable, Logger } from '@nestjs/common';
import { chunk } from 'es-toolkit';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
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
import {
  captureIndicateurValeursResult,
  getIndicateurValeursDataOrThrow,
  IndicateurValeursError,
} from '../indicateur-valeurs.errors';
import { ValidateIndicateurValeursWriteService } from '../write-indicateur-valeurs/validate-indicateur-valeurs-write.service';
import { WriteIndicateurValeursService } from '../write-indicateur-valeurs/write-indicateur-valeurs.service';
import { getIndicateurDataOrThrow } from '../../indicateur/indicateur-nature.utils';

/** Taille d'un lot de recalcul : réglée sur le nombre d'allers-retours, pas sur la mémoire. */
export const RECOMPUTE_COLLECTIVITES_BATCH_SIZE = 50;

export type RecomputedCollectiviteIndicateurValeurs = {
  collectiviteId: number;
  valeursCount: number;
  identifiants: string[];
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

  async upsert(
    valeurs: IndicateurValeurCreate[],
    context: IndicateurValeursContext
  ): Promise<
    Result<IndicateurValeurWithIdentifiant[], IndicateurValeursError>
  > {
    if (valeurs.length === 0) return success([]);
    const prepared = await this.validationService.prepare(valeurs, context);
    if (!prepared.success) return prepared;
    return captureIndicateurValeursResult(async () => {
      const result = await this.transactionManager.executeSingle(async (tx) => {
        const written = await this.writer.saveBatch(prepared.data, {
          ...context,
          tx,
        });
        if (!written.success) return written;
        const calculated = written.data.length
          ? await this.computeValeursService.updateCalculatedIndicateurValeurs(
              written.data,
              tx
            )
          : [];
        const dependent = await this.upsert(calculated, {
          isUserTrusted: true,
          tx,
        });
        if (!dependent.success) return dependent;
        return success([...written.data, ...dependent.data]);
      }, context.tx);
      return getIndicateurValeursDataOrThrow(result);
    });
  }

  propagateUpdated(
    valeurs: IndicateurValeur[],
    context: IndicateurValeursWriteContext
  ) {
    return captureIndicateurValeursResult(async () => {
      const calculated =
        await this.computeValeursService.updateCalculatedIndicateurValeurs(
          valeurs,
          context.tx
        );
      return getIndicateurValeursDataOrThrow(
        await this.upsert(calculated, { isUserTrusted: true, tx: context.tx })
      );
    });
  }

  propagateDeleted(
    valeurs: IndicateurValeur[],
    context: IndicateurValeursWriteContext
  ) {
    return captureIndicateurValeursResult(() =>
      this.propagateDeletedInTransaction(valeurs, context.tx)
    );
  }
  private async propagateDeletedInTransaction(
    initialDeletedValeurs: IndicateurValeur[],
    tx: Transaction
  ): Promise<{
    deletedValeurs: IndicateurValeur[];
    upsertedValeurs: IndicateurValeurWithIdentifiant[];
  }> {
    let deletedValeursToPropagate = initialDeletedValeurs;
    const allDeletedValeurs: IndicateurValeur[] = [];
    const allUpsertedValeurs: IndicateurValeurWithIdentifiant[] = [];

    while (deletedValeursToPropagate.length > 0) {
      const reconciliation =
        await this.computeValeursService.reconcileDeletedIndicateurValeurs(
          deletedValeursToPropagate,
          tx
        );
      const deletedDependentValeurs = reconciliation.valeurIdsToDelete.length
        ? await this.repository.deleteAutomaticValeurs(
            reconciliation.valeurIdsToDelete,
            {},
            tx
          )
        : [];
      const upsertedDependentValeurs = reconciliation.valeursToUpsert.length
        ? getIndicateurValeursDataOrThrow(
            await this.upsert(reconciliation.valeursToUpsert, {
              isUserTrusted: true,
              tx,
            })
          )
        : [];

      allDeletedValeurs.push(...deletedDependentValeurs);
      allUpsertedValeurs.push(...upsertedDependentValeurs);
      deletedValeursToPropagate = deletedDependentValeurs;
    }

    return {
      deletedValeurs: allDeletedValeurs,
      upsertedValeurs: allUpsertedValeurs,
    };
  }

  reconcileCollectivite(
    input: { collectiviteId: number; indicateurs: IndicateurPredefini[] },
    context: IndicateurValeursWriteContext
  ) {
    return captureIndicateurValeursResult(async () => {
      const [result] = await this.reconcileInTransaction(
        [input.collectiviteId],
        input.indicateurs,
        context.tx
      );
      return result;
    });
  }

  /** Recalcule un lot de collectivités : une entrée par collectivité, même sans écriture. */
  reconcileCollectivites(
    input: { collectiviteIds: number[]; indicateurs: IndicateurPredefini[] },
    context: IndicateurValeursWriteContext
  ) {
    return captureIndicateurValeursResult(() =>
      this.reconcileInTransaction(
        input.collectiviteIds,
        input.indicateurs,
        context.tx
      )
    );
  }

  private async reconcileInTransaction(
    collectiviteIds: number[],
    indicateursPredefinis: IndicateurPredefini[],
    tx: Transaction
  ): Promise<RecomputedCollectiviteIndicateurValeurs[]> {
    const recomputed =
      await this.computeValeursService.recomputeCollectivitesCalculatedIndicateurValeurs(
        collectiviteIds,
        indicateursPredefinis.map(({ id }) => id),
        tx
      );

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
    const insertedValeurs = recomputed.valeursToUpsert.length
      ? getIndicateurValeursDataOrThrow(
          await this.upsert(recomputed.valeursToUpsert, {
            isUserTrusted: true,
            tx,
          })
        )
      : [];

    // Une ligne automatique retirée devient une suppression explicite
    // pour les formules en aval. `null` reste ainsi réservé aux
    // observations réellement présentes.
    const propagated = deletedValeurs.length
      ? await this.propagateDeletedInTransaction(deletedValeurs, tx)
      : { deletedValeurs: [], upsertedValeurs: [] };
    const allDeletedValeurs = [...deletedValeurs, ...propagated.deletedValeurs];
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
    return results;
  }

  recomputeAll(
    input: { collectiviteId?: number; indicateurs?: IndicateurPredefini[] },
    context: IndicateurValeursContext
  ) {
    return captureIndicateurValeursResult(async () => {
      const indicateurs =
        input.indicateurs ??
        getIndicateurDataOrThrow(
          await this.listIndicateursPredefinisRepository.listIndicateursPredefinisHavingComputedValue(
            {},
            context.tx
          )
        );
      const sourceIdentifiants =
        await this.computeValeursService.getAllSourceIdentifiants(indicateurs);
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
        results.push(...getIndicateurValeursDataOrThrow(result));
        this.logger.log(
          `Recalcul des indicateurs : lot ${index + 1}/${batches.length} (${
            batch.length
          } collectivités)`
        );
      }
      return results;
    });
  }
}
