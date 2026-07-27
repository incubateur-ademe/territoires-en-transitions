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

const emptyCell: GridCell = { resultat: null, objectif: null };
const cellWithResultat: GridCell = { resultat: 5, objectif: null };

const cells = new Map<CellKey, GridCell>([
  [generateCellKey(toIndicateurId(1), toYear(2030)), emptyCell],
  [generateCellKey(toIndicateurId(1), toYear(2036)), emptyCell],
  [generateCellKey(toIndicateurId(2), toYear(2030)), cellWithResultat],
  [generateCellKey(toIndicateurId(2), toYear(2036)), emptyCell],
  [generateCellKey(toIndicateurId(3), toYear(2030)), emptyCell],
  [generateCellKey(toIndicateurId(3), toYear(2036)), emptyCell],
]);

const paste = (
  text: string,
  anchorId: number,
  anchorYear: number,
  anchorField: 'resultat' | 'objectif' = 'resultat'
) =>
  pasteValues({
    text,
    anchorIndicateurId: toIndicateurId(anchorId),
    anchorYear: toYear(anchorYear),
    anchorField,
    groups,
    years,
    cells,
  });

describe('pasteValues', () => {
  it('mappe un bloc TSV positionnellement depuis la cellule ancre', () => {
    const { cellsToWrite, skipped } = paste('10\t20\n30\t40', 1, 2030, 'resultat');

    expect(cellsToWrite).toEqual([
      { indicateurId: 1, year: 2030, field: 'resultat', value: 10 },
      { indicateurId: 1, year: 2030, field: 'objectif', value: 20 },
      { indicateurId: 2, year: 2030, field: 'resultat', value: 30 },
      { indicateurId: 2, year: 2030, field: 'objectif', value: 40 },
    ]);
    expect(skipped).toBe(0);
  });

  it('reecrit le resultat existant d une cellule', () => {
    const { cellsToWrite, skipped } = paste('7', 2, 2030, 'resultat');

    expect(cellsToWrite).toEqual([
      { indicateurId: 2, year: 2030, field: 'resultat', value: 7 },
    ]);
    expect(skipped).toBe(0);
  });

  it('cible objectif depuis la colonne objectif', () => {
    const { cellsToWrite, skipped } = paste('15', 1, 2030, 'objectif');

    expect(cellsToWrite).toEqual([
      { indicateurId: 1, year: 2030, field: 'objectif', value: 15 },
    ]);
    expect(skipped).toBe(0);
  });

  it('decoupe un bloc Excel (TSV) et lit les decimales a la virgule', () => {
    const { cellsToWrite, skipped } = paste('12,5\t8\n3\t4,2', 1, 2030, 'resultat');

    expect(cellsToWrite).toEqual([
      { indicateurId: 1, year: 2030, field: 'resultat', value: 12.5 },
      { indicateurId: 1, year: 2030, field: 'objectif', value: 8 },
      { indicateurId: 2, year: 2030, field: 'resultat', value: 3 },
      { indicateurId: 2, year: 2030, field: 'objectif', value: 4.2 },
    ]);
    expect(skipped).toBe(0);
  });

  it('ne compte pas une cellule vide de padding Excel comme ignoree', () => {
    const { cellsToWrite, skipped } = paste('5\t', 3, 2030, 'resultat');

    expect(cellsToWrite).toEqual([
      { indicateurId: 3, year: 2030, field: 'resultat', value: 5 },
    ]);
    expect(skipped).toBe(0);
  });

  it('ne decoupe pas un CSV a points-virgules en colonnes', () => {
    const { cellsToWrite, skipped } = paste('12;8', 1, 2030, 'resultat');

    expect(cellsToWrite).toEqual([]);
    expect(skipped).toBe(1);
  });

  it('tolere les espaces irreguliers autour des valeurs', () => {
    const { cellsToWrite, skipped } = paste('  12,5  \t  8  \n 3 \t 4,2 ', 1, 2030, 'resultat');

    expect(cellsToWrite).toEqual([
      { indicateurId: 1, year: 2030, field: 'resultat', value: 12.5 },
      { indicateurId: 1, year: 2030, field: 'objectif', value: 8 },
      { indicateurId: 2, year: 2030, field: 'resultat', value: 3 },
      { indicateurId: 2, year: 2030, field: 'objectif', value: 4.2 },
    ]);
    expect(skipped).toBe(0);
  });

  it('ignore les cellules hors de la grille', () => {
    const { cellsToWrite, skipped } = paste('1\t2\n3', 3, 2036, 'objectif');

    expect(cellsToWrite).toEqual([
      { indicateurId: 3, year: 2036, field: 'objectif', value: 1 },
    ]);
    expect(skipped).toBe(2);
  });

  it('ignore une saisie non numerique sans ecraser la cible', () => {
    const { cellsToWrite, skipped } = paste('abc', 1, 2030, 'resultat');

    expect(cellsToWrite).toEqual([]);
    expect(skipped).toBe(1);
  });

  it('rend un resultat vide pour un collage vide', () => {
    expect(paste('', 1, 2030, 'resultat')).toEqual({ cellsToWrite: [], skipped: 0 });
  });

  it('rend un resultat vide pour une ancre inconnue', () => {
    expect(paste('10', 99, 2030, 'resultat')).toEqual({
      cellsToWrite: [],
      skipped: 0,
    });
  });
});
