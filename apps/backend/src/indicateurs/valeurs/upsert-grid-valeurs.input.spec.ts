import { describe, expect, it } from 'vitest';
import {
  MAX_GRID_VALEURS_BATCH_SIZE,
  upsertGridValeursInputSchema,
} from './upsert-grid-valeurs.input';

const valeur = {
  indicateurId: 1,
  period: { periodicite: 'mensuelle', dateDebut: '2026-01-01' },
  resultat: 1,
};

describe('upsertGridValeursInputSchema', () => {
  it('accepte un lot à la taille maximale', () => {
    expect(() =>
      upsertGridValeursInputSchema.parse({
        collectiviteId: 1,
        valeurs: Array.from(
          { length: MAX_GRID_VALEURS_BATCH_SIZE },
          () => valeur
        ),
      })
    ).not.toThrow();
  });

  it('rejette un lot trop volumineux', () => {
    expect(() =>
      upsertGridValeursInputSchema.parse({
        collectiviteId: 1,
        valeurs: Array.from(
          { length: MAX_GRID_VALEURS_BATCH_SIZE + 1 },
          () => valeur
        ),
      })
    ).toThrow();
  });

  it('réhydrate une période canonique et rejette une période bricolée', () => {
    const parsed = upsertGridValeursInputSchema.parse({
      collectiviteId: 1,
      valeurs: [valeur],
    });

    expect(parsed.valeurs[0].period).toEqual({
      periodicite: 'mensuelle',
      dateDebut: '2026-01-01',
    });
    expect(Object.isFrozen(parsed.valeurs[0].period)).toBe(true);
    expect(() =>
      upsertGridValeursInputSchema.parse({
        collectiviteId: 1,
        valeurs: [
          {
            ...valeur,
            period: {
              periodicite: 'annuelle',
              dateDebut: '2026-02-01',
            },
          },
        ],
      })
    ).toThrow();
  });
});
