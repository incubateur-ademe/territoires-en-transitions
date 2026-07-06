import { describe, expect, it } from 'vitest';
import { generateCellKey, toIndicateurId, toYear } from '../types';
import { IndicateurAvecSources, toGridCells } from './to-grid-cells';

const collectivite = (
  id: number,
  valeurs: Array<{ id: number; dateValeur: string; resultat: number | null }>
): IndicateurAvecSources => ({
  definition: { id },
  sources: {
    collectivite: { libelle: 'Collectivité', metadonnees: [], valeurs },
  },
});

const key = (id: number, year: number) =>
  generateCellKey(toIndicateurId(id), toYear(year));

describe('toGridCells', () => {
  it('indexe les valeurs saisies par indicateur et année', () => {
    const cells = toGridCells([
      collectivite(42, [
        { id: 1, dateValeur: '2030-01-01', resultat: 12 },
        { id: 2, dateValeur: '2050-01-01', resultat: 8 },
      ]),
    ]);

    expect(cells.get(key(42, 2030))).toEqual({
      kind: 'user-data',
      value: 12,
      valueId: 1,
      coveringSources: [],
    });
    expect(cells.get(key(42, 2050))?.value).toBe(8);
  });

  it('conserve une valeur nulle sans planter', () => {
    const cells = toGridCells([
      collectivite(7, [{ id: 3, dateValeur: '2030-01-01', resultat: null }]),
    ]);

    expect(cells.get(key(7, 2030))?.value).toBeNull();
  });

  it('ignore les indicateurs sans aucune source', () => {
    const cells = toGridCells([{ definition: { id: 9 }, sources: {} }]);

    expect(cells.size).toBe(0);
  });

  it('assemble les sources open data couvrant une cellule', () => {
    const cells = toGridCells([
      {
        definition: { id: 42 },
        sources: {
          collectivite: {
            libelle: 'Collectivité',
            metadonnees: [],
            valeurs: [{ id: 1, dateValeur: '2030-01-01', resultat: 12 }],
          },
          citepa: {
            libelle: 'CITEPA',
            metadonnees: [
              { id: 5, methodologie: 'Inventaire', dateVersion: '2026-01-01' },
            ],
            valeurs: [
              { id: 90, dateValeur: '2030-01-01', resultat: 15, metadonneeId: 5 },
            ],
          },
        },
      },
    ]);

    expect(cells.get(key(42, 2030))).toEqual({
      kind: 'user-data',
      value: 12,
      valueId: 1,
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

  it('émet une cellule vide couverte quand seule une source open data existe', () => {
    const cells = toGridCells([
      {
        definition: { id: 8 },
        sources: {
          citepa: {
            libelle: 'CITEPA',
            metadonnees: [
              { id: 5, methodologie: null, dateVersion: '2026-01-01' },
            ],
            valeurs: [
              { id: 90, dateValeur: '2050-01-01', resultat: 20, metadonneeId: 5 },
            ],
          },
        },
      },
    ]);

    expect(cells.get(key(8, 2050))).toEqual({
      kind: 'user-data',
      value: null,
      valueId: undefined,
      coveringSources: [
        {
          sourceId: 'citepa',
          libelle: 'CITEPA',
          value: 20,
          methodologie: null,
          dateVersion: '2026-01-01',
        },
      ],
    });
  });

  it('exclut les valeurs open data à résultat nul de la couverture', () => {
    const cells = toGridCells([
      {
        definition: { id: 3 },
        sources: {
          citepa: {
            libelle: 'CITEPA',
            metadonnees: [{ id: 5, methodologie: null, dateVersion: '2026-01-01' }],
            valeurs: [
              { id: 90, dateValeur: '2030-01-01', resultat: null, metadonneeId: 5 },
            ],
          },
        },
      },
    ]);

    expect(cells.size).toBe(0);
  });
});
