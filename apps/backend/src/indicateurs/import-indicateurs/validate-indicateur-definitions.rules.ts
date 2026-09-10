import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS } from '@tet/domain/demarches';
import { assertAnnualIndicateurPeriodicite } from '@tet/domain/indicateurs';
import { getErrorMessage } from '@tet/domain/utils';
import { DepGraph } from 'dependency-graph';
import type { ImportIndicateurDefinitionType } from './import-indicateur-definition.dto';
import type { ImportIndicateurDefinitionError } from './import-indicateur-definition.errors';
import type { ImportObjectifType } from './import-indicateur-objectif.dto';

export type ImportExpressionValidators = {
  indicateurs: {
    extractNeededSourceIndicateursFromFormula: (
      formula: string
    ) => readonly { identifiant: string }[];
    parseExpression: (formula: string) => unknown;
  };
  personnalisations: { validateExpression: (expression: string) => unknown };
};

export function validateIndicateurDefinitions(
  definitions: ImportIndicateurDefinitionType[],
  validators: ImportExpressionValidators
): Result<void, ImportIndicateurDefinitionError> {
  const byIdentifiant = new Map<string, ImportIndicateurDefinitionType>();
  for (const definition of definitions) {
    if (
      ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS.includes(
        definition.identifiantReferentiel
      )
    ) {
      try {
        assertAnnualIndicateurPeriodicite(
          definition.periodicite,
          `Le diagnostic PCAET (${definition.identifiantReferentiel})`
        );
      } catch (error) {
        return failure('INVALID_IMPORT', new Error(getErrorMessage(error)));
      }
    }
    if (byIdentifiant.has(definition.identifiantReferentiel)) {
      return failure(
        'INVALID_IMPORT',
        new Error(
          `Duplicate indicateur identifiantReferentiel ${definition.identifiantReferentiel}`
        )
      );
    }
    byIdentifiant.set(definition.identifiantReferentiel, definition);
  }

  const graph = new DepGraph();
  for (const indicateur of definitions) {
    for (const parentIdentifiant of indicateur.parents ?? []) {
      const parent = byIdentifiant.get(parentIdentifiant);
      if (parent && parent.periodicite !== indicateur.periodicite) {
        return failure(
          'INVALID_IMPORT',
          new Error(
            `Indicateur ${indicateur.identifiantReferentiel} (${indicateur.periodicite}) cannot belong to parent ${parentIdentifiant} (${parent.periodicite}) with a different periodicite`
          )
        );
      }
    }
    if (indicateur.valeurCalcule) {
      try {
        const sources =
          validators.indicateurs.extractNeededSourceIndicateursFromFormula(
            indicateur.valeurCalcule
          );
        for (const source of sources) {
          if (source.identifiant === indicateur.identifiantReferentiel) {
            throw new Error(
              `Indicateur ${indicateur.identifiantReferentiel} cannot depend on itself in formula`
            );
          }
          const definition = byIdentifiant.get(source.identifiant);
          if (!definition) {
            throw new Error(
              `Indicateur ${indicateur.identifiantReferentiel} depends on unknown indicateur ${source.identifiant}`
            );
          }
          if (definition.periodicite !== indicateur.periodicite) {
            throw new Error(
              `Indicateur ${indicateur.identifiantReferentiel} (${indicateur.periodicite}) cannot depend on ${source.identifiant} (${definition.periodicite}) with a different periodicite`
            );
          }
        }
        validators.indicateurs.parseExpression(indicateur.valeurCalcule);
        if (!graph.hasNode(indicateur.identifiantReferentiel)) {
          graph.addNode(indicateur.identifiantReferentiel);
        }
        for (const source of sources) {
          if (!graph.hasNode(source.identifiant))
            graph.addNode(source.identifiant);
          graph.addDependency(
            indicateur.identifiantReferentiel,
            source.identifiant
          );
        }
      } catch (error) {
        return failure(
          'INVALID_EXPRESSION',
          new Error(
            `Invalid expression "${indicateur.valeurCalcule}" for indicateur "${
              indicateur.identifiantReferentiel
            }": ${getErrorMessage(error)}`
          )
        );
      }
    }
    for (const [label, expression] of [
      ['cible', indicateur.exprCible],
      ['seuil', indicateur.exprSeuil],
    ]) {
      if (!expression) continue;
      try {
        validators.personnalisations.validateExpression(expression);
      } catch (error) {
        return failure(
          'INVALID_EXPRESSION',
          new Error(
            `Invalid expression ${label} "${expression}" for indicateur "${
              indicateur.identifiantReferentiel
            }": ${getErrorMessage(error)}`
          )
        );
      }
    }
  }
  try {
    graph.overallOrder();
    return success(undefined);
  } catch (error) {
    return failure(
      'INVALID_IMPORT',
      new Error(
        `Circular dependency detected in indicateur definitions: ${getErrorMessage(
          error
        )}`
      )
    );
  }
}

export function validateObjectifIdentifiants(
  objectifs: ImportObjectifType[],
  definitions: Pick<ImportIndicateurDefinitionType, 'identifiantReferentiel'>[]
): Result<void, ImportIndicateurDefinitionError> {
  const known = new Set(
    definitions.map(({ identifiantReferentiel }) => identifiantReferentiel)
  );
  const unknown = [
    ...new Set(
      objectifs
        .map(({ identifiantReferentiel }) => identifiantReferentiel)
        .filter((id) => !known.has(id))
    ),
  ].sort();
  return unknown.length
    ? failure(
        'INVALID_IMPORT',
        new Error(
          `Objectif(s) associé(s) à des indicateurs inconnus: ${unknown.join(
            ', '
          )}`
        )
      )
    : success(undefined);
}
