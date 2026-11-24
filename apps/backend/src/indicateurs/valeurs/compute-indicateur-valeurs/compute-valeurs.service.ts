import { Injectable } from '@nestjs/common';
import IndicateurSourcesService from '@tet/backend/indicateurs/sources/indicateur-sources.service';
import { catchDatabaseFailure } from '@tet/backend/utils/database/catch-database-failure';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import {
  COLLECTIVITE_SOURCE_ID,
  INDICATEUR_SOURCES_REQUIRING_DIRECT_VALUE_PER_FIELD,
  IndicateurPredefini,
  IndicateurValeur,
  IndicateurPeriodes,
  IndicateurValeurCreate,
  isIndicateurPredefini,
} from '@tet/domain/indicateurs';
import type {
  CalculSourceGroups,
  CalculSourceValeur,
  IndicateurFormula,
  RecomputedIndicateurValeurs,
  SourceCalculPolicy,
} from './calcul-indicateur.types';
import { ComputeValeursRepository } from './compute-valeurs.repository';
import type { ComputeValeursError } from './compute-valeurs.errors';
import {
  type CalculEvaluation,
  planCalculIndicateur,
  roundCalculResult,
} from './plan-calcul-indicateur.rules';
import type { IndicateurExpressionError } from '../indicateur-expression.errors';
import { IndicateurValeursRules } from '../indicateur-valeurs.rules';
import {
  fillCalculSourceGroups,
  getCalculSourceGroupKey,
  normalizeCalculSourceId,
} from './group-calcul-indicateur-sources.rules';
import IndicateurExpressionService from '../indicateur-expression.service';
import { IndicateurValeurLockRepository } from '../indicateur-valeur-lock.repository';
import { LoadIndicateurCalculGraphService } from './load-indicateur-calcul-graph.service';

type ReconciledValeurs = Pick<
  RecomputedIndicateurValeurs,
  'valeursToUpsert' | 'valeurIdsToDelete'
>;

type ComputedDependants = {
  valeursToUpsert: IndicateurValeurCreate[];
  groupsByIndicateur: Map<number, CalculSourceGroups>;
};

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
        requiresDirectValueForField:
          INDICATEUR_SOURCES_REQUIRING_DIRECT_VALUE_PER_FIELD.includes(
            sourceId
          ),
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
        requiresDirectValueForField: false,
        sourceCalculIds: ComputeValeursService.DEFAULT_SOURCE_CALCUL_IDS,
      },
    ];
  }

  async getAllSourceIdentifiants(
    indicateurs?: IndicateurPredefini[]
  ): Promise<Result<string[], ComputeValeursError>> {
    if (!indicateurs) {
      const result = await this.graphService.loadAllComputedIndicateurs();
      if (!result.success) return result;
      indicateurs = result.data;
    }
    const formulas = combineResults(
      indicateurs.map((indicateur) => this.graphService.getFormula(indicateur))
    );
    if (!formulas.success) return formulas;
    return success([
      ...new Set(
        formulas.data.flatMap(({ references }) =>
          references.map(({ identifiant }) => identifiant)
        )
      ),
    ]);
  }

  async updateCalculatedIndicateurValeurs(
    valeurs: IndicateurValeur[],
    tx: Transaction
  ): Promise<Result<IndicateurValeurCreate[], ComputeValeursError>> {
    const dependants = await this.computeDependants(valeurs, new Set(), tx);
    if (!dependants.success) return dependants;
    return success(dependants.data.valeursToUpsert);
  }

  /** Deleted rows identify affected groups; only surviving rows supply values. */
  async reconcileDeletedIndicateurValeurs(
    valeurs: IndicateurValeur[],
    tx: Transaction
  ): Promise<Result<ReconciledValeurs, ComputeValeursError>> {
    if (!valeurs.length)
      return success({ valeursToUpsert: [], valeurIdsToDelete: [] });
    const dependants = await this.computeDependants(
      valeurs,
      new Set(valeurs.map(({ id }) => id)),
      tx
    );
    if (!dependants.success) return dependants;
    const { valeursToUpsert, groupsByIndicateur } = dependants.data;
    const groups = [...groupsByIndicateur.values()].flatMap(Object.values);
    if (!groups.length)
      return success({ valeursToUpsert, valeurIdsToDelete: [] });
    return catchDatabaseFailure(async () => {
      const stored = await this.repository.listStoredCalculatedValeurs(
        {
          indicateurIds: [...groupsByIndicateur.keys()],
          collectiviteIds: [
            ...new Set(groups.map(({ collectiviteId }) => collectiviteId)),
          ],
          dateValeurs: [
            ...new Set(
              groups.map(({ periode }) =>
                IndicateurPeriodes.toDateValeur(periode)
              )
            ),
          ],
        },
        tx
      );
      const expected = new Set(
        valeursToUpsert.map(IndicateurValeursRules.getIdentity)
      );
      const valeurIdsToDelete = stored.flatMap((valeur) => {
        if (!valeur.periodicite) return [];
        const periode = IndicateurPeriodes.fromDateValeur(
          valeur.periodicite,
          valeur.dateValeur
        );
        const key = getCalculSourceGroupKey(
          valeur.collectiviteId,
          periode,
          valeur.sourceId,
          valeur.metadonneeId
        );
        return groupsByIndicateur.get(valeur.indicateurId)?.[key] &&
          !expected.has(IndicateurValeursRules.getIdentity(valeur))
          ? [valeur.id]
          : [];
      });
      return success({ valeursToUpsert, valeurIdsToDelete });
    });
  }

  private async computeDependants(
    valeurs: IndicateurValeur[],
    deletedIds: ReadonlySet<number>,
    tx: Transaction
  ): Promise<Result<ComputedDependants, ComputeValeursError>> {
    const graphResult = await this.graphService.loadDependants(
      [...new Set(valeurs.map(({ indicateurId }) => indicateurId))],
      { tx }
    );
    if (!graphResult.success) return graphResult;
    const { formulas, sourceIndicateurs } = graphResult.data;
    const groupsByIndicateur = new Map<number, CalculSourceGroups>();
    if (!formulas.length)
      return success({ valeursToUpsert: [], groupsByIndicateur });
    return catchDatabaseFailure(async () => {
      const metadonnees =
        await this.indicateurSourceService.getAllIndicateurSourceMetadonnees(
          tx
        );
      const policies = await this.getSourcesCalcul(tx);
      const indicateursById = new Map(
        sourceIndicateurs.map((indicateur) => [indicateur.id, indicateur])
      );
      const sources = valeurs.flatMap<CalculSourceValeur>((valeur) => {
        const indicateur = indicateursById.get(valeur.indicateurId);
        if (!indicateur || !isIndicateurPredefini(indicateur)) return [];
        const metadonnee = metadonnees.find(
          ({ id }) => id === valeur.metadonneeId
        );
        return [
          {
            ...valeur,
            indicateurIdentifiant: indicateur.identifiantReferentiel,
            sourceId: normalizeCalculSourceId(metadonnee?.sourceId),
            metadonneeDateVersion: metadonnee?.dateVersion ?? null,
            deleted: deletedIds.has(valeur.id),
            periode: IndicateurPeriodes.fromDateValeur(
              valeur.periodicite,
              valeur.dateValeur
            ),
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
          periode: group.periode,
          sourceId: group.sourceId,
          metadonneeId: group.metadonneeId,
          identifiants: formula.references.map(
            ({ identifiant }) => identifiant
          ),
          extraSourceCalculIds:
            policies.find(
              (policy) =>
                normalizeCalculSourceId(policy.sourceId) === group.sourceId
            )?.sourceCalculIds ??
            ComputeValeursService.DEFAULT_SOURCE_CALCUL_IDS,
        }))
      );
      const storedSources = sourceQueries.length
        ? await this.repository.listSourceValeurs(sourceQueries, tx)
        : [];
      const evaluated = combineResults(
        formulasWithGroups.map(({ formula, groups }) => {
          fillCalculSourceGroups(
            formula,
            storedSources,
            policies,
            groups,
            false
          );
          return this.evaluate(formula, groups);
        })
      );
      if (!evaluated.success) return evaluated;
      return success({
        valeursToUpsert: evaluated.data.flat(),
        groupsByIndicateur,
      });
    });
  }

  /** Recalcule plusieurs collectivités à la fois : le graphe et les règles ne sont lus qu'une fois. */
  async recomputeCollectivitesCalculatedIndicateurValeurs(
    collectiviteIds: number[],
    indicateurIds: number[],
    tx: Transaction
  ): Promise<Result<RecomputedIndicateurValeurs, ComputeValeursError>> {
    const graphResult = await this.graphService.loadForRecompute(
      indicateurIds,
      { tx }
    );
    if (!graphResult.success) return graphResult;
    const { formulas, targetIndicateurs, sourceIndicateurs } = graphResult.data;
    if (!indicateurIds.length)
      return success({
        valeursToUpsert: [],
        valeurIdsToDelete: [],
        indicateurIdentifiants: [],
      });
    return catchDatabaseFailure(async () => {
      const neededIdentifiants = new Set(
        formulas.flatMap(({ references }) =>
          references.map(({ identifiant }) => identifiant)
        )
      );
      const sourceIds = new Set(
        sourceIndicateurs
          .filter(
            ({ identifiantReferentiel }) =>
              identifiantReferentiel &&
              neededIdentifiants.has(identifiantReferentiel)
          )
          .map(({ id }) => id)
      );
      const relevantIds = [...new Set([...indicateurIds, ...sourceIds])];
      const discoveredPeriodes = await this.repository.listPeriodeKeys(
        { collectiviteIds, indicateurIds: relevantIds },
        tx
      );
      // Discover keys, acquire all period locks, then re-read the values used by
      // calculation. Writers arriving after discovery perform their own refresh.
      await this.valeurLockRepository.lock(discoveredPeriodes, tx);
      const periodeKey = (collectiviteId: number, dateValeur: string) =>
        `${collectiviteId}:${dateValeur}`;
      // A period locked for one collectivité does not cover the others.
      const lockedPeriodes = new Set(
        discoveredPeriodes.map(({ collectiviteId, dateValeur }) =>
          periodeKey(collectiviteId, dateValeur)
        )
      );
      const stored = (
        await this.repository.listRelevantValeurs(
          {
            collectiviteIds,
            indicateurIds: relevantIds,
            dateValeurs: [
              ...new Set(
                discoveredPeriodes.map(({ dateValeur }) => dateValeur)
              ),
            ],
          },
          tx
        )
      ).filter(({ collectiviteId, dateValeur }) =>
        lockedPeriodes.has(periodeKey(collectiviteId, dateValeur))
      );
      const sourceValeurs = stored.filter(({ indicateurId }) =>
        sourceIds.has(indicateurId)
      );
      const unhydratable = sourceValeurs.find(
        ({ indicateurIdentifiant, periodicite }) =>
          !indicateurIdentifiant || !periodicite
      );
      if (unhydratable)
        return failure(
          'COMPUTE_VALEURS_FAILED',
          new Error(
            `Impossible d'hydrater la période de la valeur d'indicateur ${unhydratable.indicateurId}`
          )
        );
      const sources = sourceValeurs.flatMap<CalculSourceValeur>((valeur) =>
        valeur.indicateurIdentifiant && valeur.periodicite
          ? [
              {
                ...valeur,
                indicateurIdentifiant: valeur.indicateurIdentifiant,
                sourceId: normalizeCalculSourceId(valeur.sourceId),
                deleted: false,
                periode: IndicateurPeriodes.fromDateValeur(
                  valeur.periodicite,
                  valeur.dateValeur
                ),
              },
            ]
          : []
      );
      const policies = await this.getSourcesCalcul(tx);
      const evaluated = combineResults(
        formulas.map((formula) =>
          this.evaluate(
            formula,
            fillCalculSourceGroups(formula, sources, policies)
          )
        )
      );
      if (!evaluated.success) return evaluated;
      const valeursToUpsert = evaluated.data.flat();
      const expected = new Set(
        valeursToUpsert.map(IndicateurValeursRules.getIdentity)
      );
      const targetIds = new Set(indicateurIds);
      return success({
        valeursToUpsert,
        valeurIdsToDelete: stored
          .filter(
            (valeur) =>
              targetIds.has(valeur.indicateurId) &&
              valeur.calculAuto === true &&
              !expected.has(IndicateurValeursRules.getIdentity(valeur))
          )
          .map(({ id }) => id),
        indicateurIdentifiants: targetIndicateurs.flatMap(
          ({ identifiantReferentiel }) =>
            identifiantReferentiel ? [identifiantReferentiel] : []
        ),
      });
    });
  }

  private evaluate(
    formula: IndicateurFormula,
    groups: CalculSourceGroups
  ): Result<IndicateurValeurCreate[], IndicateurExpressionError> {
    return combineResults(
      planCalculIndicateur(formula, groups).map(
        ({ valeur, resultat, objectif }) => {
          const resultatEvaluation = this.evaluateField(resultat);
          if (!resultatEvaluation.success) return resultatEvaluation;
          const objectifEvaluation = this.evaluateField(objectif);
          if (!objectifEvaluation.success) return objectifEvaluation;
          return success({
            ...valeur,
            resultat: resultatEvaluation.data,
            objectif: objectifEvaluation.data,
          });
        }
      )
    );
  }

  private evaluateField(
    evaluation: CalculEvaluation | null
  ): Result<number | null, IndicateurExpressionError> {
    if (!evaluation) return success(null);
    const result = this.expressions.parseAndEvaluateExpression(
      evaluation.expression,
      evaluation.values
    );
    if (!result.success) return result;
    return success(roundCalculResult(result.data, evaluation.precision));
  }
}
