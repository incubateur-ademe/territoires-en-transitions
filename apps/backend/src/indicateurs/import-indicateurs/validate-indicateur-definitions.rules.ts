import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { DepGraph } from 'dependency-graph';
import type { ImportIndicateurDefinitionType } from './import-indicateur-definition.dto';
import {
  formatInvalidExpressionMessage,
  type ImportIndicateurDefinitionError,
} from './import-indicateur-definition.errors';
import type { ImportObjectifType } from './import-indicateur-objectif.dto';

export type ImportExpressionValidators = {
  indicateurs: {
    extractNeededSourceIndicateursFromFormula: (
      formula: string
    ) => Result<readonly { identifiant: string }[], string>;
    parseExpression: (formula: string) => Result<unknown, string>;
  };
  personnalisations: { validateExpression: (expression: string) => unknown };
};

function toInvalidCalculationFailure({
  identifiantReferentiel,
  valeurCalcule,
  err,
}: {
  identifiantReferentiel: string;
  valeurCalcule: string;
  err: unknown;
}): Result<never, 'INVALID_EXPRESSION'> {
  return failure(
    'INVALID_EXPRESSION',
    new Error(
      formatInvalidExpressionMessage({
        label: `l'expression de calcul de l'indicateur ${identifiantReferentiel}`,
        expression: valeurCalcule,
        err,
      })
    )
  );
}

export function validateIndicateurDefinitions(
  definitions: ImportIndicateurDefinitionType[],
  validators: ImportExpressionValidators
): Result<void, ImportIndicateurDefinitionError> {
  const byIdentifiant = new Map<string, ImportIndicateurDefinitionType>();
  for (const definition of definitions) {
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
  const expressionErrors: string[] = [];
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
    const { valeurCalcule } = indicateur;
    if (valeurCalcule) {
      const sourcesResult =
        validators.indicateurs.extractNeededSourceIndicateursFromFormula(
          valeurCalcule
        );
      if (!sourcesResult.success) {
        return toInvalidCalculationFailure({
          identifiantReferentiel: indicateur.identifiantReferentiel,
          valeurCalcule,
          err: sourcesResult.cause ?? new Error(sourcesResult.error),
        });
      }
      const sources = sourcesResult.data;
      for (const source of sources) {
        if (source.identifiant === indicateur.identifiantReferentiel) {
          return toInvalidCalculationFailure({
            identifiantReferentiel: indicateur.identifiantReferentiel,
            valeurCalcule,
            err: new Error(
              `Indicateur ${indicateur.identifiantReferentiel} cannot depend on itself in formula`
            ),
          });
        }
        const definition = byIdentifiant.get(source.identifiant);
        if (!definition) {
          return toInvalidCalculationFailure({
            identifiantReferentiel: indicateur.identifiantReferentiel,
            valeurCalcule,
            err: new Error(
              `Indicateur ${indicateur.identifiantReferentiel} depends on unknown indicateur ${source.identifiant}`
            ),
          });
        }
        if (definition.periodicite !== indicateur.periodicite) {
          return toInvalidCalculationFailure({
            identifiantReferentiel: indicateur.identifiantReferentiel,
            valeurCalcule,
            err: new Error(
              `Indicateur ${indicateur.identifiantReferentiel} (${indicateur.periodicite}) cannot depend on ${source.identifiant} (${definition.periodicite}) with a different periodicite`
            ),
          });
        }
      }
      const parsed = validators.indicateurs.parseExpression(valeurCalcule);
      if (!parsed.success) {
        return toInvalidCalculationFailure({
          identifiantReferentiel: indicateur.identifiantReferentiel,
          valeurCalcule,
          err: parsed.cause ?? new Error(parsed.error),
        });
      }
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
    }
    for (const [label, expression] of [
      ['cible', indicateur.exprCible],
      ['seuil', indicateur.exprSeuil],
    ]) {
      if (!expression) continue;
      try {
        validators.personnalisations.validateExpression(expression);
      } catch (error) {
        expressionErrors.push(
          formatInvalidExpressionMessage({
            label: `l'expression ${label} de l'indicateur ${indicateur.identifiantReferentiel}`,
            expression,
            err: error,
          })
        );
      }
    }
  }
  if (expressionErrors.length) {
    return failure(
      'INVALID_EXPRESSION',
      new Error(expressionErrors.join('\n\n'))
    );
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
