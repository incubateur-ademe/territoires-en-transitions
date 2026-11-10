import { Injectable } from '@nestjs/common';
import IndicateurSourcesService from '@tet/backend/indicateurs/sources/indicateur-sources.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
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
import { evaluateCalculIndicateur } from './evaluate-calcul-indicateur.rules';
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
  ): Promise<string[]> {
    if (!indicateurs) {
      const result = await this.graphService.loadAllComputedIndicateurs();
      if (!result.success) throw result.cause ?? result.error;
      indicateurs = result.data;
    }
    return [
      ...new Set(
        indicateurs.flatMap((indicateur) =>
          this.graphService
            .getFormula(indicateur)
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
    const { formulas, sourceIndicateurs } = graphResult.data;
    const groupsByIndicateur = new Map<number, CalculSourceGroups>();
    if (!formulas.length) return { valeursToUpsert: [], groupsByIndicateur };
    const metadonnees =
      await this.indicateurSourceService.getAllIndicateurSourceMetadonnees(tx);
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

  /** Recalcule plusieurs collectivités à la fois : le graphe et les règles ne sont lus qu'une fois. */
  async recomputeCollectivitesCalculatedIndicateurValeurs(
    collectiviteIds: number[],
    indicateurIds: number[],
    tx: Transaction
  ): Promise<RecomputedIndicateurValeurs> {
    const graphResult = await this.graphService.loadForRecompute(
      indicateurIds,
      { tx }
    );
    if (!graphResult.success) throw graphResult.cause ?? graphResult.error;
    const { formulas, targetIndicateurs, sourceIndicateurs } = graphResult.data;
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
            ...new Set(discoveredPeriodes.map(({ dateValeur }) => dateValeur)),
          ],
        },
        tx
      )
    ).filter(({ collectiviteId, dateValeur }) =>
      lockedPeriodes.has(periodeKey(collectiviteId, dateValeur))
    );
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
          periode: IndicateurPeriodes.fromDateValeur(
            valeur.periodicite,
            valeur.dateValeur
          ),
        };
      });
    const policies = await this.getSourcesCalcul(tx);
    const valeursToUpsert = formulas.flatMap((formula) =>
      this.evaluate(formula, fillCalculSourceGroups(formula, sources, policies))
    );
    const expected = new Set(
      valeursToUpsert.map(IndicateurValeursRules.getIdentity)
    );
    const targetIds = new Set(indicateurIds);
    return {
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
