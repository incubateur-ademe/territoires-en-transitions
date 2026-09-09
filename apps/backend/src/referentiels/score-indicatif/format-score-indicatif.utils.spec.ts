import { scoreIndicatifPayloadSchema } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { getLibelleScoreIndicatif } from './format-score-indicatif.utils';

describe('getLibelleScoreIndicatif', () => {
  it('conserve la lecture des dates annuelles historiques non canoniques', () => {
    const historique = scoreIndicatifPayloadSchema.parse({
      unite: 'kg/hab',
      fait: {
        score: 0.2,
        valeursUtilisees: [
          {
            valeur: 123,
            dateValeur: '2025-07-10',
            identifiantReferentiel: 'eci_1.a',
            indicateurId: 1,
            sourceLibelle: 'Données de la collectivité',
            sourceMetadonnee: null,
          },
        ],
      },
      programme: null,
    });

    expect(getLibelleScoreIndicatif(historique)).toContain('en 2025');
  });
});
