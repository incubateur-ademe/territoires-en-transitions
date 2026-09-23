import { ActionScoreIndicatif } from '@tet/domain/referentiels';
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
  });
});
