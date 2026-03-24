import { verifyReferentielExpressions } from './verify-referentiel-expressions';
import { ExtractReferences, ParseExpression } from './verify-referentiel-expressions.types';

const noopExtractReferences: ExtractReferences = () => ({
  questions: [],
  identiteFields: [],
  scores: [],
});

const successParse: ParseExpression = () => ({ success: true });

const baseInput = {
  referentielId: 'cae' as const,
  questions: [],
  indicateurReferences: [],
  indicateurIdParIdentifiant: {},
  indicateurDefinitions: [],
  parseScoreExpression: successParse,
};

describe('verifyReferentielExpressions', () => {
  it('ne lance pas extractReferences sur une expression dont le parsing a échoué', () => {
    const extractReferences = vi.fn(noopExtractReferences);

    const failParse: ParseExpression = (expr: string) =>
      expr === 'invalide !!!'
        ? { success: false, error: 'parse error' }
        : { success: true };

    const result = verifyReferentielExpressions({
      ...baseInput,
      actions: [
        { identifiant: '1.1', desactivation: 'invalide !!!' },
        { identifiant: '1.2', desactivation: 'reponse(dechets_1, OUI)' },
      ],
      parsePersonnalisationExpression: failParse,
      extractReferences,
    });

    expect(result.success).toBe(false);
    expect(result.success === false && result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _tag: 'ExpressionSyntaxeInvalide' }),
      ])
    );

    expect(extractReferences).toHaveBeenCalledTimes(1);
    expect(extractReferences).toHaveBeenCalledWith('reponse(dechets_1, OUI)');
  });

  it('lance extractReferences sur toutes les expressions quand le parsing réussit', () => {
    const extractReferences = vi.fn(noopExtractReferences);

    const result = verifyReferentielExpressions({
      ...baseInput,
      actions: [
        { identifiant: '1.1', desactivation: 'expr_a' },
        { identifiant: '1.2', reduction: 'expr_b' },
      ],
      parsePersonnalisationExpression: successParse,
      extractReferences,
    });

    expect(result.success).toBe(true);
    expect(extractReferences).toHaveBeenCalledTimes(2);
    expect(extractReferences).toHaveBeenCalledWith('expr_a');
    expect(extractReferences).toHaveBeenCalledWith('expr_b');
  });
});
