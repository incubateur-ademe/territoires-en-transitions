import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import type { SousIndicateursTableState } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table-state.rules';
import type {
  SousIndicateurCell,
  SousIndicateurRowCell,
  SousIndicateursTableData,
  SousIndicateurTableRow,
} from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import {
  NO_COMMENTAIRES,
  type PeriodeCommentaires,
} from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-commentaires.rules';
import { getIndicateurValeurFieldLabel } from '@/app/indicateurs/valeurs/grid/indicateur-valeur.field';
import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurSousIndicateursTableProvider } from '../../context/indicateur-sous-indicateurs-table.context';
import { IndicateurSousIndicateursTable } from './indicateur-sous-indicateurs-table.view';

const COLLECTIVITE_ID = 7;
const FIRST_DATE = '2020-01-01';
const SECOND_DATE = '2021-01-01';
const TABLE_NAME = { name: appLabels.indicateurSousIndicateursValeurs };
const EMPTY: SousIndicateurCell = { status: 'empty' };

type PeriodCells = readonly [
  Pick<SousIndicateurRowCell, 'resultat' | 'objectif'>,
  Pick<SousIndicateurRowCell, 'resultat' | 'objectif'>
];

const toValueCell = (valeur: number): SousIndicateurCell => ({
  status: 'value',
  valeur,
});

const toResultatCells = (first: number, second: number): PeriodCells => [
  { resultat: toValueCell(first), objectif: EMPTY },
  { resultat: toValueCell(second), objectif: EMPTY },
];

const toRowCells = ([first, second]: PeriodCells): SousIndicateurRowCell[] => [
  { dateValeur: FIRST_DATE, ...first },
  { dateValeur: SECOND_DATE, ...second },
];

const toRow = ({
  rowKey,
  parentRowKey,
  isExpandable,
  indicateurId,
  label,
  depth,
  cells,
}: Pick<
  SousIndicateurTableRow,
  | 'rowKey'
  | 'parentRowKey'
  | 'isExpandable'
  | 'indicateurId'
  | 'label'
  | 'depth'
> & { cells: PeriodCells }): SousIndicateurTableRow => ({
  rowKey,
  parentRowKey,
  isExpandable,
  indicateurId,
  label,
  color: 'red',
  depth,
  cells: toRowCells(cells),
});

const toData = ({
  totalCells,
  hasTotalRow = true,
  ordureCells = toResultatCells(100, 110),
}: {
  totalCells: PeriodCells;
  hasTotalRow?: boolean;
  ordureCells?: PeriodCells;
}): SousIndicateursTableData => ({
  columns: [{ dateValeur: FIRST_DATE }, { dateValeur: SECOND_DATE }],
  rows: [
    toRow({
      rowKey: '1/2',
      parentRowKey: null,
      isExpandable: true,
      indicateurId: 2,
      label: 'Ménagers',
      depth: 0,
      cells: toResultatCells(208, 215),
    }),
    toRow({
      rowKey: '1/2/3',
      parentRowKey: '1/2',
      isExpandable: true,
      indicateurId: 3,
      label: 'Ordures',
      depth: 1,
      cells: ordureCells,
    }),
    toRow({
      rowKey: '1/2/3/4',
      parentRowKey: '1/2/3',
      isExpandable: true,
      indicateurId: 4,
      label: 'Verre',
      depth: 2,
      cells: toResultatCells(20, 21),
    }),
    toRow({
      rowKey: '1/2/3/4/5',
      parentRowKey: '1/2/3/4',
      isExpandable: false,
      indicateurId: 5,
      label: 'Bouteilles',
      depth: 3,
      cells: toResultatCells(8, 9),
    }),
    toRow({
      rowKey: '1/6',
      parentRowKey: null,
      isExpandable: false,
      indicateurId: 6,
      label: 'Papier',
      depth: 0,
      cells: toResultatCells(1, 2),
    }),
  ],
  hasTotalRow,
  totalCells: toRowCells(totalCells),
});

const toReadyState = (
  data: SousIndicateursTableData
): SousIndicateursTableState => ({
  status: 'ready',
  collectiviteId: COLLECTIVITE_ID,
  data,
});

type RenderOptions = {
  periodicite?: IndicateurPeriodicite;
  isReadonly?: boolean;
  canDetach?: boolean;
  commentairesOf?: (periode: IndicateurPeriode) => PeriodeCommentaires;
};

const renderTable = (
  state: SousIndicateursTableState,
  {
    periodicite = 'annuelle',
    isReadonly = true,
    canDetach = false,
    commentairesOf = () => NO_COMMENTAIRES,
  }: RenderOptions = {}
) => {
  const useSousIndicateursTable = vi.fn(() => state);
  const saveValeur = vi.fn().mockResolvedValue(true);
  const declarePeriodes = vi.fn().mockResolvedValue(undefined);
  const deletePeriode = vi.fn().mockResolvedValue(undefined);
  const saveCommentaires = vi.fn().mockResolvedValue(true);
  const detachSousIndicateur = vi.fn();
  render(
    <IndicateurSousIndicateursTableProvider
      value={{
        useSousIndicateursTable,
        useSaveSousIndicateurValeur: () => saveValeur,
        useDeclareSousIndicateursPeriodes: () => declarePeriodes,
        useDeleteSousIndicateursPeriode: () => deletePeriode,
        useDetachSousIndicateur: () => detachSousIndicateur,
        useSousIndicateursCommentaires: () => ({
          commentairesOf,
          save: saveCommentaires,
        }),
      }}
    >
      <IndicateurSousIndicateursTable
        indicateurId={1}
        titre="Déchets"
        unite="t"
        periodicite={periodicite}
        isReadonly={isReadonly}
        canDetach={canDetach}
      />
    </IndicateurSousIndicateursTableProvider>
  );
  return {
    useSousIndicateursTable,
    saveValeur,
    declarePeriodes,
    deletePeriode,
    saveCommentaires,
    detachSousIndicateur,
  };
};

const renderReadyTable = (
  data: SousIndicateursTableData,
  options?: RenderOptions
) => renderTable(toReadyState(data), options);

const getRowOf = (rowHeaderName: RegExp | string): HTMLElement => {
  const row = screen
    .getByRole('rowheader', { name: rowHeaderName })
    .closest('tr');
  if (row === null) {
    throw new Error(`Ligne introuvable pour ${rowHeaderName}`);
  }
  return row;
};

const toValuesOf = (rowHeaderName: RegExp | string): (string | null)[] =>
  within(getRowOf(rowHeaderName))
    .getAllByRole('cell')
    .map((cell) => within(cell).getByText(/^\d+$/).textContent);

const toBodyRowHeaders = (): (string | null)[] =>
  screen
    .getAllByRole('rowheader')
    .map((header) => header.textContent?.trim() ?? null);

const expand = (label: string) =>
  fireEvent.click(
    screen.getByRole('button', {
      name: appLabels.indicateurSousIndicateurDeplier({ label }),
    })
  );

const expandAll = () => {
  expand('Ménagers');
  expand('Ordures');
  expand('Verre');
};

const TOTAL_ROW_NAME = appLabels.indicateurSousIndicateursTotalSomme;
const COMPLETE_TOTAL_CELLS = toResultatCells(308, 321);
const RESULTAT = 'Résultat';
const OBJECTIF = 'Objectif';

describe('IndicateurSousIndicateursTable', () => {
  it("charge les sous-indicateurs de l'indicateur affiché", () => {
    const { useSousIndicateursTable } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS })
    );

    expect(useSousIndicateursTable).toHaveBeenCalledWith(1);
  });

  it("nomme le tableau et son en-tête de titre avec le titre et l'unité de l'indicateur", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(screen.getByRole('table', TABLE_NAME)).toBeDefined();
    expect(
      screen.getByRole('columnheader', { name: 'Déchets (t)' })
    ).toBeDefined();
  });

  it("affiche l'en-tête de chaque année dans l'ordre", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(
      screen
        .getAllByRole('columnheader')
        .slice(1)
        .map((header) => header.textContent)
    ).toEqual(['2020', '2021']);
  });

  it('affiche un en-tête par mois, pas par année, pour un indicateur mensuel', () => {
    const monthlyData: SousIndicateursTableData = {
      ...toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      columns: [{ dateValeur: '2020-01-01' }, { dateValeur: '2020-02-01' }],
    };

    renderReadyTable(monthlyData, { periodicite: 'mensuelle' });

    const headers = screen
      .getAllByRole('columnheader')
      .slice(1)
      .map((header) => header.textContent);
    expect(new Set(headers).size).toBe(2);
  });

  it("épingle à gauche le titre de l'indicateur au défilement horizontal", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(
      screen.getByRole('columnheader', { name: 'Déchets (t)' }).className
    ).toContain('sticky');
  });

  it('enregistre le résultat saisi sur la feuille avec son indicateur et la période de la colonne', async () => {
    const { saveValeur } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { isReadonly: false }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: getIndicateurValeurFieldLabel('resultat', '2020'),
      })
    );
    const input = screen.getByRole('textbox', {
      name: getIndicateurValeurFieldLabel('resultat', '2020'),
    });
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await vi.waitFor(() => expect(saveValeur).toHaveBeenCalledTimes(1));
    const [saved] = saveValeur.mock.calls[0];
    expect({
      indicateurId: saved.indicateurId,
      field: saved.field,
      value: saved.value,
      periode: IndicateurPeriodes.format(saved.periode),
    }).toEqual({
      indicateurId: 6,
      field: 'resultat',
      value: 7,
      periode: '2020',
    });
  });

  it('ne rend éditable que la ligne de la feuille, ni le total ni un niveau intermédiaire', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      isReadonly: false,
    });

    expect(
      screen.getAllByRole('button', {
        name: getIndicateurValeurFieldLabel('resultat', '2020'),
      })
    ).toHaveLength(1);
  });

  it("déclare l'année ajoutée sur chaque feuille du tableau, pas sur les niveaux intermédiaires", async () => {
    const { declarePeriodes } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { isReadonly: false }
    );

    const input = screen.getByRole('textbox', { name: 'Ajouter une année' });
    fireEvent.change(input, { target: { value: '2024' } });
    fireEvent.click(
      screen.getByRole('button', { name: 'Valider et ajouter une année' })
    );

    await vi.waitFor(() => expect(declarePeriodes).toHaveBeenCalledTimes(1));
    const [indicateurIds, periodes] = declarePeriodes.mock.calls[0];
    expect(indicateurIds).toEqual([5, 6]);
    expect(
      periodes.map((periode: IndicateurPeriode) =>
        IndicateurPeriodes.format(periode)
      )
    ).toEqual(['2024']);
  });

  it("ne propose pas d'ajouter une année en lecture seule", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(
      screen.queryByRole('textbox', { name: 'Ajouter une année' })
    ).toBeNull();
  });

  it("propose d'ajouter un mois, et non une année, pour un indicateur mensuel", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      periodicite: 'mensuelle',
      isReadonly: false,
    });

    expect(
      screen.queryByRole('textbox', { name: 'Ajouter une année' })
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Ajouter un mois' })
    ).toBeDefined();
  });

  it('demande confirmation avant de supprimer une période qui a des valeurs, puis la supprime sur chaque feuille', async () => {
    const { deletePeriode } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { isReadonly: false }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurSupprimerPeriode('2020'),
      })
    );

    expect(deletePeriode).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: appLabels.confirmer }));

    await vi.waitFor(() => expect(deletePeriode).toHaveBeenCalledTimes(1));
    const [{ indicateurIds, periode }] = deletePeriode.mock.calls[0];
    expect(indicateurIds).toEqual([1, 5, 6]);
    expect(IndicateurPeriodes.format(periode)).toBe('2020');
  });

  it('ne supprime rien quand la confirmation est annulée', () => {
    const { deletePeriode } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { isReadonly: false }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurSupprimerPeriode('2020'),
      })
    );
    fireEvent.click(screen.getByRole('button', { name: appLabels.annuler }));

    expect(deletePeriode).not.toHaveBeenCalled();
  });

  it("supprime sans confirmation une période dont les feuilles n'ont aucune valeur", async () => {
    const withoutLeafValues = toData({ totalCells: COMPLETE_TOTAL_CELLS });
    const { deletePeriode } = renderReadyTable(
      {
        ...withoutLeafValues,
        rows: withoutLeafValues.rows.map((row) =>
          row.isExpandable
            ? row
            : {
                ...row,
                cells: row.cells.map((cell) => ({
                  ...cell,
                  resultat: EMPTY,
                  objectif: EMPTY,
                })),
              }
        ),
      },
      { isReadonly: false }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurSupprimerPeriode('2020'),
      })
    );

    await vi.waitFor(() => expect(deletePeriode).toHaveBeenCalledTimes(1));
  });

  it('ne propose pas de supprimer une période en lecture seule', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(
      screen.queryByRole('button', {
        name: appLabels.indicateurSupprimerPeriode('2020'),
      })
    ).toBeNull();
  });

  it('ouvre les commentaires de la période du parent et les enregistre', async () => {
    const { saveCommentaires } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { isReadonly: false }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurCommentairesPeriode('2020'),
      })
    );
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'Mesuré en mars' },
    });
    fireEvent.click(screen.getByRole('button', { name: appLabels.valider }));

    await vi.waitFor(() => expect(saveCommentaires).toHaveBeenCalledTimes(1));
    const [{ periode, commentaires }] = saveCommentaires.mock.calls[0];
    expect(IndicateurPeriodes.format(periode)).toBe('2020');
    expect(commentaires).toEqual({ resultat: 'Mesuré en mars', objectif: '' });
  });

  it("n'affiche en lecture seule la ligne de commentaires que pour les périodes commentées", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      commentairesOf: (periode) =>
        IndicateurPeriodes.format(periode) === '2021'
          ? { resultat: 'Vérifié', objectif: '' }
          : NO_COMMENTAIRES,
    });

    expect(
      screen.queryByRole('button', {
        name: appLabels.indicateurCommentairesPeriode('2020'),
      })
    ).toBeNull();
    expect(
      screen.getByRole('button', {
        name: appLabels.indicateurCommentairesPeriode('2021'),
      })
    ).toBeDefined();
  });

  it("demande confirmation avant de supprimer une période qui n'a qu'un commentaire du parent", () => {
    const withoutLeafValues = toData({ totalCells: COMPLETE_TOTAL_CELLS });
    const { deletePeriode } = renderReadyTable(
      {
        ...withoutLeafValues,
        rows: withoutLeafValues.rows.map((row) => ({
          ...row,
          cells: row.cells.map((cell) => ({
            ...cell,
            resultat: EMPTY,
            objectif: EMPTY,
          })),
        })),
      },
      {
        isReadonly: false,
        commentairesOf: () => ({ resultat: 'À conserver', objectif: '' }),
      }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurSupprimerPeriode('2020'),
      })
    );

    expect(deletePeriode).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: appLabels.confirmer })
    ).toBeDefined();
  });

  it('demande confirmation avant de dissocier le sous-indicateur de la ligne, puis le dissocie', () => {
    const { detachSousIndicateur } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { canDetach: true }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurSousIndicateurDissocier({ label: 'Papier' }),
      })
    );

    expect(detachSousIndicateur).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: appLabels.confirmer }));

    expect(detachSousIndicateur).toHaveBeenCalledWith(6);
  });

  it('ne dissocie rien quand la confirmation est annulée', () => {
    const { detachSousIndicateur } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { canDetach: true }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurSousIndicateurDissocier({ label: 'Papier' }),
      })
    );
    fireEvent.click(screen.getByRole('button', { name: appLabels.annuler }));

    expect(detachSousIndicateur).not.toHaveBeenCalled();
  });

  it('propose la dissociation sur chaque ligne de sous-indicateur visible, pas sur le total', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canDetach: true,
    });

    expect(
      screen
        .getAllByRole('button')
        .filter((button) =>
          (button.getAttribute('aria-label') ?? '').startsWith('Dissocier')
        )
        .map((button) => button.getAttribute('aria-label'))
    ).toEqual(['Dissocier Ménagers', 'Dissocier Papier']);
  });

  it('ne propose pas la dissociation sans le droit de modifier la structure', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      isReadonly: false,
      canDetach: false,
    });

    expect(
      screen.queryByRole('button', {
        name: appLabels.indicateurSousIndicateurDissocier({ label: 'Papier' }),
      })
    ).toBeNull();
  });

  it('ne propose aucune saisie en lecture seule', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(
      screen.queryByRole('button', {
        name: getIndicateurValeurFieldLabel('resultat', '2020'),
      })
    ).toBeNull();
  });

  it("affiche la légende du résultat et de l'objectif au-dessus du tableau", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(screen.getAllByText(RESULTAT).length).toBeGreaterThan(0);
    expect(screen.getAllByText(OBJECTIF).length).toBeGreaterThan(0);
  });

  it('affiche la ligne de total en première ligne, avant les sous-indicateurs', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(toBodyRowHeaders()).toEqual([
      TOTAL_ROW_NAME,
      'Ménagers niveau 1',
      'Papier niveau 1',
    ]);
  });

  it("n'affiche pas de ligne de total quand le cumul des sous-indicateurs est décoché", () => {
    renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS, hasTotalRow: false })
    );

    expect(
      screen.queryByRole('rowheader', { name: TOTAL_ROW_NAME })
    ).toBeNull();
  });

  it("ne montre que les enfants directs de la racine tant que rien n'est déplié", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(screen.queryByRole('rowheader', { name: /^Ordures/ })).toBeNull();
    expect(screen.queryByRole('rowheader', { name: /^Verre/ })).toBeNull();
  });

  it('propose un bouton de dépliage aux seules lignes qui ont des sous-indicateurs', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(
      screen.getByRole('button', {
        name: appLabels.indicateurSousIndicateurDeplier({ label: 'Ménagers' }),
      })
    ).toBeDefined();
    expect(within(getRowOf(/^Papier/)).queryByRole('button')).toBeNull();
  });

  it("déplie une ligne pour montrer ses enfants et annonce qu'elle est dépliée", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expand('Ménagers');

    expect(screen.getByRole('rowheader', { name: /^Ordures/ })).toBeDefined();
    expect(
      screen
        .getByRole('button', {
          name: appLabels.indicateurSousIndicateurReplier({
            label: 'Ménagers',
          }),
        })
        .getAttribute('aria-expanded')
    ).toBe('true');
    expect(screen.queryByRole('rowheader', { name: /^Verre/ })).toBeNull();
  });

  it('replie une ligne dépliée et cache aussi ses petits-enfants', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));
    expandAll();

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurSousIndicateurReplier({ label: 'Ménagers' }),
      })
    );

    expect(screen.queryByRole('rowheader', { name: /^Ordures/ })).toBeNull();
    expect(screen.queryByRole('rowheader', { name: /^Verre/ })).toBeNull();
  });

  it('affiche les valeurs de chaque ligne dans le même ordre que les années', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));
    expandAll();

    expect(toValuesOf(/^Ménagers/)).toEqual(['208', '215']);
    expect(toValuesOf(/^Ordures/)).toEqual(['100', '110']);
    expect(toValuesOf(TOTAL_ROW_NAME)).toEqual(['308', '321']);
  });

  it("affiche le résultat et l'objectif d'une même année avec leur libellé pour les lecteurs d'écran", () => {
    renderReadyTable(
      toData({
        totalCells: [
          { resultat: toValueCell(308), objectif: toValueCell(300) },
          { resultat: EMPTY, objectif: toValueCell(310) },
        ],
      })
    );

    const [firstYearCell, secondYearCell] = within(
      getRowOf(TOTAL_ROW_NAME)
    ).getAllByRole('cell');
    expect(within(firstYearCell).getByText(RESULTAT)).toBeDefined();
    expect(within(firstYearCell).getByText('308')).toBeDefined();
    expect(within(firstYearCell).getByText(OBJECTIF)).toBeDefined();
    expect(within(firstYearCell).getByText('300')).toBeDefined();
    expect(within(secondYearCell).queryByText(RESULTAT)).toBeNull();
    expect(within(secondYearCell).getByText('310')).toBeDefined();
  });

  it('annonce le niveau de chaque sous-indicateur et lui donne un lien vers sa page', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));
    expandAll();

    const expectedRows = [
      { rowHeader: /^Ménagers niveau 1/, label: 'Ménagers', indicateurId: 2 },
      { rowHeader: /^Ordures niveau 2/, label: 'Ordures', indicateurId: 3 },
      { rowHeader: /^Verre niveau 3/, label: 'Verre', indicateurId: 4 },
      {
        rowHeader: /^Bouteilles niveau 4/,
        label: 'Bouteilles',
        indicateurId: 5,
      },
    ];
    expect(
      expectedRows.map(({ rowHeader, label }) =>
        within(getRowOf(rowHeader))
          .getByRole('link', { name: label })
          .getAttribute('href')
      )
    ).toEqual(
      expectedRows.map(({ indicateurId }) =>
        makeCollectiviteIndicateursUrl({
          collectiviteId: COLLECTIVITE_ID,
          indicateurView: 'perso',
          indicateurId,
        })
      )
    );
  });

  it('indique combien de sous-indicateurs sont remplis quand le total est incomplet', () => {
    renderReadyTable(
      toData({
        totalCells: [
          {
            resultat: {
              status: 'incomplete',
              filledCount: 2,
              expectedCount: 3,
            },
            objectif: EMPTY,
          },
          { resultat: toValueCell(321), objectif: EMPTY },
        ],
      })
    );

    const [incompleteCell] = within(getRowOf(TOTAL_ROW_NAME)).getAllByRole(
      'cell'
    );
    expect(within(incompleteCell).getByText('incomplet (2/3)')).toBeDefined();
    expect(within(incompleteCell).queryByText(/^\d+$/)).toBeNull();
  });

  it("affiche « Non renseigné » quand ni le résultat ni l'objectif ne sont renseignés", () => {
    renderReadyTable(
      toData({
        totalCells: [
          { resultat: EMPTY, objectif: EMPTY },
          { resultat: toValueCell(321), objectif: EMPTY },
        ],
      })
    );

    const [emptyCell] = within(getRowOf(TOTAL_ROW_NAME)).getAllByRole('cell');
    expect(
      within(emptyCell).getByText(appLabels.indicateurValeurAbsente)
    ).toBeDefined();
    expect(within(emptyCell).queryByText(RESULTAT)).toBeNull();
  });

  it("remplace un total masqué à un visiteur par un tiret ignoré des lecteurs d'écran et annonce une valeur masquée", () => {
    renderReadyTable(
      toData({
        totalCells: [
          { resultat: toValueCell(308), objectif: EMPTY },
          { resultat: { status: 'hidden' }, objectif: toValueCell(330) },
        ],
      })
    );

    const [, hiddenCell] = within(getRowOf(TOTAL_ROW_NAME)).getAllByRole(
      'cell'
    );
    expect(within(hiddenCell).queryByText('308')).toBeNull();
    expect(within(hiddenCell).getByText('-').getAttribute('aria-hidden')).toBe(
      'true'
    );
    expect(
      within(hiddenCell).getByText(appLabels.indicateurValeurMasquee)
    ).toBeDefined();
    expect(within(hiddenCell).getByText('330')).toBeDefined();
  });

  it("indique qu'il n'y a aucune donnée quand l'indicateur n'a aucune ligne", () => {
    renderReadyTable({
      columns: [],
      rows: [],
      hasTotalRow: true,
      totalCells: [],
    });

    expect(screen.getByText(appLabels.aucuneDonneeDisponible)).toBeDefined();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('annonce le chargement sans afficher de tableau', () => {
    renderTable({ status: 'loading' });

    expect(screen.getByRole('status').textContent).toBe(
      appLabels.indicateurSousIndicateursChargement
    );
    expect(screen.queryByRole('table')).toBeNull();
  });

  it("signale que les sous-indicateurs n'ont pas pu être chargés en cas d'erreur", () => {
    renderTable({ status: 'error' });

    expect(screen.getByRole('alert').textContent).toBe(
      appLabels.indicateurSousIndicateursErreur
    );
    expect(screen.queryByRole('table')).toBeNull();
  });
});
