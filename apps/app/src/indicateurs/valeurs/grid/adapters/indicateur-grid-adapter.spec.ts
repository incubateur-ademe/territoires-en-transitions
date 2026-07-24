import { describe, expect, it } from 'vitest';
import { generateCellKey, toIndicateurId, toYear } from '../types';
import {
  fromIndicateur,
  IndicateurAvecSources,
  toIndicateur,
} from './indicateur-grid-adapter';

const collectivite = (
  id: number,
  valeurs: Array<{
    id: number;
    dateValeur: string;
    resultat?: number | null;
    objectif?: number | null;
  }>
): IndicateurAvecSources => ({
  definition: { id },
  sources: {
    collectivite: { libelle: 'Collectivité', metadonnees: [], valeurs },
  },
});

const key = (id: number, year: number) =>
  generateCellKey(toIndicateurId(id), toYear(year));

describe('fromIndicateur', () => {
  it('mappe resultat et objectif pour chaque année', () => {
    const cells = fromIndicateur([
      collectivite(42, [
        { id: 1, dateValeur: '2024-01-01', resultat: 12, objectif: 99 },
        { id: 2, dateValeur: '2030-01-01', resultat: 99, objectif: 8 },
      ]),
    ]);

    expect(cells.get(key(42, 2024))).toEqual({
      resultat: 12,
      objectif: 99,
    });
    expect(cells.get(key(42, 2030))).toEqual({
      resultat: 99,
      objectif: 8,
    });
  });

  it('conserve une valeur nulle sans planter', () => {
    const cells = fromIndicateur([
      collectivite(7, [{ id: 3, dateValeur: '2024-01-01', resultat: null }]),
    ]);

    expect(cells.get(key(7, 2024))).toEqual({
      resultat: null,
      objectif: null,
    });
  });

  it('ignore les indicateurs sans aucune source', () => {
    const cells = fromIndicateur([{ definition: { id: 9 }, sources: {} }]);

    expect(cells.size).toBe(0);
  });
});

describe('toIndicateur', () => {
  it('écrit un résultat quand field vaut resultat', () => {
    expect(
      toIndicateur(
        {
          indicateurId: toIndicateurId(42),
          year: toYear(2024),
          field: 'resultat',
          value: 12,
        },
        { collectiviteId: 3 }
      )
    ).toEqual({
      collectiviteId: 3,
      indicateurId: 42,
      dateValeur: '2024-01-01',
      resultat: 12,
      objectif: undefined,
    });
  });

  it('écrit un objectif quand field vaut objectif', () => {
    expect(
      toIndicateur(
        {
          indicateurId: toIndicateurId(42),
          year: toYear(2030),
          field: 'objectif',
          value: 8,
        },
        { collectiviteId: 10 }
      )
    ).toMatchObject({ objectif: 8, resultat: undefined });
  });

  it('propage une valeur nulle sur le champ indiqué (effacement)', () => {
    expect(
      toIndicateur(
        {
          indicateurId: toIndicateurId(7),
          year: toYear(2030),
          field: 'objectif',
          value: null,
        },
        { collectiviteId: 3 }
      )
    ).toEqual({
      collectiviteId: 3,
      indicateurId: 7,
      dateValeur: '2030-01-01',
      resultat: undefined,
      objectif: null,
    });
  });
});
