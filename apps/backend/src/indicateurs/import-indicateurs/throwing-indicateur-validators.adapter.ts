import { getDataOrThrow, Result } from '@tet/backend/utils/result.type';
import type { ImportExpressionValidators } from './validate-indicateur-definitions.rules';

type IndicateurExpressionAnalyzer = {
  extractNeededSourceIndicateursFromFormula: (
    formula: string
  ) => Result<readonly { identifiant: string }[], unknown>;
  parseExpression: (formula: string) => Result<unknown, unknown>;
};

export const toThrowingIndicateurValidators = (
  analyzer: IndicateurExpressionAnalyzer
): ImportExpressionValidators['indicateurs'] => ({
  extractNeededSourceIndicateursFromFormula: (formula) =>
    getDataOrThrow(analyzer.extractNeededSourceIndicateursFromFormula(formula)),
  parseExpression: (formula) =>
    getDataOrThrow(analyzer.parseExpression(formula)),
});
