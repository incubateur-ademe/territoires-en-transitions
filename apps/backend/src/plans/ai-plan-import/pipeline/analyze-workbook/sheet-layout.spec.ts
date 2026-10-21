import { describe, expect, it } from 'vitest';
import {
  columnsOf,
  ColumnLayout,
  FicheBlock,
  findAxisTitle,
  SheetLayout,
  sousActionRowsOf,
  summarizeChecks,
} from './sheet-layout';

const column = (col: number, role: ColumnLayout['role']): ColumnLayout => ({
  col,
  letter: String.fromCharCode(64 + col),
  label: '',
  role,
  level: 'fiche',
  reason: '',
});

const fiche = (
  rows: number[],
  extra: Partial<FicheBlock> = {}
): FicheBlock => ({
  rows,
  path: [],
  titre: 'Rénover les écoles du territoire',
  numero: null,
  ...extra,
});

const layoutOf = (
  overrides: Partial<SheetLayout>,
  values: Record<string, string> = {}
): SheetLayout => ({
  sheet: 'Plan',
  shape: 'verticale',
  header: null,
  titleTexts: [],
  columns: [],
  fiches: [],
  sousActionCol: null,
  form: null,
  valueAt: (row, col) => values[`${row}:${col}`] ?? '',
  uncoveredRows: 0,
  confidence: 1,
  confident: true,
  reasons: [],
  warnings: [],
  ...overrides,
});

describe('summarizeChecks', () => {
  it('mesure la part des contrôles réussis et les détaille', () => {
    expect(
      summarizeChecks([
        [true, '3 fiches'],
        [false, 'titres trop courts'],
      ])
    ).toEqual({
      confidence: 0.5,
      confident: false,
      reasons: ['✓ 3 fiches', '✗ titres trop courts'],
    });
  });

  it('n’est confiant que si tous les contrôles passent', () => {
    expect(
      summarizeChecks([
        [true, 'a'],
        [true, 'b'],
      ])
    ).toMatchObject({
      confidence: 1,
      confident: true,
    });
  });
});

describe('columnsOf', () => {
  it('garde les colonnes du rôle demandé, dans l’ordre', () => {
    const layout = layoutOf({
      columns: [column(1, 'titre'), column(2, 'budget'), column(4, 'budget')],
    });

    expect(columnsOf(layout, 'budget').map(({ col }) => col)).toEqual([2, 4]);
    expect(columnsOf(layout, 'statut')).toEqual([]);
  });
});

describe('sousActionRowsOf', () => {
  it('lit les rangées remplies dans la colonne des sous-actions', () => {
    const layout = layoutOf(
      { sousActionCol: 3 },
      { '2:3': 'Étudier le tracé', '4:3': 'Acheter deux bus' }
    );

    expect(sousActionRowsOf(layout, fiche([2, 3, 4]))).toEqual([2, 4]);
  });

  it('préfère les rangées que la numérotation a données', () => {
    const layout = layoutOf({ sousActionCol: 3 }, { '2:3': 'Étudier' });

    expect(
      sousActionRowsOf(layout, fiche([2, 5, 6], { sousActionRows: [5, 6] }))
    ).toEqual([5, 6]);
  });

  it('ne donne rien sans colonne de sous-actions', () => {
    expect(sousActionRowsOf(layoutOf({}), fiche([2, 3]))).toEqual([]);
  });
});

describe('findAxisTitle', () => {
  it('trouve le texte d’onglet qui nomme un axe', () => {
    expect(
      findAxisTitle(
        layoutOf({
          titleTexts: ['Plan climat 2025', 'Axe 1 – Mobilité durable'],
        })
      )
    ).toBe('Axe 1 – Mobilité durable');
  });

  it('ne prend pas un titre quelconque pour un axe', () => {
    expect(
      findAxisTitle(layoutOf({ titleTexts: ['Plan climat 2025'] }))
    ).toBeNull();
  });
});
