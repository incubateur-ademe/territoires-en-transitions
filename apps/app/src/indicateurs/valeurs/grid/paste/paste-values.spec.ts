import { describe, expect, it } from 'vitest';
import { pasteValues } from './paste-values';
import {
  generateCellKey,
  CellKey,
  GridCell,
  GridRowGroup,
  toIndicateurId,
  toYear,
} from '../types';

const years = [2030, 2036].map(toYear);

const groups: GridRowGroup[] = [
  {
    id: 'g',
    label: 'G',
    rows: [
      { indicateurId: toIndicateurId(1), label: 'A' },
      { indicateurId: toIndicateurId(2), label: 'B' },
      { indicateurId: toIndicateurId(3), label: 'C' },
    ],
  },
];

const userData: GridCell = { kind: 'user-data', value: null, coveringSources: [] };
const openData: GridCell = {
  kind: 'open-data',
  value: 5,
  adoptedSourceId: 's',
  source: { sourceId: 's', libelle: 'S', methodologie: null, dateVersion: '2026-01-01' },
};

const cells = new Map<CellKey, GridCell>([
  [generateCellKey(toIndicateurId(1), toYear(2030)), userData],
  [generateCellKey(toIndicateurId(1), toYear(2036)), userData],
  [generateCellKey(toIndicateurId(2), toYear(2030)), openData],
  [generateCellKey(toIndicateurId(2), toYear(2036)), userData],
  [generateCellKey(toIndicateurId(3), toYear(2030)), userData],
  [generateCellKey(toIndicateurId(3), toYear(2036)), userData],
]);

const paste = (text: string, anchorId: number, anchorYear: number) =>
  pasteValues({
    text,
    anchorIndicateurId: toIndicateurId(anchorId),
    anchorYear: toYear(anchorYear),
    groups,
    years,
    cells,
  });

describe('pasteValues', () => {
  it('mappe un bloc TSV positionnellement depuis la cellule ancre', () => {
    const { cellsToWrite, skipped } = paste('10\t20\n30\t40', 1, 2030);

    expect(cellsToWrite).toEqual([
      { indicateurId: 1, valueId: undefined, year: 2030, resultat: 10 },
      { indicateurId: 1, valueId: undefined, year: 2036, resultat: 20 },
      { indicateurId: 2, valueId: undefined, year: 2030, resultat: 30 },
      { indicateurId: 2, valueId: undefined, year: 2036, resultat: 40 },
    ]);
    expect(skipped).toBe(0);
  });

  it('reecrit une cellule open-data (retour en saisie utilisateur)', () => {
    const { cellsToWrite, skipped } = paste('7', 2, 2030);

    expect(cellsToWrite).toEqual([
      { indicateurId: 2, valueId: undefined, year: 2030, resultat: 7 },
    ]);
    expect(skipped).toBe(0);
  });

  it('decoupe un bloc Excel (TSV) et lit les decimales a la virgule', () => {
    const { cellsToWrite, skipped } = paste('12,5\t8\n3\t4,2', 1, 2030);

    expect(cellsToWrite).toEqual([
      { indicateurId: 1, valueId: undefined, year: 2030, resultat: 12.5 },
      { indicateurId: 1, valueId: undefined, year: 2036, resultat: 8 },
      { indicateurId: 2, valueId: undefined, year: 2030, resultat: 3 },
      { indicateurId: 2, valueId: undefined, year: 2036, resultat: 4.2 },
    ]);
    expect(skipped).toBe(0);
  });

  it('ne compte pas une cellule vide de padding Excel comme ignoree', () => {
    const { cellsToWrite, skipped } = paste('5\t', 3, 2030);

    expect(cellsToWrite).toEqual([
      { indicateurId: 3, valueId: undefined, year: 2030, resultat: 5 },
    ]);
    expect(skipped).toBe(0);
  });

  it('ne decoupe pas un CSV a points-virgules en colonnes', () => {
    const { cellsToWrite, skipped } = paste('12;8', 1, 2030);

    expect(cellsToWrite).toEqual([]);
    expect(skipped).toBe(1);
  });

  it('tolere les espaces irreguliers autour des valeurs', () => {
    const { cellsToWrite, skipped } = paste('  12,5  \t  8  \n 3 \t 4,2 ', 1, 2030);

    expect(cellsToWrite).toEqual([
      { indicateurId: 1, valueId: undefined, year: 2030, resultat: 12.5 },
      { indicateurId: 1, valueId: undefined, year: 2036, resultat: 8 },
      { indicateurId: 2, valueId: undefined, year: 2030, resultat: 3 },
      { indicateurId: 2, valueId: undefined, year: 2036, resultat: 4.2 },
    ]);
    expect(skipped).toBe(0);
  });

  it('ignore les cellules hors de la grille', () => {
    const { cellsToWrite, skipped } = paste('1\t2\n3', 3, 2036);

    expect(cellsToWrite).toEqual([
      { indicateurId: 3, valueId: undefined, year: 2036, resultat: 1 },
    ]);
    expect(skipped).toBe(2);
  });

  it('ignore une saisie non numerique sans ecraser la cible', () => {
    const { cellsToWrite, skipped } = paste('abc', 1, 2030);

    expect(cellsToWrite).toEqual([]);
    expect(skipped).toBe(1);
  });

  it('rend un resultat vide pour un collage vide', () => {
    expect(paste('', 1, 2030)).toEqual({ cellsToWrite: [], skipped: 0 });
  });

  it('rend un resultat vide pour une ancre inconnue', () => {
    expect(paste('10', 99, 2030)).toEqual({ cellsToWrite: [], skipped: 0 });
  });
});
