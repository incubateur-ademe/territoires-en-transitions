import {
  verifyReferentielExpressions,
  normalizeTypeSyndicatExpressions,
  buildQuestionActionRelations,
} from './verify-referentiel-expressions';
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

  it('retourne une erreur quand identite(type, syndicat) est utilisé sur un référentiel autre que cae ou eci', () => {
    const errors = verifyReferentielExpressions({
      ...baseInput,
      referentielId: 'te',
      actions: [
        {
          identifiant: '1.1',
          desactivation: 'si identite(type, syndicat) alors VRAI',
        },
      ],
    });

    expect(errors).toEqual([
      `La valeur "syndicat" pour identite(type) dans l'expression de désactivation de l'action te_1.1 n'est pas valide. Valeurs autorisées pour identite(type, ...) : epci, commune`,
    ]);
  });

  it(`ne retourne pas d'erreur quand identite(type, syndicat) est utilisé sur le référentiel eci`, () => {
    const errors = verifyReferentielExpressions({
      ...baseInput,
      referentielId: 'eci',
      actions: [
        {
          identifiant: '1.2.2',
          desactivation: 'si identite(type, syndicat) alors VRAI',
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

describe('buildQuestionActionRelations', () => {
  it('extrait les questions depuis une expression de desactivation', () => {
    const relations = buildQuestionActionRelations({
      referentielId: 'cae',
      actions: [
        {
          identifiant: '1.1',
          desactivation: 'reponse(dechets_1, OUI)',
        },
      ],
    });

    expect(relations).toEqual([
      { actionId: 'cae_1.1', questionId: 'dechets_1' },
    ]);
  });

  it('extrait les questions depuis une expression de reduction', () => {
    const relations = buildQuestionActionRelations({
      referentielId: 'cae',
      actions: [
        {
          identifiant: '2.3',
          reduction: 'reponse(habitat_1, NON)',
        },
      ],
    });

    expect(relations).toEqual([
      { actionId: 'cae_2.3', questionId: 'habitat_1' },
    ]);
  });

  it('extrait les questions depuis une expression de score', () => {
    const relations = buildQuestionActionRelations({
      referentielId: 'cae',
      actions: [
        {
          identifiant: '3.1',
          score: 'reponse(transport_1)',
        },
      ],
    });

    expect(relations).toEqual([
      { actionId: 'cae_3.1', questionId: 'transport_1' },
    ]);
  });

  it('deduplique les questions referencees dans plusieurs expressions de la meme action', () => {
    const relations = buildQuestionActionRelations({
      referentielId: 'cae',
      actions: [
        {
          identifiant: '1.1',
          desactivation: 'reponse(dechets_1, OUI)',
          reduction: 'reponse(dechets_1, NON)',
        },
      ],
    });

    expect(relations).toEqual([
      { actionId: 'cae_1.1', questionId: 'dechets_1' },
    ]);
  });

  it('extrait plusieurs questions distinctes depuis une meme expression', () => {
    const relations = buildQuestionActionRelations({
      referentielId: 'cae',
      actions: [
        {
          identifiant: '1.1',
          desactivation:
            'si reponse(dechets_1, OUI) et reponse(dechets_2, NON) alors desactivation',
        },
      ],
    });

    expect(relations).toEqual([
      { actionId: 'cae_1.1', questionId: 'dechets_1' },
      { actionId: 'cae_1.1', questionId: 'dechets_2' },
    ]);
  });

  it('retourne un tableau vide quand aucune expression n a de question', () => {
    const relations = buildQuestionActionRelations({
      referentielId: 'cae',
      actions: [
        {
          identifiant: '1.1',
        },
      ],
    });

    expect(relations).toEqual([]);
  });

  it('combine les questions de plusieurs actions', () => {
    const relations = buildQuestionActionRelations({
      referentielId: 'cae',
      actions: [
        {
          identifiant: '1.1',
          desactivation: 'reponse(dechets_1, OUI)',
        },
        {
          identifiant: '2.1',
          reduction: 'reponse(habitat_1, NON)',
        },
      ],
    });

    expect(relations).toEqual([
      { actionId: 'cae_1.1', questionId: 'dechets_1' },
      { actionId: 'cae_2.1', questionId: 'habitat_1' },
    ]);
  });

  it('permet la meme question sur des actions differentes', () => {
    const relations = buildQuestionActionRelations({
      referentielId: 'cae',
      actions: [
        {
          identifiant: '1.1',
          desactivation: 'reponse(dechets_1, OUI)',
        },
        {
          identifiant: '2.1',
          desactivation: 'reponse(dechets_1, NON)',
        },
      ],
    });

    expect(relations).toEqual([
      { actionId: 'cae_1.1', questionId: 'dechets_1' },
      { actionId: 'cae_2.1', questionId: 'dechets_1' },
    ]);
  });
});

describe('normalizeTypeSyndicatExpressions', () => {
  it(`remplace identite(type, syndicat) par identite(soustype, syndicat) pour le référentiel eci`, () => {
    expect(
      normalizeTypeSyndicatExpressions({
        referentielId: 'eci',
        expression: 'si identite(type, syndicat) alors VRAI',
      })
    ).toBe('si identite(soustype, syndicat) alors VRAI');
  });

  it(`remplace identite(type, syndicat) par identite(soustype, syndicat) pour le référentiel cae`, () => {
    expect(
      normalizeTypeSyndicatExpressions({
        referentielId: 'cae',
        expression: 'si identite(type, syndicat) alors VRAI',
      })
    ).toBe('si identite(soustype, syndicat) alors VRAI');
  });

  it(`ne modifie pas l'expression pour un référentiel autre que cae ou eci`, () => {
    expect(
      normalizeTypeSyndicatExpressions({
        referentielId: 'te',
        expression: 'si identite(type, syndicat) alors VRAI',
      })
    ).toBe('si identite(type, syndicat) alors VRAI');
  });

  it(`ne modifie pas les autres appels identite()`, () => {
    expect(
      normalizeTypeSyndicatExpressions({
        referentielId: 'eci',
        expression: 'si identite(type, EPCI) alors VRAI',
      })
    ).toBe('si identite(type, EPCI) alors VRAI');
  });
});
