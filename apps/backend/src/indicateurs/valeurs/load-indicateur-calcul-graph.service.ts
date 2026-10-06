import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { IndicateurDefinition } from '@tet/domain/indicateurs';
import { IndicateurDefinitionLockRepository } from '../definitions/indicateur-definition-lock.repository';
import { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import type { IndicateurFormula } from './calcul-indicateur.types';
import IndicateurExpressionService from './indicateur-expression.service';

type CalculGraph = {
  formulas: IndicateurFormula[];
  sourceDefinitions: IndicateurDefinition[];
  targetDefinitions: IndicateurDefinition[];
};
type GraphContext = { tx: Transaction };
type GraphResult = Result<CalculGraph, 'LOAD_CALCUL_GRAPH_FAILED'>;

/** Loads and validates one stable formula graph under the caller's transaction. */
@Injectable()
export class LoadIndicateurCalculGraphService {
  constructor(
    private readonly definitions: ListPlatformDefinitionsRepository,
    private readonly locks: IndicateurDefinitionLockRepository,
    private readonly expressions: IndicateurExpressionService
  ) {}

  getFormula(definition: IndicateurDefinition): IndicateurFormula {
    return {
      definition,
      references: definition.valeurCalcule
        ? this.expressions.extractNeededSourceIndicateursFromFormula(
            definition.valeurCalcule
          )
        : [],
    };
  }

  async loadAllComputedDefinitions(): Promise<
    Result<IndicateurDefinition[], 'LOAD_CALCUL_GRAPH_FAILED'>
  > {
    try {
      return success(
        await this.definitions.listPlatformDefinitionsHavingComputedValue()
      );
    } catch (error) {
      return failure(
        'LOAD_CALCUL_GRAPH_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async loadDependants(
    indicateurIds: number[],
    { tx }: GraphContext
  ): Promise<GraphResult> {
    try {
      // The graph lock precedes every read, including source identities.
      await this.locks.lockForValueWrite(tx);
      const sourceDefinitions = await this.definitions.listPlatformDefinitions(
        { indicateurIds },
        tx
      );
      const sourceIdentifiants = sourceDefinitions.flatMap((definition) =>
        definition.identifiantReferentiel
          ? [definition.identifiantReferentiel]
          : []
      );
      if (!sourceIdentifiants.length)
        return success({
          formulas: [],
          sourceDefinitions,
          targetDefinitions: [],
        });
      const candidates =
        await this.definitions.listPlatformDefinitionsHavingComputedValue(
          { identifiantsReferentiel: sourceIdentifiants },
          tx
        );
      const graph = await this.lockGraph(
        candidates,
        sourceDefinitions,
        candidates.map(({ id }) => id),
        tx
      );
      const changedIdentifiants = new Set(sourceIdentifiants);
      graph.formulas = graph.formulas.filter(({ references }) =>
        references.some(({ identifiant }) =>
          changedIdentifiants.has(identifiant)
        )
      );
      this.assertCompatibleSources(graph);
      // Hydration only needs the original updated source definitions.
      return success({ ...graph, sourceDefinitions });
    } catch (error) {
      return failure(
        'LOAD_CALCUL_GRAPH_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async loadForRecompute(
    indicateurIds: number[],
    { tx }: GraphContext
  ): Promise<GraphResult> {
    try {
      await this.locks.lockForValueWrite(tx);
      if (!indicateurIds.length)
        return success({
          formulas: [],
          sourceDefinitions: [],
          targetDefinitions: [],
        });
      const candidates = await this.definitions.listPlatformDefinitions(
        { indicateurIds },
        tx
      );
      const graph = await this.lockGraph(candidates, [], indicateurIds, tx);
      this.assertCompatibleSources(graph);
      return success(graph);
    } catch (error) {
      return failure(
        'LOAD_CALCUL_GRAPH_FAILED',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async lockGraph(
    candidates: IndicateurDefinition[],
    knownSources: IndicateurDefinition[],
    targetIds: number[],
    tx: Transaction
  ): Promise<CalculGraph> {
    const sourceIdentifiants = [
      ...new Set(
        candidates.flatMap((definition) =>
          this.getFormula(definition).references.map(
            ({ identifiant }) => identifiant
          )
        )
      ),
    ];
    const knownByIdentifiant = new Map(
      [...knownSources, ...candidates].map((definition) => [
        definition.identifiantReferentiel,
        definition,
      ])
    );
    const missingIdentifiants = sourceIdentifiants.filter(
      (identifiant) => !knownByIdentifiant.has(identifiant)
    );
    const missingDefinitions = missingIdentifiants.length
      ? await this.definitions.listPlatformDefinitions(
          { identifiantsReferentiel: missingIdentifiants },
          tx
        )
      : [];
    const sourceDefinitions = sourceIdentifiants.flatMap((identifiant) => {
      const definition =
        knownByIdentifiant.get(identifiant) ??
        missingDefinitions.find(
          (item) => item.identifiantReferentiel === identifiant
        );
      return definition ? [definition] : [];
    });
    const lockedDefinitions = await this.locks.lockDefinitions(
      [
        ...new Set([
          ...knownSources.map(({ id }) => id),
          ...targetIds,
          ...sourceDefinitions.map(({ id }) => id),
        ]),
      ],
      tx
    );
    const targetIdSet = new Set(targetIds);
    const targetDefinitions = lockedDefinitions.filter(
      (definition) =>
        targetIdSet.has(definition.id) &&
        definition.collectiviteId === null &&
        Boolean(definition.identifiantReferentiel)
    );
    return {
      targetDefinitions,
      formulas: targetDefinitions
        .filter((definition) => Boolean(definition.valeurCalcule))
        .map((definition) => this.getFormula(definition)),
      sourceDefinitions: lockedDefinitions,
    };
  }

  private assertCompatibleSources(graph: CalculGraph): void {
    const byIdentifiant = new Map(
      graph.sourceDefinitions.map((definition) => [
        definition.identifiantReferentiel,
        definition,
      ])
    );
    for (const { definition: target, references } of graph.formulas) {
      for (const { identifiant } of references) {
        const source = byIdentifiant.get(identifiant);
        if (!source)
          throw new Error(
            `La formule dépend d'un indicateur inconnu : ${identifiant}`
          );
        if (source.periodicite !== target.periodicite) {
          throw new Error(
            `Le calcul de l'indicateur ${
              target.identifiantReferentiel ?? target.id
            } (${
              target.periodicite
            }) requiert une agrégation explicite pour ${identifiant} (${
              source.periodicite
            })`
          );
        }
      }
    }
  }
}
