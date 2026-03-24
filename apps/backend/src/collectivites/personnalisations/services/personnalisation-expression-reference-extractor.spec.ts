import { extractReferencesFromExpression } from './personnalisation-expression-reference-extractor';

describe('extractReferencesFromExpression', () => {
  describe('reponse()', () => {
    it('extrait questionId et valeur depuis reponse(question_id, valeur)', () => {
      const refs = extractReferencesFromExpression('reponse(dechets_1, OUI)');
      expect(refs.questions).toEqual([
        { questionId: 'dechets_1', valeur: 'OUI' },
      ]);
    });

    it('extrait questionId sans valeur depuis reponse(question_id)', () => {
      const refs = extractReferencesFromExpression('reponse(habitat_2)');
      expect(refs.questions).toEqual([{ questionId: 'habitat_2' }]);
    });
  });

  describe('identite()', () => {
    it('extrait champ et valeur depuis identite(type, commune)', () => {
      const refs = extractReferencesFromExpression('identite(type, commune)');
      expect(refs.identiteFields).toEqual([
        { champ: 'type', valeur: 'commune' },
      ]);
    });
  });

  describe('score()', () => {
    it('extrait actionId depuis score(cae_1.2.3)', () => {
      const refs = extractReferencesFromExpression('score(cae_1.2.3)');
      expect(refs.scores).toEqual([{ actionId: 'cae_1.2.3' }]);
    });
  });

  describe('expressions composées', () => {
    it('extrait toutes les questions depuis reponse(q1, OUI) et reponse(q2, NON)', () => {
      const refs = extractReferencesFromExpression(
        'reponse(dechets_1, OUI) et reponse(dechets_2, NON)'
      );
      expect(refs.questions).toEqual([
        { questionId: 'dechets_1', valeur: 'OUI' },
        { questionId: 'dechets_2', valeur: 'NON' },
      ]);
    });

    it('extrait toutes les références depuis une expression si/alors/sinon', () => {
      const refs = extractReferencesFromExpression(
        'si reponse(AOM_1, OUI) alors score(cae_1.2.3) sinon reponse(habitat_2)'
      );
      expect(refs.questions).toEqual([
        { questionId: 'AOM_1', valeur: 'OUI' },
        { questionId: 'habitat_2' },
      ]);
      expect(refs.scores).toEqual([{ actionId: 'cae_1.2.3' }]);
    });

    it('extrait toutes les références depuis une expression mixte identite + reponse + score', () => {
      const refs = extractReferencesFromExpression(
        'si identite(type, commune) et reponse(dechets_2, NON) alors min(score(cae_1.2.3), 2/12)'
      );
      expect(refs.identiteFields).toEqual([
        { champ: 'type', valeur: 'commune' },
      ]);
      expect(refs.questions).toEqual([
        { questionId: 'dechets_2', valeur: 'NON' },
      ]);
      expect(refs.scores).toEqual([{ actionId: 'cae_1.2.3' }]);
    });
  });

  describe('cas limites', () => {
    it('retourne des listes vides pour une expression sans appels', () => {
      const refs = extractReferencesFromExpression('1 + 2');
      expect(refs.questions).toEqual([]);
      expect(refs.identiteFields).toEqual([]);
      expect(refs.scores).toEqual([]);
    });

    it('extrait les références distinctes pour le même questionId avec valeurs différentes', () => {
      const refs = extractReferencesFromExpression(
        'reponse(dechets_1, OUI) et reponse(dechets_1, NON)'
      );
      expect(refs.questions).toEqual([
        { questionId: 'dechets_1', valeur: 'OUI' },
        { questionId: 'dechets_1', valeur: 'NON' },
      ]);
    });
  });
});
