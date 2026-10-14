import { describe, expect, it } from 'vitest';
import { prepareData } from './prepare-data';
import fixtureJson from './test/fixture.json';

describe('annual source versions', () => {
  it('keeps values and metadata from two versions of the same annual source separate', () => {
    const fixture = structuredClone(fixtureJson.indicateurs[0]);
    const raw = {
      ...fixture,
      sources: {
        citepa: {
          ...fixture.sources.citepa,
          metadonnees: [
            { id: 11, sourceId: 'citepa', dateVersion: '2025-01-01' },
            { id: 12, sourceId: 'citepa', dateVersion: '2026-01-01' },
          ],
          valeurs: [
            {
              periodicite: 'annuelle',
              dateValeur: '2026-01-01',
              resultat: 0,
              metadonneeId: 11,
            },
            {
              periodicite: 'annuelle',
              dateValeur: '2026-01-01',
              resultat: 20,
              metadonneeId: 12,
            },
          ],
        },
      },
    } as unknown as NonNullable<Parameters<typeof prepareData>[0]>;
    const result = prepareData(raw, 'resultat', false);
    expect(result.sources).toHaveLength(2);
    expect(new Set(result.sources.map(({ seriesKey }) => seriesKey)).size).toBe(
      2
    );
    expect(
      result.sources.map(({ metadonnees, valeurs }) => [
        metadonnees.map(({ id }) => id),
        valeurs.map(({ valeur }) => valeur),
      ])
    ).toEqual([
      [[11], [0]],
      [[12], [20]],
    ]);
    expect(result.periodes).toHaveLength(1);
  });
});
