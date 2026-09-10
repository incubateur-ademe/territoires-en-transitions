import { Injectable } from '@nestjs/common';
import IndicateurSourcesService from '@tet/backend/indicateurs/sources/indicateur-sources.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  COLLECTIVITE_SOURCE_ID,
  IndicateurDefinition,
  IndicateurValeur,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import type {
  CalculSourceGroups,
  CalculSourceValeur,
  IndicateurFormula,
  RecomputedIndicateurValeurs,
  SourceCalculPolicy,
} from './calcul-indicateur.types';
import { ComputeValeursRepository } from './compute-valeurs.repository';
import {
  evaluateCalculIndicateur,
  getCalculatedValeurIdentity,
} from './evaluate-calcul-indicateur.rules';
import {
  fillCalculSourceGroups,
  getCalculSourceGroupKey,
  normalizeCalculSourceId,
} from './group-calcul-indicateur-sources.rules';
import IndicateurExpressionService from './indicateur-expression.service';
import {
  dehydrateIndicateurPeriod,
  hydrateIndicateurPeriod,
} from './indicateur-period.adapter';
import { IndicateurValeurLockRepository } from './indicateur-valeur-lock.repository';
import { LoadIndicateurCalculGraphService } from './load-indicateur-calcul-graph.service';

type ReconciledValeurs = Pick<
  RecomputedIndicateurValeurs,
  'valeursToUpsert' | 'valeurIdsToDelete'
>;

@Injectable()
export default class ComputeValeursService {
  static DEFAULT_SOURCE_CALCUL_IDS = ['insee'];

  constructor(
    private readonly repository: ComputeValeursRepository,
    private readonly graphService: LoadIndicateurCalculGraphService,
    private readonly indicateurSourceService: IndicateurSourcesService,
    private readonly expressions: IndicateurExpressionService,
    private readonly valeurLockRepository: IndicateurValeurLockRepository
  ) {}

  async getSourcesCalcul(tx?: Transaction): Promise<SourceCalculPolicy[]> {
    const stored = await this.repository.listSourceCalculs(tx);
    return [
      ...stored.map(({ sourceId, sourceCalculIds }) => ({
        sourceId,
        sourceCalculIds: [
          ...new Set([
            ...(sourceCalculIds?.filter(Boolean) ?? []),
            ...ComputeValeursService.DEFAULT_SOURCE_CALCUL_IDS.filter(
              (id) => id !== sourceId
            ),
          ]),
        ],
      })),
      {
        sourceId: COLLECTIVITE_SOURCE_ID,
        sourceCalculIds: ComputeValeursService.DEFAULT_SOURCE_CALCUL_IDS,
      },
    ];
  }

  async getAllSourceIdentifiants(
    definitions?: IndicateurDefinition[]
  ): Promise<string[]> {
    if (!definitions) {
      const result = await this.graphService.loadAllComputedDefinitions();
      if (!result.success) throw result.cause ?? result.error;
      definitions = result.data;
    }
    return [
      ...new Set(
        definitions.flatMap((definition) =>
          this.graphService
            .getFormula(definition)
            .references.map(({ identifiant }) => identifiant)
        )
      ),
    ];
  }

  async updateCalculatedIndicateurValeurs(
    valeurs: IndicateurValeur[],
    tx: Transaction
  ): Promise<IndicateurValeurCreate[]> {
    return (await this.computeDependants(valeurs, new Set(), tx))
      .valeursToUpsert;
  }

  /** Deleted rows identify affected groups; only surviving rows supply values. */
  async reconcileDeletedIndicateurValeurs(
    valeurs: IndicateurValeur[],
    tx: Transaction
  ): Promise<ReconciledValeurs> {
    if (!valeurs.length) return { valeursToUpsert: [], valeurIdsToDelete: [] };
    const { valeursToUpsert, groupsByIndicateur } =
      await this.computeDependants(
        valeurs,
        new Set(valeurs.map(({ id }) => id)),
        tx
      );
    const groups = [...groupsByIndicateur.values()].flatMap(Object.values);
    if (!groups.length) return { valeursToUpsert, valeurIdsToDelete: [] };
    const stored = await this.repository.listStoredCalculatedValeurs(
      {
        indicateurIds: [...groupsByIndicateur.keys()],
        collectiviteIds: [
          ...new Set(groups.map(({ collectiviteId }) => collectiviteId)),
        ],
        dateValeurs: [
          ...new Set(
            groups.map(({ period }) => dehydrateIndicateurPeriod(period))
          ),
        ],
      },
      tx
    );
    const expected = new Set(valeursToUpsert.map(getCalculatedValeurIdentity));
    const valeurIdsToDelete = stored.flatMap((valeur) => {
      if (!valeur.periodicite) return [];
      const period = hydrateIndicateurPeriod({
        periodicite: valeur.periodicite,
        dateValeur: valeur.dateValeur,
      });
      const key = getCalculSourceGroupKey(
        valeur.collectiviteId,
        period,
        valeur.sourceId,
        valeur.metadonneeId
      );
      return groupsByIndicateur.get(valeur.indicateurId)?.[key] &&
        !expected.has(getCalculatedValeurIdentity(valeur))
        ? [valeur.id]
        : [];
    });
    return { valeursToUpsert, valeurIdsToDelete };
  }

  private async computeDependants(
    valeurs: IndicateurValeur[],
    deletedIds: ReadonlySet<number>,
    tx: Transaction
  ) {
    const graphResult = await this.graphService.loadDependants(
      [...new Set(valeurs.map(({ indicateurId }) => indicateurId))],
      { tx }
    );
    if (!graphResult.success) throw graphResult.cause ?? graphResult.error;
    const { formulas, sourceDefinitions } = graphResult.data;
    const groupsByIndicateur = new Map<number, CalculSourceGroups>();
    if (!formulas.length) return { valeursToUpsert: [], groupsByIndicateur };
    const metadonnees =
      await this.indicateurSourceService.getAllIndicateurSourceMetadonnees(tx);
    const policies = await this.getSourcesCalcul(tx);
    const definitionsById = new Map(
      sourceDefinitions.map((definition) => [definition.id, definition])
    );
    const sources = valeurs.flatMap<CalculSourceValeur>((valeur) => {
      const definition = definitionsById.get(valeur.indicateurId);
      if (!definition?.identifiantReferentiel) return [];
      const metadonnee = metadonnees.find(
        ({ id }) => id === valeur.metadonneeId
      );
      return [
        {
          ...valeur,
          indicateurIdentifiant: definition.identifiantReferentiel,
          sourceId: normalizeCalculSourceId(metadonnee?.sourceId),
          metadonneeDateVersion: metadonnee?.dateVersion ?? null,
          deleted: deletedIds.has(valeur.id),
          period: hydrateIndicateurPeriod({
            periodicite: valeur.periodicite,
            dateValeur: valeur.dateValeur,
          }),
        },
      ];
    });
    const formulasWithGroups = formulas.map((formula) => {
      const groups = fillCalculSourceGroups(formula, sources, policies);
      groupsByIndicateur.set(formula.definition.id, groups);
      return { formula, groups };
    });
    // Updating an older metadata version must still calculate from the newest
    // stored observation. Re-read every referenced identifier under the same
    // period locks, including identifiers already present in the incoming batch.
    const sourceQueries = formulasWithGroups.flatMap(({ formula, groups }) =>
      Object.values(groups).map((group) => ({
        collectiviteId: group.collectiviteId,
        period: group.period,
        sourceId: group.sourceId,
        metadonneeId: group.metadonneeId,
        identifiants: formula.references.map(({ identifiant }) => identifiant),
        extraSourceCalculIds:
          policies.find(
            (policy) =>
              normalizeCalculSourceId(policy.sourceId) === group.sourceId
          )?.sourceCalculIds ?? ComputeValeursService.DEFAULT_SOURCE_CALCUL_IDS,
      }))
    );
    const storedSources = sourceQueries.length
      ? await this.repository.listSourceValeurs(sourceQueries, tx)
      : [];
    const valeursToUpsert = formulasWithGroups.flatMap(
      ({ formula, groups }) => {
        fillCalculSourceGroups(formula, storedSources, policies, groups, false);
        return this.evaluate(formula, groups);
      }
    );
    return { valeursToUpsert, groupsByIndicateur };
  }

  async recomputeCollectiviteCalculatedIndicateurValeurs(
    collectiviteId: number,
    indicateurIds: number[],
    tx: Transaction
  ): Promise<RecomputedIndicateurValeurs> {
    const graphResult = await this.graphService.loadForRecompute(
      indicateurIds,
      { tx }
    );
    if (!graphResult.success) throw graphResult.cause ?? graphResult.error;
    const { formulas, targetDefinitions, sourceDefinitions } = graphResult.data;
    if (!indicateurIds.length)
      return {
        valeursToUpsert: [],
        valeurIdsToDelete: [],
        indicateurIdentifiants: [],
      };
    const neededIdentifiants = new Set(
      formulas.flatMap(({ references }) =>
        references.map(({ identifiant }) => identifiant)
      )
    );
    const sourceIds = new Set(
      sourceDefinitions
        .filter(
          ({ identifiantReferentiel }) =>
            identifiantReferentiel &&
            neededIdentifiants.has(identifiantReferentiel)
        )
        .map(({ id }) => id)
    );
    const relevantIds = [...new Set([...indicateurIds, ...sourceIds])];
    const discoveredPeriods = await this.repository.listPeriodKeys(
      { collectiviteId, indicateurIds: relevantIds },
      tx
    );
    // Discover keys, acquire all period locks, then re-read the values used by
    // calculation. Writers arriving after discovery perform their own refresh.
    await this.valeurLockRepository.lock(discoveredPeriods, tx);
    const lockedDates = new Set(
      discoveredPeriods.map(({ dateValeur }) => dateValeur)
    );
    const stored = (
      await this.repository.listRelevantValeurs(
        {
          collectiviteId,
          indicateurIds: relevantIds,
          dateValeurs: [...lockedDates],
        },
        tx
      )
    ).filter(({ dateValeur }) => lockedDates.has(dateValeur));
    const sources = stored
      .filter(({ indicateurId }) => sourceIds.has(indicateurId))
      .map<CalculSourceValeur>((valeur) => {
        if (!valeur.indicateurIdentifiant || !valeur.periodicite)
          throw new Error(
            `Impossible d'hydrater la période de la valeur d'indicateur ${valeur.indicateurId}`
          );
        return {
          ...valeur,
          indicateurIdentifiant: valeur.indicateurIdentifiant,
          sourceId: normalizeCalculSourceId(valeur.sourceId),
          deleted: false,
          period: hydrateIndicateurPeriod({
            periodicite: valeur.periodicite,
            dateValeur: valeur.dateValeur,
          }),
        };
      });
    const policies = await this.getSourcesCalcul(tx);
    const valeursToUpsert = formulas.flatMap((formula) =>
      this.evaluate(formula, fillCalculSourceGroups(formula, sources, policies))
    );
    const expected = new Set(valeursToUpsert.map(getCalculatedValeurIdentity));
    const targetIds = new Set(indicateurIds);
    return {
      valeursToUpsert,
      valeurIdsToDelete: stored
        .filter(
          (valeur) =>
            targetIds.has(valeur.indicateurId) &&
            valeur.calculAuto === true &&
            !expected.has(getCalculatedValeurIdentity(valeur))
        )
        .map(({ id }) => id),
      indicateurIdentifiants: targetDefinitions.flatMap(
        ({ identifiantReferentiel }) =>
          identifiantReferentiel ? [identifiantReferentiel] : []
      ),
    };
  }

  private evaluate(
    formula: IndicateurFormula,
    groups: CalculSourceGroups
  ): IndicateurValeurCreate[] {
    return evaluateCalculIndicateur(formula, groups, (expression, values) =>
      this.expressions.parseAndEvaluateExpression(expression, values)
    );
  }
}
