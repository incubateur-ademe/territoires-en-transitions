import { describe, expect, it } from 'vitest';
import { generateCellKey, toIndicateurId, toYear, Year } from '../types';
import {
  fieldForYear,
  fromIndicateur,
  IndicateurAvecSources,
  toIndicateur,
} from './indicateur-grid-adapter';

const REFERENCE_YEAR: Year = toYear(2024);

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
  it('lit le résultat pour l\'année de référence et l\'objectif pour les horizons', () => {
    const cells = fromIndicateur(
      [
        collectivite(42, [
          { id: 1, dateValeur: '2024-01-01', resultat: 12, objectif: 99 },
          { id: 2, dateValeur: '2030-01-01', resultat: 99, objectif: 8 },
        ]),
      ],
      REFERENCE_YEAR
    );

    expect(cells.get(key(42, 2024))).toEqual({
      kind: 'user-data',
      value: 12,
      coveringSources: [],
    });
    expect(cells.get(key(42, 2030))).toEqual({
      kind: 'user-data',
      value: 8,
      coveringSources: [],
    });
  });

  it('conserve une valeur nulle sans planter', () => {
    const cells = fromIndicateur(
      [collectivite(7, [{ id: 3, dateValeur: '2024-01-01', resultat: null }])],
      REFERENCE_YEAR
    );

    expect(cells.get(key(7, 2024))?.value).toBeNull();
  });

  it('ignore les indicateurs sans aucune source', () => {
    const cells = fromIndicateur(
      [{ definition: { id: 9 }, sources: {} }],
      REFERENCE_YEAR
    );

    expect(cells.size).toBe(0);
  });

  it('assemble les sources open data couvrant une cellule', () => {
    const cells = fromIndicateur(
      [
        {
          definition: { id: 42 },
          sources: {
            collectivite: {
              libelle: 'Collectivité',
              metadonnees: [],
              valeurs: [{ id: 1, dateValeur: '2024-01-01', resultat: 12 }],
            },
            citepa: {
              libelle: 'CITEPA',
              metadonnees: [
                { id: 5, methodologie: 'Inventaire', dateVersion: '2026-01-01' },
              ],
              valeurs: [
                { id: 90, dateValeur: '2024-01-01', resultat: 15, metadonneeId: 5 },
              ],
            },
          },
        },
      ],
      REFERENCE_YEAR
    );

    expect(cells.get(key(42, 2024))).toEqual({
      kind: 'user-data',
      value: 12,
      coveringSources: [
        {
          sourceId: 'citepa',
          libelle: 'CITEPA',
          value: 15,
          methodologie: 'Inventaire',
          dateVersion: '2026-01-01',
        },
      ],
    });
  });

  it('couvre un horizon avec l\'objectif d\'une source open data', () => {
    const cells = fromIndicateur(
      [
        {
          definition: { id: 8 },
          sources: {
            snbc: {
              libelle: 'SNBC',
              metadonnees: [
                { id: 5, methodologie: null, dateVersion: '2026-01-01' },
              ],
              valeurs: [
                { id: 90, dateValeur: '2030-01-01', objectif: 20, metadonneeId: 5 },
              ],
            },
          },
        },
      ],
      REFERENCE_YEAR
    );

    expect(cells.get(key(8, 2030))).toEqual({
      kind: 'user-data',
      value: null,
      coveringSources: [
        {
          sourceId: 'snbc',
          libelle: 'SNBC',
          value: 20,
          methodologie: null,
          dateVersion: '2026-01-01',
        },
      ],
    });
  });

  it('exclut de la couverture une source sans valeur pour le champ de l\'année', () => {
    const cells = fromIndicateur(
      [
        {
          definition: { id: 3 },
          sources: {
            citepa: {
              libelle: 'CITEPA',
              metadonnees: [{ id: 5, methodologie: null, dateVersion: '2026-01-01' }],
              valeurs: [
                { id: 90, dateValeur: '2024-01-01', resultat: null, metadonneeId: 5 },
              ],
            },
          },
        },
      ],
      REFERENCE_YEAR
    );

    expect(cells.size).toBe(0);
  });
});

describe('toIndicateur', () => {
  const context = { collectiviteId: 3, referenceYear: REFERENCE_YEAR };

  it('écrit un résultat sur l\'année de référence', () => {
    expect(
      toIndicateur(
        { indicateurId: toIndicateurId(42), year: toYear(2024), value: 12 },
        context
      )
    ).toEqual({
      collectiviteId: 3,
      indicateurId: 42,
      dateValeur: '2024-01-01',
      resultat: 12,
      objectif: undefined,
    });
  });

  it('écrit un objectif sur un horizon', () => {
    expect(
      toIndicateur(
        { indicateurId: toIndicateurId(42), year: toYear(2030), value: 8 },
        context
      )
    ).toEqual({
      collectiviteId: 3,
      indicateurId: 42,
      dateValeur: '2030-01-01',
      resultat: undefined,
      objectif: 8,
    });
  });

  it('propage une valeur nulle sur le champ de l\'année (effacement)', () => {
    expect(
      toIndicateur(
        { indicateurId: toIndicateurId(7), year: toYear(2030), value: null },
        context
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

describe('fieldForYear', () => {
  it('écrit un résultat sur l\'année de référence', () => {
    expect(fieldForYear(toYear(2024), toYear(2024))).toBe('resultat');
  });

  it('écrit un objectif sur un horizon postérieur à la référence', () => {
    expect(fieldForYear(toYear(2030), toYear(2024))).toBe('objectif');
  });

  it('écrit un résultat sur une année antérieure à la référence', () => {
    expect(fieldForYear(toYear(2019), toYear(2024))).toBe('resultat');
  });

  it('écrit un résultat par défaut sans année de référence', () => {
    expect(fieldForYear(toYear(2030), null)).toBe('resultat');
  });
});
