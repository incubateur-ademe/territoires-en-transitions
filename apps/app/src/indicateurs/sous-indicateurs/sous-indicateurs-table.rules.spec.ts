import type { IndicateurTotalAtDate } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import {
  buildSousIndicateursTableData,
  toSousIndicateurNode,
  listSousIndicateurIdsInTableOrder,
  type SousIndicateurNode,
  type SousIndicateursTableData,
} from './sous-indicateurs-table.rules';

const EMPTY = { status: 'empty' } as const;

const toValue = (valeur: number) => ({ status: 'value', valeur } as const);

const toNodes = (
  nodes: readonly SousIndicateurNode[]
): Map<number, SousIndicateurNode> =>
  new Map(nodes.map((node) => [node.id, node]));

const toCompleteTotal = ({
  dateValeur,
  valeur,
}: {
  dateValeur: string;
  valeur: number;
}): IndicateurTotalAtDate => ({
  dateValeur,
  resultat: { status: 'complete', valeur },
  objectif: { status: 'no-sous-indicateur' },
});

const tree = toNodes([
  { id: 1, label: 'Déchets', enfantIds: [2, 3] },
  { id: 2, label: 'Ménagers', enfantIds: [4, 5] },
  { id: 3, label: 'Verre', enfantIds: [] },
  { id: 4, label: 'Ordures', enfantIds: [] },
  { id: 5, label: 'Recyclables', enfantIds: [] },
]);

const toTableData = ({
  rootId = 1,
  nodesById = tree,
  valeursByIndicateurId = new Map(),
  totalsByIndicateurId = new Map(),
}: Partial<Parameters<typeof buildSousIndicateursTableData>[0]> = {}) =>
  buildSousIndicateursTableData({
    rootId,
    nodesById,
    valeursByIndicateurId,
    totalsByIndicateurId,
  });

const toCellsOfRow = (data: SousIndicateursTableData, label: string) =>
  data.rows.find((row) => row.label === label)?.cells;

describe('buildSousIndicateursTableData', () => {
  it("liste les descendants en profondeur d'abord, indentés par niveau", () => {
    const { rows } = toTableData();

    expect(rows.map(({ label, depth }) => ({ label, depth }))).toEqual([
      { label: 'Ménagers', depth: 0 },
      { label: 'Ordures', depth: 1 },
      { label: 'Recyclables', depth: 1 },
      { label: 'Verre', depth: 0 },
    ]);
  });

  it("trie les sous-indicateurs d'un même niveau par titre quelle que soit l'ordre reçu", () => {
    const reordered = toNodes([
      { id: 1, label: 'Déchets', enfantIds: [3, 2] },
      { id: 2, label: 'Ménagers', enfantIds: [5, 4] },
      { id: 3, label: 'Verre', enfantIds: [] },
      { id: 4, label: 'Ordures', enfantIds: [] },
      { id: 5, label: 'Recyclables', enfantIds: [] },
    ]);

    expect(toTableData({ nodesById: reordered }).rows).toEqual(
      toTableData().rows
    );
  });

  it('trie par titre en ignorant les accents et la casse, puis par identifiant à titre égal', () => {
    const { rows } = toTableData({
      nodesById: toNodes([
        { id: 1, label: 'Racine', enfantIds: [2, 3, 4, 5] },
        { id: 2, label: 'Zéro', enfantIds: [] },
        { id: 3, label: 'éolien', enfantIds: [] },
        { id: 4, label: 'Eau', enfantIds: [] },
        { id: 5, label: 'Eau', enfantIds: [] },
      ]),
    });

    expect(rows.map(({ indicateurId }) => indicateurId)).toEqual([4, 5, 3, 2]);
  });

  it("trie les nombres des titres dans l'ordre numérique, Sous 2 avant Sous 10", () => {
    const { rows } = toTableData({
      nodesById: toNodes([
        { id: 1, label: 'Racine', enfantIds: [2, 3, 4] },
        { id: 2, label: 'Sous 10', enfantIds: [] },
        { id: 3, label: 'Sous 2', enfantIds: [] },
        { id: 4, label: 'Sous 1', enfantIds: [] },
      ]),
    });

    expect(rows.map(({ label }) => label)).toEqual([
      'Sous 1',
      'Sous 2',
      'Sous 10',
    ]);
  });

  it("affiche le résultat et l'objectif saisis d'une feuille pour chaque année", () => {
    const data = toTableData({
      valeursByIndicateurId: new Map([
        [
          3,
          [
            {
              dateValeur: '2022-01-01',
              resultat: 500,
              objectif: 480,
            },
            {
              dateValeur: '2023-01-01',
              resultat: 520,
              objectif: null,
            },
          ],
        ],
      ]),
    });

    expect(toCellsOfRow(data, 'Verre')).toEqual([
      {
        dateValeur: '2022-01-01',
        resultat: toValue(500),
        objectif: toValue(480),
      },
      { dateValeur: '2023-01-01', resultat: toValue(520), objectif: EMPTY },
    ]);
  });

  it("affiche une cellule de résultat vide quand le résultat saisi est explicitement null, sans toucher à l'objectif", () => {
    const data = toTableData({
      valeursByIndicateurId: new Map([
        [
          3,
          [
            {
              dateValeur: '2022-01-01',
              resultat: null,
              objectif: 480,
            },
          ],
        ],
      ]),
    });

    expect(toCellsOfRow(data, 'Verre')).toEqual([
      { dateValeur: '2022-01-01', resultat: EMPTY, objectif: toValue(480) },
    ]);
  });

  it("affiche le total d'un niveau intermédiaire au lieu de ses propres valeurs", () => {
    const data = toTableData({
      valeursByIndicateurId: new Map([
        [2, [{ dateValeur: '2022-01-01', resultat: 1, objectif: null }]],
      ]),
      totalsByIndicateurId: new Map([
        [2, [toCompleteTotal({ dateValeur: '2022-01-01', valeur: 208 })]],
      ]),
    });

    expect(toCellsOfRow(data, 'Ménagers')).toEqual([
      { dateValeur: '2022-01-01', resultat: toValue(208), objectif: EMPTY },
    ]);
  });

  it.each([
    { status: 'not-additive' },
    { status: 'no-sous-indicateur' },
  ] as const)(
    "affiche une cellule vide pour le résultat et l'objectif d'un niveau intermédiaire au statut $status",
    ({ status }) => {
      const data = toTableData({
        totalsByIndicateurId: new Map([
          [
            2,
            [
              {
                dateValeur: '2026-01-01',
                resultat: { status },
                objectif: { status },
              },
              {
                dateValeur: '2022-01-01',
                resultat: { status },
                objectif: { status },
              },
            ],
          ],
        ]),
      });

      expect(toCellsOfRow(data, 'Ménagers')).toEqual([
        { dateValeur: '2022-01-01', resultat: EMPTY, objectif: EMPTY },
        { dateValeur: '2026-01-01', resultat: EMPTY, objectif: EMPTY },
      ]);
    }
  );

  it('signale un total incomplet avec le nombre de sous-indicateurs remplis', () => {
    const { totalCells } = toTableData({
      totalsByIndicateurId: new Map([
        [
          1,
          [
            {
              dateValeur: '2022-01-01',
              resultat: {
                status: 'incomplete',
                filledCount: 2,
                expectedCount: 3,
              },
              objectif: { status: 'not-additive' },
            },
          ],
        ],
      ]),
    });

    expect(totalCells).toEqual([
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'incomplete', filledCount: 2, expectedCount: 3 },
        objectif: EMPTY,
      },
    ]);
  });

  it('masque le total quand le serveur le cache à un visiteur, résultat comme objectif', () => {
    const { totalCells } = toTableData({
      totalsByIndicateurId: new Map([
        [
          1,
          [
            {
              dateValeur: '2022-01-01',
              resultat: { status: 'hidden' },
              objectif: { status: 'hidden' },
            },
            {
              dateValeur: '2026-01-01',
              resultat: { status: 'hidden' },
              objectif: { status: 'hidden' },
            },
          ],
        ],
      ]),
    });

    expect(totalCells).toEqual([
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'hidden' },
        objectif: { status: 'hidden' },
      },
      {
        dateValeur: '2026-01-01',
        resultat: { status: 'hidden' },
        objectif: { status: 'hidden' },
      },
    ]);
  });

  it('réunit les années des feuilles et des totaux, triées par ordre croissant', () => {
    const { columns } = toTableData({
      valeursByIndicateurId: new Map([
        [
          3,
          [
            {
              dateValeur: '2025-01-01',
              resultat: null,
              objectif: 1,
            },
            {
              dateValeur: '2020-01-01',
              resultat: 1,
              objectif: null,
            },
          ],
        ],
        [4, [{ dateValeur: '2022-01-01', resultat: 1, objectif: null }]],
      ]),
      totalsByIndicateurId: new Map([
        [1, [toCompleteTotal({ dateValeur: '2024-01-01', valeur: 10 })]],
        [2, [toCompleteTotal({ dateValeur: '2022-01-01', valeur: 10 })]],
      ]),
    });

    expect(columns).toEqual([
      { dateValeur: '2020-01-01' },
      { dateValeur: '2022-01-01' },
      { dateValeur: '2024-01-01' },
      { dateValeur: '2025-01-01' },
    ]);
  });

  it("renvoie pour chaque ligne et pour le total une cellule par période affichée, vide quand il n'y a pas de valeur", () => {
    const data = toTableData({
      valeursByIndicateurId: new Map([
        [3, [{ dateValeur: '2022-01-01', resultat: 7, objectif: null }]],
      ]),
      totalsByIndicateurId: new Map([
        [1, [toCompleteTotal({ dateValeur: '2023-01-01', valeur: 9 })]],
      ]),
    });

    expect(data.columns.map(({ dateValeur }) => dateValeur)).toEqual([
      '2022-01-01',
      '2023-01-01',
    ]);
    expect(toCellsOfRow(data, 'Verre')).toEqual([
      { dateValeur: '2022-01-01', resultat: toValue(7), objectif: EMPTY },
      { dateValeur: '2023-01-01', resultat: EMPTY, objectif: EMPTY },
    ]);
    expect(toCellsOfRow(data, 'Ordures')).toEqual([
      { dateValeur: '2022-01-01', resultat: EMPTY, objectif: EMPTY },
      { dateValeur: '2023-01-01', resultat: EMPTY, objectif: EMPTY },
    ]);
    expect(data.totalCells).toEqual([
      { dateValeur: '2022-01-01', resultat: EMPTY, objectif: EMPTY },
      { dateValeur: '2023-01-01', resultat: toValue(9), objectif: EMPTY },
    ]);
  });

  it("affiche une colonne par date quand plusieurs dates tombent dans la même année, dans l'ordre chronologique", () => {
    const data = toTableData({
      valeursByIndicateurId: new Map([
        [
          3,
          [
            { dateValeur: '2022-12-01', resultat: 7, objectif: null },
            { dateValeur: '2022-01-01', resultat: 3, objectif: null },
          ],
        ],
      ]),
    });

    expect(data.columns).toEqual([
      { dateValeur: '2022-01-01' },
      { dateValeur: '2022-12-01' },
    ]);
    expect(toCellsOfRow(data, 'Verre')).toEqual([
      { dateValeur: '2022-01-01', resultat: toValue(3), objectif: EMPTY },
      { dateValeur: '2022-12-01', resultat: toValue(7), objectif: EMPTY },
    ]);
  });

  it("laisse vide le mois sans valeur d'une feuille quand un autre mois a une valeur", () => {
    const data = toTableData({
      valeursByIndicateurId: new Map([
        [3, [{ dateValeur: '2022-01-01', resultat: 3, objectif: null }]],
        [4, [{ dateValeur: '2022-02-01', resultat: 5, objectif: null }]],
      ]),
    });

    expect(toCellsOfRow(data, 'Verre')).toEqual([
      { dateValeur: '2022-01-01', resultat: toValue(3), objectif: EMPTY },
      { dateValeur: '2022-02-01', resultat: EMPTY, objectif: EMPTY },
    ]);
  });

  it('place chaque total de niveau intermédiaire sur sa date, sans le regrouper par année', () => {
    const data = toTableData({
      totalsByIndicateurId: new Map([
        [
          2,
          [
            {
              dateValeur: '2022-12-01',
              resultat: {
                status: 'incomplete',
                filledCount: 1,
                expectedCount: 2,
              },
              objectif: { status: 'no-sous-indicateur' },
            },
            toCompleteTotal({ dateValeur: '2022-01-01', valeur: 208 }),
          ],
        ],
      ]),
    });

    expect(toCellsOfRow(data, 'Ménagers')).toEqual([
      { dateValeur: '2022-01-01', resultat: toValue(208), objectif: EMPTY },
      {
        dateValeur: '2022-12-01',
        resultat: { status: 'incomplete', filledCount: 1, expectedCount: 2 },
        objectif: EMPTY,
      },
    ]);
  });

  it('place chaque total de la ligne de total sur sa date, sans le regrouper par année', () => {
    const { totalCells } = toTableData({
      totalsByIndicateurId: new Map([
        [
          1,
          [
            toCompleteTotal({ dateValeur: '2022-12-01', valeur: 9 }),
            toCompleteTotal({ dateValeur: '2022-01-01', valeur: 4 }),
          ],
        ],
      ]),
    });

    expect(totalCells).toEqual([
      { dateValeur: '2022-01-01', resultat: toValue(4), objectif: EMPTY },
      { dateValeur: '2022-12-01', resultat: toValue(9), objectif: EMPTY },
    ]);
  });

  it('donne une clé unique à chaque ligne, même quand un sous-indicateur est atteint par deux chemins', () => {
    const { rows } = toTableData({
      nodesById: toNodes([
        { id: 1, label: 'Racine', enfantIds: [2, 3] },
        { id: 2, label: 'Premier', enfantIds: [4] },
        { id: 3, label: 'Second', enfantIds: [4] },
        { id: 4, label: 'Partagé', enfantIds: [] },
      ]),
    });

    expect(rows.map(({ rowKey }) => rowKey)).toEqual([
      '1/2',
      '1/2/4',
      '1/3',
      '1/3/4',
    ]);
  });

  it('ne boucle pas quand un indicateur est son propre descendant', () => {
    const { rows } = toTableData({
      nodesById: toNodes([
        { id: 1, label: 'Racine', enfantIds: [2] },
        { id: 2, label: 'Enfant', enfantIds: [1] },
      ]),
    });

    expect(rows.map(({ label }) => label)).toEqual(['Enfant']);
  });

  it('ignore un sous-indicateur déclaré deux fois sous le même parent', () => {
    const { rows } = toTableData({
      nodesById: toNodes([
        { id: 1, label: 'Racine', enfantIds: [2, 2] },
        { id: 2, label: 'Enfant', enfantIds: [] },
      ]),
    });

    expect(rows.map(({ label }) => label)).toEqual(['Enfant']);
  });

  it('ne renvoie aucune ligne ni aucune année pour un indicateur sans sous-indicateur', () => {
    expect(toTableData({ rootId: 3 })).toEqual({
      columns: [],
      rows: [],
      hasTotalRow: true,
      totalCells: [],
    });
  });

  it("n'affiche pas la ligne de total quand le cumul des sous-indicateurs est décoché", () => {
    const { hasTotalRow } = toTableData({
      totalsByIndicateurId: new Map([
        [
          1,
          [
            {
              dateValeur: '2022-01-01',
              resultat: { status: 'not-additive' },
              objectif: { status: 'not-additive' },
            },
          ],
        ],
      ]),
    });

    expect(hasTotalRow).toBe(false);
  });

  it('affiche la ligne de total quand le cumul des sous-indicateurs est coché', () => {
    const { hasTotalRow } = toTableData({
      totalsByIndicateurId: new Map([
        [1, [toCompleteTotal({ dateValeur: '2022-01-01', valeur: 9 })]],
      ]),
    });

    expect(hasTotalRow).toBe(true);
  });

  it('rattache chaque ligne à son parent, les enfants directs de la racine sans parent', () => {
    const { rows } = toTableData();

    expect(
      rows.map(({ rowKey, parentRowKey }) => ({ rowKey, parentRowKey }))
    ).toEqual([
      { rowKey: '1/2', parentRowKey: null },
      { rowKey: '1/2/4', parentRowKey: '1/2' },
      { rowKey: '1/2/5', parentRowKey: '1/2' },
      { rowKey: '1/3', parentRowKey: null },
    ]);
  });

  it('marque dépliables les seules lignes qui ont des sous-indicateurs affichés', () => {
    const { rows } = toTableData();

    expect(
      rows.map(({ label, isExpandable }) => ({ label, isExpandable }))
    ).toEqual([
      { label: 'Ménagers', isExpandable: true },
      { label: 'Ordures', isExpandable: false },
      { label: 'Recyclables', isExpandable: false },
      { label: 'Verre', isExpandable: false },
    ]);
  });

  it('ne marque pas dépliable un sous-indicateur dont les enfants sont des ancêtres déjà parcourus', () => {
    const { rows } = toTableData({
      nodesById: toNodes([
        { id: 1, label: 'Racine', enfantIds: [2] },
        { id: 2, label: 'Enfant', enfantIds: [1] },
      ]),
    });

    expect(rows.map(({ isExpandable }) => isExpandable)).toEqual([false]);
  });

  it('donne une couleur différente à chaque sous-indicateur', () => {
    const { rows } = toTableData();

    expect(new Set(rows.map(({ color }) => color)).size).toBe(rows.length);
  });

  it('donne la même couleur à un sous-indicateur atteint par deux chemins', () => {
    const { rows } = toTableData({
      nodesById: toNodes([
        { id: 1, label: 'Racine', enfantIds: [2, 3] },
        { id: 2, label: 'Premier', enfantIds: [4] },
        { id: 3, label: 'Second', enfantIds: [4] },
        { id: 4, label: 'Partagé', enfantIds: [] },
      ]),
    });

    const colorsOfShared = rows
      .filter(({ indicateurId }) => indicateurId === 4)
      .map(({ color }) => color);
    expect(colorsOfShared).toHaveLength(2);
    expect(new Set(colorsOfShared).size).toBe(1);
  });
});

describe('listSousIndicateurIdsInTableOrder', () => {
  it("liste les identifiants dans l'ordre des lignes du tableau, sans doublon", () => {
    expect(
      listSousIndicateurIdsInTableOrder({
        rootId: 1,
        nodesById: toNodes([
          { id: 1, label: 'Racine', enfantIds: [2, 3] },
          { id: 2, label: 'Premier', enfantIds: [4] },
          { id: 3, label: 'Second', enfantIds: [4] },
          { id: 4, label: 'Partagé', enfantIds: [] },
        ]),
      })
    ).toEqual([2, 4, 3]);
  });
});

describe('toSousIndicateurNode', () => {
  it('nomme le sous-indicateur par son titre court quand il existe', () => {
    expect(
      toSousIndicateurNode({
        id: 4,
        titre: 'Ordures ménagères résiduelles',
        titreCourt: 'Ordures',
        enfants: [{ id: 8 }, { id: 9 }],
      })
    ).toEqual({ id: 4, label: 'Ordures', enfantIds: [8, 9] });
  });

  it('nomme le sous-indicateur par son titre quand le titre court est vide ou absent', () => {
    expect(
      toSousIndicateurNode({
        id: 4,
        titre: 'Ordures ménagères',
        titreCourt: '',
        enfants: [],
      }).label
    ).toBe('Ordures ménagères');
    expect(
      toSousIndicateurNode({
        id: 4,
        titre: 'Ordures ménagères',
        titreCourt: null,
        enfants: [],
      }).label
    ).toBe('Ordures ménagères');
  });
});
