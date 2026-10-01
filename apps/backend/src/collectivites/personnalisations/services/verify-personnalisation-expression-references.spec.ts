import { QuestionForVerification } from '@tet/backend/referentiels/import-referentiel/verify-referentiel-expressions.types';
import { extractReferencesFromExpression } from './personnalisation-expression-reference-extractor';
import {
  VerifyPersonnalisationExpressionReferencesOptions,
  verifyPersonnalisationExpressionReferences,
} from './verify-personnalisation-expression-references';

const LABEL = "l'expression cible de l'indicateur cae_6.a";

const questions: QuestionForVerification[] = [
  { id: 'dechets_1', type: 'binaire' },
  {
    id: 'EP_1',
    type: 'choix',
    choix: [
      { id: 'EP_1_a', ordonnancement: 1, formulation: 'A' },
      { id: 'EP_1_b', ordonnancement: 2, formulation: 'B' },
    ],
  },
  { id: 'part_1', type: 'proportion' },
];

function verify(
  expression: string,
  options: Partial<VerifyPersonnalisationExpressionReferencesOptions> = {}
): string[] {
  return verifyPersonnalisationExpressionReferences(
    extractReferencesFromExpression(expression),
    { label: LABEL, questions, ...options }
  );
}

describe('verifyPersonnalisationExpressionReferences', () => {
  describe('identite(sinoe, ...)', () => {
    it('accepte une typologie SINOE connue', () => {
      expect(verify('si identite(sinoe, dense) alors 300 sinon 0')).toEqual([]);
    });

    it('refuse une typologie SINOE mal orthographiée et liste les typologies autorisées', () => {
      const errors = verify(
        'si identite(sinoe, touristqiue) alors 300 sinon 0'
      );
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain(
        `La valeur "touristqiue" pour identite(sinoe) dans ${LABEL} n'est pas valide`
      );
      expect(errors[0]).toContain('touristique, touristique_urbain');
    });
  });

  describe('identite(commune_membre, ...)', () => {
    it('accepte un seuil plus_de_*', () => {
      expect(verify('identite(commune_membre, plus_de_3000)')).toEqual([]);
    });

    it('refuse un seuil moins_de_*', () => {
      const errors = verify('identite(commune_membre, moins_de_3000)');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('"moins_de_3000"');
    });
  });

  describe('identite(...)', () => {
    it('accepte les valeurs sans tenir compte de la casse', () => {
      expect(
        verify(
          'identite(type, EPCI) et identite(localisation, DOM) et identite(dans_aire_urbaine, oui)'
        )
      ).toEqual([]);
    });

    it('refuse un champ inconnu et liste les champs autorisés', () => {
      const errors = verify('identite(typ, commune)');
      expect(errors).toEqual([
        `Le champ d'identité "typ" dans ${LABEL} n'est pas valide. Champs autorisés : type, soustype, population, localisation, dans_aire_urbaine, sinoe, commune_membre`,
      ]);
    });

    it('refuse un champ hérité du prototype', () => {
      expect(verify('identite(constructor, commune)')).toHaveLength(1);
    });

    it('accepte identite(type, syndicat) seulement quand la forme historique est permise', () => {
      expect(
        verify('identite(type, syndicat)', { allowLegacyTypeSyndicat: true })
      ).toEqual([]);
      expect(verify('identite(type, syndicat)')).toHaveLength(1);
    });
  });

  describe('demarche(...)', () => {
    it('accepte un champ connu', () => {
      expect(verify('demarche(renouvellement)')).toEqual([]);
    });

    it('refuse un champ mal orthographié et liste les champs autorisés', () => {
      expect(verify('demarche(renouvelement)')).toEqual([
        `Le champ de démarche "renouvelement" dans ${LABEL} n'est pas valide. Champs autorisés : renouvellement`,
      ]);
    });
  });

  describe('reponse(...)', () => {
    it('accepte une question et une valeur valides', () => {
      expect(
        verify(
          'reponse(dechets_1, OUI) et reponse(EP_1, EP_1_a) et reponse(part_1) > 0.5'
        )
      ).toEqual([]);
    });

    it('refuse une question inconnue, avec le conseil fourni', () => {
      expect(
        verify('reponse(question_inexistante, OUI)', {
          unknownQuestionHint: 'Importez les questions.',
        })
      ).toEqual([
        `La question "question_inexistante" utilisée dans ${LABEL} n'existe pas. Importez les questions.`,
      ]);
    });

    it('refuse un choix inconnu', () => {
      const errors = verify('reponse(EP_1, EP_1_z)');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Valeurs autorisées : EP_1_a, EP_1_b');
    });
  });

  describe('score(...)', () => {
    it("n'est vérifié que si la liste des actions est fournie", () => {
      expect(verify('score(cae_9.9)')).toEqual([]);
      expect(verify('score(cae_9.9)', { actionIds: ['cae_1.1'] })).toEqual([
        `L'action "cae_9.9" référencée dans score() de ${LABEL} n'existe pas dans le référentiel`,
      ]);
    });
  });
});
