import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { IndicateurLockRepository } from '@tet/backend/indicateurs/indicateur/indicateur-lock.repository';
import { AddIndicateurLinksService } from '@tet/backend/indicateurs/indicateurs/add-indicateur-links/add-indicateur-links.service';
import CreateIndicateurService from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/create-indicateur.service';
import { createIndicateurInputSchema } from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/mutate-indicateur.input';
import { ReconcileIndicateurValeursService } from '@tet/backend/indicateurs/valeurs/reconcile-indicateur-valeurs/reconcile-indicateur-valeurs.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { isFailedResult } from '@tet/backend/utils/transaction/transaction-manager.service';
import assert from 'node:assert';
import { CreatePlanAggregateOutput } from '../create-plan-aggregate/create-plan-aggregate.types';
import { ManagePlanIndicateurSourceService } from '../manage-plan-indicateur-source/manage-plan-indicateur-source.service';
import {
  PersistPlanIndicateurEntry,
  PersistPlanIndicateursContext,
  PersistPlanIndicateursError,
  PersistPlanIndicateursInput,
  PersistPlanIndicateursOutput,
} from './persist-plan-indicateurs.types';

/** Lie les indicateurs d'un plan et complète leurs valeurs sans écrasement. */
@Injectable()
export class PersistPlanIndicateursService {
  private readonly logger = new Logger(PersistPlanIndicateursService.name);

  constructor(
    private readonly locks: IndicateurLockRepository,
    private readonly createIndicateur: CreateIndicateurService,
    private readonly links: AddIndicateurLinksService,
    private readonly values: ReconcileIndicateurValeursService,
    private readonly sources: ManagePlanIndicateurSourceService
  ) {}

  /** Avant de créer le plan : graphe, puis définitions, puis plans/valeurs. */
  async lockAndValidate(
    input: PersistPlanIndicateursInput,
    context: PersistPlanIndicateursContext
  ): Promise<Result<void, PersistPlanIndicateursError[]>> {
    const errors = this.validateInput(input);
    if (errors.length) return failure(errors);
    try {
      if (input.indicateurs.some((entry) => entry.definition !== undefined)) {
        await this.locks.lockForIndicateurMutation(context.tx);
      }
      const locked = await this.locks.lockIndicateurs(
        input.indicateurs.flatMap((entry) =>
          entry.indicateurId === undefined ? [] : [entry.indicateurId]
        ),
        context.tx
      );
      if (!locked.success) return failure([{ code: locked.error }]);
      const definitions = new Map(locked.data.map((item) => [item.id, item]));
      for (const entry of input.indicateurs) {
        if (entry.indicateurId === undefined) continue;
        const definition = definitions.get(entry.indicateurId);
        const expected = entry.expectedDefinition;
        if (
          !definition ||
          (expected &&
            (definition.identifiantReferentiel !==
              expected.identifiantReferentiel ||
              definition.unite !== expected.unite ||
              definition.periodicite !== expected.periodicite))
        ) {
          errors.push({
            code: 'REFERENCES_CHANGED',
            sourceKey: entry.sourceKey,
          });
        }
      }
      return errors.length ? failure(errors) : success(undefined);
    } catch (error) {
      return this.captureFailure(error);
    }
  }

  /**
   * Réutilise la transaction de lockAndValidate. L'appelant annule cette
   * transaction en cas d'échec ; aucun effet externe n'est déclenché ici.
   */
  async persist(
    input: PersistPlanIndicateursInput,
    plan: CreatePlanAggregateOutput,
    context: PersistPlanIndicateursContext
  ): Promise<
    Result<PersistPlanIndicateursOutput, PersistPlanIndicateursError[]>
  > {
    const errors = this.validateInput(input);
    if (errors.length) return failure(errors);
    for (const entry of input.indicateurs) {
      const targetId = this.resolveTargetId(entry, plan);
      if (!Number.isSafeInteger(targetId) || (targetId ?? 0) <= 0) {
        errors.push({ code: 'INVALID_VALUE', sourceKey: entry.sourceKey });
      }
    }
    if (errors.length) return failure(errors);
    let sourceKey: string | undefined;
    try {
      if (input.source) {
        const source = await this.sources.getOrCreate(
          { ...input.source, planId: plan.planId },
          context
        );
        if (!source.success)
          return failure([{ code: source.error }], source.cause);
      }
      const output: PersistPlanIndicateursOutput = {
        indicateurIdsBySourceKey: new Map(),
        conflits: [],
      };
      for (const entry of input.indicateurs) {
        sourceKey = entry.sourceKey;
        const indicateurId = await this.resolveIndicateur(
          entry,
          input.collectiviteId,
          context
        );
        const targetId = this.resolveTargetId(entry, plan);
        assert(targetId !== undefined);
        const linked = await this.links.addLinks(
          {
            collectiviteId: input.collectiviteId,
            indicateurId,
            ...('ficheSourceKey' in entry.target
              ? { ficheIds: [targetId] }
              : { axeIds: [targetId] }),
          },
          context
        );
        if (!linked.success)
          return failure([{ code: linked.error, sourceKey }], linked.cause);
        const saved = await this.persistValues(
          entry,
          indicateurId,
          input,
          plan.planId,
          context
        );
        if (!saved.success)
          return failure([{ code: saved.error, sourceKey }], saved.cause);
        output.indicateurIdsBySourceKey.set(sourceKey, indicateurId);
        output.conflits.push(
          ...saved.data.conflits.map((conflit) => ({
            sourceKey: entry.sourceKey,
            conflit,
          }))
        );
      }
      return success(output);
    } catch (error) {
      return this.captureFailure(error, sourceKey);
    }
  }

  private validateInput(
    input: PersistPlanIndicateursInput
  ): PersistPlanIndicateursError[] {
    const errors: PersistPlanIndicateursError[] = [];
    if (
      !Number.isSafeInteger(input.collectiviteId) ||
      input.collectiviteId <= 0 ||
      !Array.isArray(input.indicateurs)
    )
      return [{ code: 'INVALID_VALUE' }];
    const keys = new Set<string>();
    for (const entry of input.indicateurs) {
      const targetKeys = Object.values(entry.target ?? {});
      if (
        typeof entry.sourceKey !== 'string' ||
        !entry.sourceKey.trim() ||
        keys.has(entry.sourceKey) ||
        targetKeys.length !== 1 ||
        typeof targetKeys[0] !== 'string' ||
        !targetKeys[0].trim() ||
        (!('ficheSourceKey' in entry.target) &&
          !('axeSourceKey' in entry.target)) ||
        (entry.indicateurId === undefined) ===
          (entry.definition === undefined) ||
        (entry.indicateurId !== undefined &&
          (!Number.isSafeInteger(entry.indicateurId) ||
            entry.indicateurId <= 0)) ||
        (entry.definition !== undefined &&
          !createIndicateurInputSchema.safeParse({
            ...entry.definition,
            collectiviteId: input.collectiviteId,
            ficheId: undefined,
          }).success) ||
        (entry.valeurs !== undefined &&
          (!['collectivite', 'plan'].includes(entry.valeurs.scope) ||
            !Array.isArray(entry.valeurs.values))) ||
        (entry.valeurs?.scope === 'plan' && !input.source)
      )
        errors.push({ code: 'INVALID_VALUE', sourceKey: entry.sourceKey });
      keys.add(entry.sourceKey);
    }
    return errors;
  }

  private resolveTargetId(
    entry: PersistPlanIndicateurEntry,
    plan: CreatePlanAggregateOutput
  ): number | undefined {
    return 'ficheSourceKey' in entry.target
      ? plan.ficheIdsBySourceKey.get(entry.target.ficheSourceKey)
      : plan.axeIdsBySourceKey.get(entry.target.axeSourceKey);
  }

  private async resolveIndicateur(
    entry: PersistPlanIndicateurEntry,
    collectiviteId: number,
    context: PersistPlanIndicateursContext
  ): Promise<number> {
    if (entry.indicateurId !== undefined) return entry.indicateurId;
    return this.createIndicateur.createIndicateurPerso(
      createIndicateurInputSchema.parse({
        ...entry.definition,
        collectiviteId,
        ficheId: undefined,
      }),
      context
    );
  }

  private async persistValues(
    entry: PersistPlanIndicateurEntry,
    indicateurId: number,
    input: PersistPlanIndicateursInput,
    planId: number,
    context: PersistPlanIndicateursContext
  ) {
    if (!entry.valeurs?.values.length) return success({ conflits: [] });
    const valeurs = entry.valeurs.values.map(
      ({ dateValeur, periodicite, resultat, objectif }) => ({
        dateValeur,
        periodicite,
        resultat,
        objectif,
        indicateurId,
      })
    );
    if (entry.valeurs.scope === 'plan' && input.source) {
      return this.sources.fillMissing(
        { planId, sourceId: input.source.source.id, valeurs },
        context
      );
    }
    return this.values.fillMissing(
      valeurs.map((value) => ({
        ...value,
        collectiviteId: input.collectiviteId,
      })),
      context
    );
  }

  private captureFailure(
    error: unknown,
    sourceKey?: string
  ): Result<never, PersistPlanIndicateursError[]> {
    if (isFailedResult<PersistPlanIndicateursError['code']>(error)) {
      return failure([{ code: error.error, sourceKey }], error.cause);
    }
    const code =
      error instanceof ForbiddenException
        ? 'UNAUTHORIZED'
        : error instanceof BadRequestException
        ? 'INVALID_VALUE'
        : 'DATABASE_ERROR';
    if (code === 'DATABASE_ERROR')
      this.logger.error(
        'Impossible de persister les indicateurs du plan',
        error
      );
    return failure(
      [{ code, sourceKey }],
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
