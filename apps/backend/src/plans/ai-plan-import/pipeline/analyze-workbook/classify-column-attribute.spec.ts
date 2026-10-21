import { describe, expect, it } from 'vitest';
import {
  describeAttributes,
  describeLabelConflicts,
} from './classify-column-attribute';
import { classifyGridRows } from './classify-grid-rows';
import { detectTableHeader } from './detect-table-header';
import { matchColumnLabel } from './match-column-label';
import { profileColumns, readGridValues } from './profile-columns';
import { buildTextGrid } from './sheet-grid';
import { ColumnLayout, FicheBlock } from './sheet-layout';

/**
 * Les attributs d'un tableau dont la première colonne est le titre : une
 * fiche par rangée, sauf blocs de rangées donnés.
 */
const attributesOf = (
  rows: string[][],
  {
    ficheRows,
    listValues,
  }: { ficheRows?: number[][]; listValues?: ReadonlySet<string> } = {}
): ColumnLayout[] => {
  const grid = buildTextGrid('Plan', rows);
  const header = detectTableHeader(grid);
  const classified = classifyGridRows(grid, header);
  const valueAt = readGridValues(grid, classified);
  const profiles = profileColumns(
    grid,
    classified,
    header?.labels ?? [],
    valueAt
  );
  const fiches: FicheBlock[] = (
    ficheRows ?? rows.slice(1).map((_, index) => [index + 2])
  ).map((blockRows) => ({
    rows: blockRows,
    path: [],
    titre: valueAt(blockRows[0], 1),
    numero: null,
  }));
  return describeAttributes({
    profiles: profiles.slice(1),
    roleOfLabel: (profile) => matchColumnLabel(profile.label),
    fiches,
    perRow: ficheRows === undefined,
    valueAt,
    listValues,
  });
};

const TITRES = [
  'Créer une ligne de bus express',
  'Aménager des aires de covoiturage',
  'Ouvrir un guichet unique',
  'Former les artisans',
];

/** Une colonne d'attribut sous un libellé, à côté des titres. */
const columnOf = (label: string, values: string[]) =>
  attributesOf([
    ['Action', label],
    ...values.map((value, index) => [TITRES[index], value]),
  ])[0];

describe('describeAttributes', () => {
  it('lit une colonne vide, sauf un budget consommé encore à remplir', () => {
    expect(
      attributesOf([
        ['Action', 'Remarques', 'Budget consommé', 'Pilote'],
        [TITRES[0], '', '', 'Interco'],
        [TITRES[1], '', '', 'Commune'],
      ]).map(({ role }) => role)
    ).toEqual(['vide', 'budgetConsomme', 'structurePilote']);
  });

  it('lit des croix sous une année comme un calendrier', () => {
    expect(columnOf('2025', ['x', 'X', '', 'x'])).toMatchObject({
      role: 'calendrier',
      year: 2025,
    });
    expect(columnOf('Réalisé', ['x', 'X', 'x', 'x'])).toMatchObject({
      role: 'autre',
      reason: 'croix sans année au-dessus',
    });
  });

  it('ne range une date en échéance que si le libellé le dit', () => {
    const dates = ['12/03/2025', '01/09/2026', '2027', '47727'];

    expect(columnOf('Échéance', dates).role).toBe('dateFin');
    expect(columnOf('Date de début', dates).role).toBe('dateDebut');
    expect(columnOf('Mise à jour', dates).role).toBe('autre');
  });

  it('lit un avancement chiffré comme un statut, un avancement rédigé non', () => {
    expect(columnOf('Avancement', ['50 %', '100%', '0', '25 %']).role).toBe(
      'statut'
    );
    expect(
      columnOf('Avancement', [
        'Le marché a été lancé en juin',
        'Réunion avec les communes à prévoir',
        'Les travaux démarrent à la rentrée',
        'Attente de la subvention régionale',
      ])
    ).toMatchObject({
      role: 'autre',
      reason: "texte libre sous un libellé d'avancement",
    });
  });

  it('lit des montants selon leur libellé, ou leur symbole', () => {
    const amounts = ['12000', '3500', '80000', '1500'];

    expect(columnOf('Financements', amounts).role).toBe('financements');
    expect(columnOf('Valeur cible', amounts).role).toBe('cible');
    expect(columnOf('Colonne 3', amounts).role).toBe('autre');
    expect(
      columnOf('Colonne 3', ['12 000 €', '3 500 €', '80 000 €', '1 500 €']).role
    ).toBe('budget');
  });

  it('lit une liste fermée de statuts, ou de valeurs d’un onglet de liste', () => {
    expect(
      columnOf('Colonne 2', ['En cours', 'À venir', 'En cours', 'À venir']).role
    ).toBe('statut');
    expect(
      attributesOf(
        [
          ['Action', 'Colonne 2'],
          ...TITRES.map((titre, index) => [titre, index % 2 ? 'V1' : 'V2']),
        ],
        { listValues: new Set(['v1', 'v2', 'v3']) }
      )[0].role
    ).toBe('statut');
  });

  it('garde une priorité en liste fermée, même tenue par un onglet de liste', () => {
    expect(
      attributesOf(
        [
          ['Action', 'Priorité'],
          ...TITRES.map((titre, index) => [titre, index % 2 ? 'P1' : 'P2']),
        ],
        { listValues: new Set(['p1', 'p2']) }
      )[0].role
    ).toBe('priorite');
  });

  it('lit un calendrier en texte s’il cite une année', () => {
    expect(
      columnOf('Calendrier', ['Fin 2025', 'Printemps 2026', '', '2027']).role
    ).toBe('calendrier');
    expect(
      columnOf('Calendrier', [
        'Dès que possible',
        'À la rentrée',
        'Avant l’été',
        'Plus tard',
      ]).role
    ).toBe('autre');
  });

  it('suit le libellé d’un texte, et reconnaît des structures sans libellé', () => {
    const structures = [
      'ADEME / Région',
      'Interco',
      'Syndicat des eaux',
      'CMA',
    ];

    expect(columnOf('Partenaires', structures).role).toBe('partenaires');
    expect(columnOf('Colonne 2', structures).role).toBe('structurePilote');
    expect(
      columnOf('Colonne 2', [
        'Une première idée assez longue',
        'Une deuxième idée assez longue',
        'Une troisième idée assez longue',
        'Une quatrième idée assez longue',
      ]).role
    ).toBe('autre');
  });

  it('fait d’un second montant un financement', () => {
    const layouts = attributesOf([
      ['Action', 'Montant Région', 'Budget prévisionnel'],
      [TITRES[0], '12 000 €', '30 000 €'],
      [TITRES[1], '5 000 €', '9 000 €'],
    ]);

    expect(
      layouts.map(({ role, isSecondaryAmount }) => [role, !!isSecondaryAmount])
    ).toEqual([
      ['financements', true],
      ['budget', false],
    ]);
  });

  it('somme un budget annuel, sauf s’il a un total', () => {
    const yearly = attributesOf([
      ['Action', 'Budget 2025', 'Budget 2026'],
      [TITRES[0], '12 000 €', '30 000 €'],
      [TITRES[1], '5 000 €', '9 000 €'],
    ]);
    const withTotal = attributesOf([
      ['Action', 'Budget 2025', 'Budget 2026', 'Total'],
      [TITRES[0], '12 000 €', '30 000 €', '42 000 €'],
      [TITRES[1], '5 000 €', '9 000 €', '14 000 €'],
    ]);

    expect(yearly.map(({ role, reason }) => [role, reason])).toEqual([
      ['budget', 'budget annuel, sommé'],
      ['budget', 'budget annuel, sommé'],
    ]);
    expect(withTotal.map(({ role }) => role)).toEqual([
      'autre',
      'autre',
      'budget',
    ]);
  });

  it('lit une valeur par fiche au niveau de la fiche, sinon rangée par rangée', () => {
    const layouts = attributesOf(
      [
        ['Action', 'Pilote', 'Budget', 'Statut'],
        [TITRES[0], 'Interco', '12 000 €', 'En cours'],
        [TITRES[0], 'Interco', '', 'À venir'],
        [TITRES[2], 'Commune', '5 000 €', 'Terminé'],
        [TITRES[2], 'Commune', '', 'En cours'],
      ],
      {
        ficheRows: [
          [2, 3],
          [4, 5],
        ],
      }
    );

    expect(layouts.map(({ letter, level }) => `${letter}:${level}`)).toEqual([
      'B:fiche',
      'C:fiche',
      'D:row',
    ]);
  });

  it('nomme chaque colonne par sa lettre', () => {
    expect(columnOf('Pilote', ['Interco', 'CMA', 'Commune', 'ADEME'])).toEqual(
      expect.objectContaining({ col: 2, letter: 'B', label: 'Pilote' })
    );
  });
});

describe('describeLabelConflicts', () => {
  const column = (
    col: number,
    label: string,
    role: ColumnLayout['role']
  ): ColumnLayout => ({
    col,
    letter: String.fromCharCode(64 + col),
    label,
    role,
    level: 'fiche',
    reason: '',
  });
  const roleOfLabel = (columns: ColumnLayout[]) => (col: number) =>
    matchColumnLabel(columns.find((column) => column.col === col)?.label ?? '');

  it('signale un libellé qui annonce autre chose que le contenu', () => {
    const columns = [
      column(1, 'Fiche action', 'titre'),
      column(2, 'PILOTE', 'sousAction'),
    ];

    expect(
      describeLabelConflicts('Suivi', columns, roleOfLabel(columns))
    ).toEqual([
      'Onglet « Suivi », colonne B : le libellé « PILOTE » annonce structure pilote, mais le contenu est lu comme sous-actions.',
    ]);
  });

  it('tolère des rôles voisins, une colonne vide ou non reconnue', () => {
    const columns = [
      column(1, 'Porteur', 'personnePilote'),
      column(2, 'Commentaires', 'description'),
      column(3, 'Budget', 'financements'),
      column(4, 'Statut', 'vide'),
      column(5, 'Statut', 'autre'),
      column(6, 'Colonne 6', 'budget'),
    ];

    expect(
      describeLabelConflicts('Suivi', columns, roleOfLabel(columns))
    ).toEqual([]);
  });

  it('nomme le fichier CSV, qui n’a pas d’onglet', () => {
    const columns = [column(1, 'Statut', 'budget')];

    expect(describeLabelConflicts('', columns, roleOfLabel(columns))).toEqual([
      'Le fichier CSV, colonne A : le libellé « Statut » annonce statut, mais le contenu est lu comme budget.',
    ]);
  });
});
