import {
  ActionScoreIndicatif,
  scoreIndicatifPayloadSchema,
} from '@tet/domain/referentiels';
import {
  actionBelongsToReferentiel,
  formatScoreIndicatifForPayload,
} from './score-indicatif-payload.rules';

describe('score-indicatif-payload.rules', () => {
  describe('actionBelongsToReferentiel', () => {
    it('reconnaît une action de son propre référentiel', () => {
      expect(actionBelongsToReferentiel('cae_1.1.1', 'cae')).toBe(true);
    });

    it("rejette une action d'un autre référentiel", () => {
      expect(actionBelongsToReferentiel('cae_1.1.1', 'eci')).toBe(false);
    });

    it('regroupe les référentiels "te"/"te-test" sous le même alias', () => {
      expect(actionBelongsToReferentiel('te_1.1', 'te')).toBe(true);
    });

    it('renvoie false pour un actionId mal formé', () => {
      expect(actionBelongsToReferentiel('actionId-invalide', 'cae')).toBe(
        false
      );
    });
  });

  describe('formatScoreIndicatifForPayload', () => {
    it('formate le score fait et laisse le score programme à null', () => {
      const scoreIndicatif: ActionScoreIndicatif = {
        actionId: 'cae_1.1.1',
        indicateurs: [
          {
            actionId: 'cae_1.1.1',
            indicateurId: 42,
            identifiantReferentiel: 'ind_test',
            titre: 'Indicateur de test',
            unite: '%',
            isApplicable: true,
          },
        ],
        calcul: {
          type: 'valeur_cible_seuil',
          identifiantReferentiel: 'ind_test',
          cible: 5,
          seuil: 20,
        },
        fait: {
          score: 0.5,
          valeursUtilisees: [
            {
              indicateurId: 42,
              valeur: 10,
              dateValeur: '2023-01-01',
              sourceLibelle: 'Ma source',
              sourceMetadonnee: {
                id: 1,
                sourceId: 'src',
                dateVersion: '2023',
                nomDonnees: null,
                diffuseur: null,
                producteur: null,
                methodologie: null,
                limites: null,
              },
            },
          ],
        },
        programme: null,
      };

      const payload = formatScoreIndicatifForPayload(scoreIndicatif);

      expect(payload.unite).toBe('%');
      expect(payload.calcul).toEqual({
        type: 'valeur_cible_seuil',
        identifiantReferentiel: 'ind_test',
        cible: 5,
        seuil: 20,
      });
      expect(payload.programme).toBeNull();
      expect(payload.fait).toEqual({
        score: 0.5,
        valeursUtilisees: [
          {
            indicateurId: 42,
            valeur: 10,
            dateValeur: '2023-01-01',
            sourceLibelle: 'Ma source',
            sourceMetadonnee: { sourceId: 'src', dateVersion: '2023' },
            identifiantReferentiel: 'ind_test',
          },
        ],
      });
    });

    it('conserve calcul à null quand aucun type de calcul ne correspond', () => {
      const payload = formatScoreIndicatifForPayload({
        actionId: 'cae_1.1.1',
        indicateurs: [
          {
            actionId: 'cae_1.1.1',
            indicateurId: 42,
            identifiantReferentiel: 'ind_test',
            titre: 'Indicateur de test',
            unite: '%',
            isApplicable: true,
          },
        ],
        calcul: null,
        fait: null,
        programme: null,
      });

      expect(payload.calcul).toBeNull();
      expect(scoreIndicatifPayloadSchema.safeParse(payload).success).toBe(true);
    });
  });

  describe('scoreIndicatifPayloadSchema', () => {
    it('accepte un payload de snapshot antérieur, sans calcul', () => {
      const result = scoreIndicatifPayloadSchema.safeParse({
        unite: '%',
        fait: null,
        programme: null,
      });

      expect(result.success).toBe(true);
      expect(result.data?.calcul).toBeUndefined();
    });

    it.each([
      {
        type: 'progression_snbc',
        identifiantReferentiel: 'ind_test',
        anneeDepart: 2015,
        objectifSnbcDepart: 200,
        anneeUtilisee: 2020,
        valeurUtilisee: 80,
        objectifSnbc: 150,
      },
      {
        type: 'reduction',
        identifiantReferentiel: 'ind_test',
        anneeDepart: 2015,
        resultatDepart: 100,
        anneeCible: 2025,
        reductionCible: 0.4,
        anneeUtilisee: null,
        valeurUtilisee: null,
        valeurCible: null,
      },
    ])('accepte un calcul de type $type', (calcul) => {
      const result = scoreIndicatifPayloadSchema.safeParse({
        unite: '%',
        calcul,
        fait: null,
        programme: null,
      });

      expect(result.success).toBe(true);
      expect(result.data?.calcul).toEqual(calcul);
    });
  });
});
