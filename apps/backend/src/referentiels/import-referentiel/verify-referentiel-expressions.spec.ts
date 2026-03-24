import { verifyReferentielExpressions } from './verify-referentiel-expressions';
import {
  ParseExpression,
  VerifyReferentielExpressionsInput,
} from './verify-referentiel-expressions.types';

const successParse: ParseExpression = () => ({ success: true });

const baseInput: VerifyReferentielExpressionsInput = {
  referentielId: 'cae',
  actions: [],
  questions: [],
  indicateurReferences: [],
  indicateurIdByIdentifiant: {},
  indicateurDefinitions: [],
  parseScoreExpression: successParse,
  parsePersonnalisationExpression: successParse,
};

describe('verifyReferentielExpressions', () => {
  it('retourne une erreur de syntaxe quand le parsing echoue', () => {
    const failParse: ParseExpression = () => ({
      success: false,
      error: 'parse error',
    });

    const errors = verifyReferentielExpressions({
      ...baseInput,
      actions: [{ identifiant: '1.1', desactivation: 'invalide !!!' }],
      parsePersonnalisationExpression: failParse,
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('erreur de syntaxe');
    expect(errors[0]).toContain('invalide !!!');
    expect(errors[0]).toContain('cae_1.1');
  });

  it('ne fait pas de verification semantique sur une expression dont le parsing a echoue', () => {
    const failParse: ParseExpression = (expression: string) =>
      expression === 'invalide !!!'
        ? { success: false, error: 'parse error' }
        : { success: true };

    const errors = verifyReferentielExpressions({
      ...baseInput,
      actions: [
        { identifiant: '1.1', desactivation: 'invalide !!!' },
        { identifiant: '1.2', desactivation: 'reponse(dechets_1, OUI)' },
      ],
      parsePersonnalisationExpression: failParse,
    });

    const syntaxErrors = errors.filter((error) =>
      error.includes('erreur de syntaxe')
    );
    expect(syntaxErrors).toHaveLength(1);
    expect(syntaxErrors[0]).toContain('cae_1.1');
  });

  it('retourne un tableau vide quand toutes les expressions sont valides', () => {
    const errors = verifyReferentielExpressions({
      ...baseInput,
      actions: [
        { identifiant: '1.1', desactivation: 'expr_a' },
        { identifiant: '1.2', reduction: 'expr_b' },
      ],
    });

    expect(errors).toEqual([]);
  });

  it('retourne une erreur quand un indicateur referencé n existe pas', () => {
    const errors = verifyReferentielExpressions({
      ...baseInput,
      indicateurReferences: [
        {
          actionId: 'cae_1.2.3',
          scoreExpression: 'limite(cae_1000)',
          referencedIndicateurs: [
            { identifiant: 'cae_1000', optional: false, tokens: ['limite'] },
          ],
        },
      ],
      indicateurIdByIdentifiant: {},
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('cae_1000');
    expect(errors[0]).toContain("n'existe pas");
  });

  it('retourne une erreur quand un indicateur de liste n existe pas', () => {
    const errors = verifyReferentielExpressions({
      ...baseInput,
      indicateurReferences: [
        {
          actionId: 'cae_1.2.3',
          scoreExpression: null,
          referencedIndicateurs: [
            { identifiant: 'cae_1000', optional: false, tokens: [] },
          ],
        },
      ],
      indicateurIdByIdentifiant: {},
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('cae_1000');
    expect(errors[0]).toContain('liste indicateurs');
  });

  it('retourne une erreur quand la definition cible est manquante', () => {
    const errors = verifyReferentielExpressions({
      ...baseInput,
      indicateurReferences: [
        {
          actionId: 'cae_1.2.3',
          scoreExpression: 'cible(cae_36)',
          referencedIndicateurs: [
            { identifiant: 'cae_36', optional: false, tokens: ['cible'] },
          ],
        },
      ],
      indicateurIdByIdentifiant: { cae_36: 42 },
      indicateurDefinitions: [
        {
          id: 42,
          identifiantReferentiel: 'cae_36',
          exprCible: null,
          exprSeuil: null,
        },
      ],
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('cible manquante');
    expect(errors[0]).toContain('cae_36');
  });

  it('ne retourne pas d erreur quand la definition cible existe', () => {
    const errors = verifyReferentielExpressions({
      ...baseInput,
      indicateurReferences: [
        {
          actionId: 'cae_1.2.3',
          scoreExpression: 'cible(cae_36)',
          referencedIndicateurs: [
            { identifiant: 'cae_36', optional: false, tokens: ['cible'] },
          ],
        },
      ],
      indicateurIdByIdentifiant: { cae_36: 42 },
      indicateurDefinitions: [
        {
          id: 42,
          identifiantReferentiel: 'cae_36',
          exprCible: 'some_expression',
          exprSeuil: null,
        },
      ],
    });

    expect(errors).toEqual([]);
  });

  it('retourne une erreur de syntaxe pour les expressions de score', () => {
    const failParse: ParseExpression = () => ({
      success: false,
      error: 'parse error',
    });

    const errors = verifyReferentielExpressions({
      ...baseInput,
      actions: [{ identifiant: '1.2.3', exprScore: 'invalid)(' }],
      parseScoreExpression: failParse,
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('expression de score');
    expect(errors[0]).toContain('erreur de syntaxe');
  });
});
