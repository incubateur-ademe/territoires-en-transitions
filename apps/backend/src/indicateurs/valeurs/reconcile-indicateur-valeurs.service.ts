import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  IndicateurDefinition,
  IndicateurValeur,
  IndicateurValeurCreate,
  IndicateurValeurWithIdentifiant,
} from '@tet/domain/indicateurs';
import { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import ComputeValeursService from './compute-valeurs.service';
import { CrudValeursRepository } from './crud-valeurs.repository';
import {
  IndicateurValeursContext,
  IndicateurValeursWriteContext,
} from './indicateur-valeurs-context';
import {
  captureIndicateurValeursResult,
  getIndicateurValeursDataOrThrow,
  IndicateurValeursError,
} from './indicateur-valeurs.errors';
import { ValidateIndicateurValeursWriteService } from './validate-indicateur-valeurs-write.service';
import { WriteIndicateurValeursService } from './write-indicateur-valeurs.service';

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
    private readonly repository: CrudValeursRepository,
    private readonly computeValeursService: ComputeValeursService,
    private readonly validationService: ValidateIndicateurValeursWriteService,
    private readonly writer: WriteIndicateurValeursService,
    private readonly definitionsRepository: ListPlatformDefinitionsRepository,
    private readonly transactionManager: TransactionManager
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
    input: { collectiviteId: number; definitions: IndicateurDefinition[] },
    context: IndicateurValeursWriteContext
  ) {
    return captureIndicateurValeursResult(() =>
      this.reconcileInTransaction(
        input.collectiviteId,
        input.definitions,
        context.tx
      )
    );
  }
  private async reconcileInTransaction(
    collectiviteId: number,
    definitions: IndicateurDefinition[],
    tx: Transaction
  ): Promise<RecomputedCollectiviteIndicateurValeurs> {
    const recomputed =
      await this.computeValeursService.recomputeCollectiviteCalculatedIndicateurValeurs(
        collectiviteId,
        definitions.map(({ id }) => id),
        tx
      );

    const deletedValeurs = recomputed.valeurIdsToDelete.length
      ? await this.repository.deleteAutomaticValeurs(
          recomputed.valeurIdsToDelete,
          { collectiviteId },
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
    const insertedIndicateurValeurIdentifiants = [
      ...new Set(
        [
          ...recomputed.indicateurIdentifiants,
          ...allInsertedValeurs.map((v) => v.indicateurIdentifiant),
        ].filter((v): v is string => Boolean(v))
      ).values(),
    ] as string[];
    this.logger.log(
      `Inserted ${
        allInsertedValeurs.length
      } computed indicateur valeurs for collectivite ${collectiviteId} and identifiants ${insertedIndicateurValeurIdentifiants.join(
        ','
      )}`
    );
    return {
      valeursCount: allInsertedValeurs.length + allDeletedValeurs.length,
      identifiants: insertedIndicateurValeurIdentifiants,
      collectiviteId,
    };
  }

  recomputeAll(
    input: { collectiviteId?: number; definitions?: IndicateurDefinition[] },
    context: IndicateurValeursContext
  ) {
    return captureIndicateurValeursResult(async () => {
      const definitions =
        input.definitions ??
        (await this.definitionsRepository.listPlatformDefinitionsHavingComputedValue(
          {}
        ));
      const sourceIdentifiants =
        await this.computeValeursService.getAllSourceIdentifiants(definitions);
      const collectiviteIds = input.collectiviteId
        ? [input.collectiviteId]
        : await this.repository.listRecomputeCandidateCollectiviteIds({
            sourceIdentifiants,
            computedIndicateurIds: definitions.map(({ id }) => id),
          });
      const results: RecomputedCollectiviteIndicateurValeurs[] = [];
      // Keep one bounded transaction per collectivité, as in the existing recompute contract.
      for (const collectiviteId of collectiviteIds) {
        const result = await this.transactionManager.executeSingle(async (tx) =>
          this.reconcileCollectivite(
            { collectiviteId, definitions },
            { ...context, tx }
          )
        );
        results.push(getIndicateurValeursDataOrThrow(result));
      }
      return results;
    });
  }
}
