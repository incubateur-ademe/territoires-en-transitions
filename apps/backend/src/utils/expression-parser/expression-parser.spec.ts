import { getFormmattedErrors } from '@tet/backend/utils/expression-parser/get-formatted-errors.utils';
import { CstNode } from 'chevrotain';
import { ExpressionParser } from './expression-parser';
import { getExpressionVisitor } from './expression-visitor';

// Exemple de parser dérivé du parser de base
class TestParser extends ExpressionParser {
  constructor() {
    super([]);
    try {
      this.performSelfAnalysis();
    } catch (err) {
      console.error(err);
    }
  }
}
const parser = new TestParser();

// et le visiteur associé
class TestVisitor extends getExpressionVisitor(
  parser.getBaseCstVisitorConstructor()
) {
  constructor() {
    super();
    this.validateVisitor();
  }
}
const visitor = new TestVisitor();

function parseExpression(inputText: string): CstNode {
  const lexingResult = parser.lexer.tokenize(inputText);
  parser.input = lexingResult.tokens;
  const cst = parser.statement();

  if (parser.errors && parser.errors.length > 0) {
    throw new Error(getFormmattedErrors(parser.errors), {
      cause: parser.errors,
    });
  }
  return cst;
}

// décommenter (et lancer les tests) pour màj la doc
//import { generateDiagrams } from './generate-diagrams';
//generateDiagrams(parser, __dirname);

function parseAndEvaluateExpression(
  inputText: string
): number | boolean | string | null {
  const cst = parseExpression(inputText);
  return visitor.visit(cst) as string | number | boolean | null;
}

describe('ExpressionParser', () => {
  describe('parseAndEvaluateExpression', () => {
    it('formate les erreurs de parsing', () => {
      // cette forme ne semble pas fonctionner : `expect(() => parseExpression('inconnu')).toThrow()`;
      // alors on utilise un try/catch
      try {
        parseExpression('inconnu');
      } catch (e) {
        expect((e as Error).message).toEqual(
          'NotAllInputParsedException: Redundant input, expecting EOF but found: inconnu (1:7)'
        );
      }
    });

    it('si VRAI alors 2', async () => {
      expect(parseAndEvaluateExpression('si VRAI alors 2')).toBe(2);
    });

    it('si FAUX alors 2', async () => {
      expect(parseAndEvaluateExpression('si FAUX alors 2')).toBe(null);
    });

    it('si vrai alors 2 sinon si faux alors 4 sinon 8', async () => {
      expect(
        parseAndEvaluateExpression(
          'si vrai alors 2 sinon si faux alors 4 sinon 8'
        )
      ).toBe(2);
    });

    it('si faux alors 2 sinon si vrai alors 4 sinon 8', async () => {
      expect(
        parseAndEvaluateExpression(
          'si faux alors 2 sinon si vrai alors 4 sinon 8'
        )
      ).toBe(4);
    });

    it('si faux alors 2 sinon si faux alors 4 sinon 8', async () => {
      expect(
        parseAndEvaluateExpression(
          'si faux alors 2 sinon si faux alors 4 sinon 8'
        )
      ).toBe(8);
    });

    it('si faux alors (si faux alors 1 sinon 2) sinon (si vrai alors 4 sinon 8)', async () => {
      expect(
        parseAndEvaluateExpression(
          'si faux alors (si faux alors 1 sinon 2) sinon (si vrai alors 4 sinon 8)'
        )
      ).toBe(4);
    });

    it('vrai ou faux', async () => {
      expect(parseAndEvaluateExpression('vrai ou faux')).toBe(true);
    });

    it('vrai ou faux', async () => {
      expect(parseAndEvaluateExpression('faux ou vrai')).toBe(true);
    });

    it('vrai ou vrai', async () => {
      expect(parseAndEvaluateExpression('vrai ou vrai')).toBe(true);
    });

    it('faux ou faux', async () => {
      expect(parseAndEvaluateExpression('faux ou faux')).toBe(false);
    });

    it('2 + 3', async () => {
      expect(parseAndEvaluateExpression('2 + 3')).toBe(2 + 3);
    });

    it('3 + 2', async () => {
      expect(parseAndEvaluateExpression('3 + 2')).toBe(3 + 2);
    });

    it('2 -3', async () => {
      expect(parseAndEvaluateExpression('2 -3')).toBe(2 - 3);
    });

    it('3 - 2', async () => {
      expect(parseAndEvaluateExpression('3 - 2')).toBe(3 - 2);
    });

    it('2 * 3', async () => {
      expect(parseAndEvaluateExpression('2 * 3')).toBe(2 * 3);
    });

    it('3 * 2', async () => {
      expect(parseAndEvaluateExpression('3 * 2')).toBe(3 * 2);
    });

    it('2 / 3', async () => {
      expect(parseAndEvaluateExpression('2 / 3')).toBe(2 / 3);
    });

    it('3 / 2', async () => {
      expect(parseAndEvaluateExpression('3 / 2')).toBe(3 / 2);
    });

    it('1 + 2 * 3 + 4', async () => {
      expect(parseAndEvaluateExpression('1 + 2 * 3 + 4')).toBe(1 + 2 * 3 + 4);
    });

    it('1 + 5 - 4', async () => {
      expect(parseAndEvaluateExpression('1 + 5 - 4')).toBe(1 + 5 - 4);
    });

    it('1 - 2 * 3 + 4', async () => {
      expect(parseAndEvaluateExpression('1 - 2 * 3 + 4')).toBe(1 - 2 * 3 + 4);
    });

    it('1 + 2 * 3 - 4', async () => {
      // Voir https://tomo.dev/en/posts/sample-formula-parser-using-chevrotain/ pour bien gérer ce cas
      expect(parseAndEvaluateExpression('1 + 2 * 3 - 4')).toBe(1 + 2 * 3 - 4);
    });

    it('3 + 4 * 5 / 2', async () => {
      expect(parseAndEvaluateExpression('3 + 4 * 5 / 2')).toBe(3 + (4 * 5) / 2);
    });

    it('(3 + 4) * (5 / 2)', async () => {
      expect(parseAndEvaluateExpression('(3 + 4) * (5 / 2)')).toBe(
        (3 + 4) * (5 / 2)
      );
    });

    it('max(2, 3)', async () => {
      expect(parseAndEvaluateExpression('max(2, 3)')).toBe(Math.max(2, 3));
    });

    it('max(3, 2)', async () => {
      expect(parseAndEvaluateExpression('max(3, 2)')).toBe(Math.max(3, 2));
    });

    it('min(2, 3)', async () => {
      expect(parseAndEvaluateExpression('min(2, 3)')).toBe(Math.min(2, 3));
    });

    it('min(3, 2)', async () => {
      expect(parseAndEvaluateExpression('min(3, 2)')).toBe(Math.min(3, 2));
    });

    it('1 < 2', async () => {
      expect(parseAndEvaluateExpression('1 < 2')).toBe(1 < 2);
    });

    it('3 > 4', async () => {
      expect(parseAndEvaluateExpression('3 > 4')).toBe(3 > 4);
    });

    it('1 <= 2', async () => {
      expect(parseAndEvaluateExpression('1 <= 2')).toBe(1 <= 2);
    });

    it('1 <= 1', async () => {
      expect(parseAndEvaluateExpression('1 <= 1')).toBe(1 <= 1);
    });

    it('3 >= 4', async () => {
      expect(parseAndEvaluateExpression('3 >= 4')).toBe(3 >= 4);
    });

    it('3 >= 3', async () => {
      expect(parseAndEvaluateExpression('3 >= 3')).toBe(3 >= 3);
    });

    it('3 = 3', async () => {
      expect(parseAndEvaluateExpression('3 = 3')).toBe(3 === 3);
    });

    it('3 = 4', async () => {
      expect(parseAndEvaluateExpression('3 = 4')).toBe(false);
    });
  });
});
