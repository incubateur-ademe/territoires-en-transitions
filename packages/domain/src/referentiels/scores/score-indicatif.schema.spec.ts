import { describe, expect, it } from 'vitest';
import { scoreIndicatifPayloadSchema } from './score-indicatif.schema';

describe('scoreIndicatifPayloadSchema', () => {
  it('classe explicitement les snapshots antérieurs comme annuels', () => {
    const snapshot = scoreIndicatifPayloadSchema.parse({
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

    expect(snapshot.periodicite).toBe('annuelle');
    expect(snapshot.fait?.valeursUtilisees[0]?.dateValeur).toBe('2025-07-10');
  });

  it('refuse de présenter un snapshot de score comme mensuel', () => {
    expect(() =>
      scoreIndicatifPayloadSchema.parse({
        periodicite: 'mensuelle',
        unite: '%',
        fait: null,
        programme: null,
      })
    ).toThrow();
  });
});
