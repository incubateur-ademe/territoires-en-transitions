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
} from '../../../table/indicateur-periode-commentaires.rules';
import { getIndicateurValeurFieldLabel } from '@/app/indicateurs/valeurs/grid/indicateur-valeur.field';
import type { SousIndicateursCapabilities } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-capabilities.rules';
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
  canMutateIndicateur?: boolean;
  focusedIndicateurId?: number | null;
  isConfidentiel?: boolean;
  isCumul?: boolean;
  capabilities?: SousIndicateursCapabilities;
  commentairesOf?: (periode: IndicateurPeriode) => PeriodeCommentaires;
  areCommentairesReady?: boolean;
};

const renderTable = (
  state: SousIndicateursTableState,
  {
    periodicite = 'annuelle',
    isReadonly = true,
    canMutateIndicateur = false,
    focusedIndicateurId = null,
    isConfidentiel = false,
    isCumul = true,
    capabilities = {
      cumul: isCumul ? 'enabled' : 'disabled',
      canEditStructure: true,
    },
    commentairesOf = () => NO_COMMENTAIRES,
    areCommentairesReady = true,
  }: RenderOptions = {}
) => {
  const useSousIndicateursTable = vi.fn(() => state);
  const saveValeur = vi.fn().mockResolvedValue(true);
  const declarePeriodes = vi.fn().mockResolvedValue(undefined);
  const deletePeriode = vi.fn().mockResolvedValue(undefined);
  const saveCommentaires = vi.fn().mockResolvedValue(true);
  const detachSousIndicateur = vi.fn();
  const updateCumul = vi.fn();
  const createSousIndicateur = vi.fn();
  const renameSousIndicateur = vi.fn();
  const onNameEditingEnd = vi.fn();
  const onCreated = vi.fn();
  const onPrivateModeChange = vi.fn();
  render(
    <IndicateurSousIndicateursTableProvider
      value={{
        useSousIndicateursTable,
        useSaveSousIndicateurValeur: () => saveValeur,
        useDeclareSousIndicateursPeriodes: () => declarePeriodes,
        useDeleteSousIndicateursPeriode: () => deletePeriode,
        useDetachSousIndicateur: () => detachSousIndicateur,
        useCreateSousIndicateur: () => createSousIndicateur,
        useRenameSousIndicateur: () => renameSousIndicateur,
        useUpdateSousIndicateursCumul: () => updateCumul,
        useIndicateurPeriodeCommentaires: () => ({
          commentairesOf,
          isReady: areCommentairesReady,
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
        canMutateIndicateur={canMutateIndicateur}
        newSousIndicateur={{
          id: focusedIndicateurId,
          onCreated,
          onNameEditingEnd,
        }}
        capabilities={capabilities}
        privateMode={{ isConfidentiel, onChange: onPrivateModeChange }}
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
    updateCumul,
    createSousIndicateur,
    renameSousIndicateur,
    onNameEditingEnd,
    onCreated,
    onPrivateModeChange,
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

  it("n'épingle pas la première colonne au défilement horizontal, comme le tableau de la page détail", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(
      screen.getByRole('columnheader', { name: 'Déchets (t)' }).className
    ).not.toContain('sticky');
    expect(
      screen.getByRole('rowheader', { name: TOTAL_ROW_NAME }).className
    ).not.toContain('sticky');
    expect(getRowOf(/^Papier/).querySelector('th')?.className).not.toContain(
      'sticky'
    );
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

  it('ne propose aucun commentaire tant que les commentaires existants ne sont pas chargés', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      isReadonly: false,
      canMutateIndicateur: true,
      areCommentairesReady: false,
    });

    expect(
      screen.queryByRole('button', {
        name: appLabels.indicateurCommentairesPeriode('2020'),
      })
    ).toBeNull();
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
      { canMutateIndicateur: true }
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
      { canMutateIndicateur: true }
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
      canMutateIndicateur: true,
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
      canMutateIndicateur: false,
    });

    expect(
      screen.queryByRole('button', {
        name: appLabels.indicateurSousIndicateurDissocier({ label: 'Papier' }),
      })
    ).toBeNull();
  });

  it('propose le cumul coché quand le total est affiché, et le décoche', () => {
    const { updateCumul } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { canMutateIndicateur: true }
    );

    const cumul = screen.getByRole('checkbox', {
      name: appLabels.indicateurCumulSousIndicateurs,
    }) as HTMLInputElement;
    expect(cumul.checked).toBe(true);
    fireEvent.click(cumul);

    expect(updateCumul).toHaveBeenCalledWith(false);
  });

  it("propose le cumul décoché quand le total n'est pas affiché, et le coche", () => {
    const { updateCumul } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS, hasTotalRow: false }),
      { canMutateIndicateur: true, isCumul: false }
    );

    const cumul = screen.getByRole('checkbox', {
      name: appLabels.indicateurCumulSousIndicateurs,
    }) as HTMLInputElement;
    expect(cumul.checked).toBe(false);
    fireEvent.click(cumul);

    expect(updateCumul).toHaveBeenCalledWith(true);
  });

  it("montre le cumul décoché et masque la ligne Total quand l'indicateur n'est pas un cumul, même si aucun total n'a signalé de somme impossible", () => {
    renderReadyTable(
      toData({ hasTotalRow: true, totalCells: COMPLETE_TOTAL_CELLS }),
      {
        canMutateIndicateur: true,
        isCumul: false,
      }
    );

    const cumul = screen.getByRole('checkbox', {
      name: appLabels.indicateurCumulSousIndicateurs,
    }) as HTMLInputElement;
    expect(cumul.checked).toBe(false);
    expect(
      screen.queryByRole('rowheader', {
        name: appLabels.indicateurSousIndicateursTotalSomme,
      })
    ).toBeNull();
  });

  it("ne propose pas le cumul sans le droit de modifier l'indicateur", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: false,
    });

    expect(
      screen.queryByRole('checkbox', {
        name: appLabels.indicateurCumulSousIndicateurs,
      })
    ).toBeNull();
  });

  describe("d'un indicateur prédéfini, sans cumul ni structure modifiable", () => {
    const PREDEFINI: SousIndicateursCapabilities = {
      cumul: 'unavailable',
      canEditStructure: false,
    };

    it("n'offre aucune action de l'indicateur, même avec le droit de le modifier", () => {
      renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
        isReadonly: false,
        canMutateIndicateur: true,
        capabilities: PREDEFINI,
      });

      expect(
        screen.queryByRole('group', { name: appLabels.indicateurActions })
      ).toBeNull();
      expect(
        screen.queryByRole('checkbox', {
          name: appLabels.indicateurCumulSousIndicateurs,
        })
      ).toBeNull();
      expect(
        screen.queryByRole('checkbox', {
          name: appLabels.indicateurResultatRecentModePrive,
        })
      ).toBeNull();
      expect(
        screen.queryByRole('button', {
          name: appLabels.indicateurCreerSousIndicateur,
        })
      ).toBeNull();
    });

    it('masque la ligne Total même quand aucun total ne signale de somme impossible', () => {
      renderReadyTable(
        toData({ hasTotalRow: true, totalCells: COMPLETE_TOTAL_CELLS }),
        { canMutateIndicateur: true, capabilities: PREDEFINI }
      );

      expect(
        screen.queryByRole('rowheader', { name: TOTAL_ROW_NAME })
      ).toBeNull();
    });

    it('ne propose ni renommage ni dissociation des sous-indicateurs', () => {
      renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
        canMutateIndicateur: true,
        capabilities: PREDEFINI,
      });

      expect(
        screen.queryByRole('button', {
          name: appLabels.indicateurSousIndicateurRenommer({ label: 'Papier' }),
        })
      ).toBeNull();
      expect(
        screen.queryByRole('button', {
          name: appLabels.indicateurSousIndicateurDissocier({
            label: 'Papier',
          }),
        })
      ).toBeNull();
      expect(screen.getByText('Papier')).toBeTruthy();
    });

    it('garde la saisie des valeurs des sous-indicateurs quand elle est autorisée', () => {
      renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
        isReadonly: false,
        canMutateIndicateur: true,
        capabilities: PREDEFINI,
      });

      expect(
        screen.getAllByRole('button', {
          name: getIndicateurValeurFieldLabel('resultat', '2020'),
        }).length
      ).toBeGreaterThan(0);
    });
  });

  it('crée un sous-indicateur de la racine nommé à la suite des sous-indicateurs de premier niveau', () => {
    const { createSousIndicateur } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { canMutateIndicateur: true }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurCreerSousIndicateur,
      })
    );

    expect(createSousIndicateur).toHaveBeenCalledWith(
      { parentId: 1, titre: 'Sous-indicateur 3' },
      expect.anything()
    );
  });

  it("range la création, le cumul et le mode privé dans le même groupe d'actions de l'indicateur", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: true,
    });

    const actions = within(
      screen.getByRole('group', { name: appLabels.indicateurActions })
    );

    expect(
      actions.getByRole('button', {
        name: appLabels.indicateurCreerSousIndicateur,
      })
    ).toBeDefined();
    expect(
      actions.getByRole('checkbox', {
        name: appLabels.indicateurCumulSousIndicateurs,
      })
    ).toBeDefined();
    expect(
      actions.getByRole('checkbox', {
        name: appLabels.indicateurResultatRecentModePrive,
      })
    ).toBeDefined();
  });

  it("marque d'un cadenas la dernière période qui a un résultat quand le mode privé est activé, comme les autres indicateurs", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      isConfidentiel: true,
    });

    const cadenas = { name: appLabels.resultatModePrive };
    expect(
      within(screen.getByRole('columnheader', { name: /2021/ })).getByRole(
        'img',
        cadenas
      )
    ).toBeDefined();
    expect(
      within(screen.getByRole('columnheader', { name: /2020/ })).queryByRole(
        'img',
        cadenas
      )
    ).toBeNull();
  });

  it("n'affiche aucun cadenas quand le mode privé est désactivé", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      isConfidentiel: false,
    });

    expect(
      screen.queryByRole('img', { name: appLabels.resultatModePrive })
    ).toBeNull();
  });

  it("ne propose pas le mode privé tant que le tableau n'a aucune période, comme les autres indicateurs sans valeur", () => {
    renderReadyTable(
      {
        columns: [],
        rows: [
          {
            rowKey: '1/2',
            parentRowKey: null,
            isExpandable: false,
            indicateurId: 2,
            label: 'Ménagers',
            color: 'red',
            depth: 0,
            cells: [],
          },
        ],
        hasTotalRow: false,
        totalCells: [],
      },
      { canMutateIndicateur: true }
    );

    expect(
      screen.getByRole('button', {
        name: appLabels.indicateurCreerSousIndicateur,
      })
    ).toBeDefined();
    expect(
      screen.queryByRole('checkbox', {
        name: appLabels.indicateurResultatRecentModePrive,
      })
    ).toBeNull();
  });

  it("ne propose pas de créer un sous-indicateur sans le droit de modifier l'indicateur", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: false,
    });

    expect(
      screen.queryByRole('button', {
        name: appLabels.indicateurCreerSousIndicateur,
      })
    ).toBeNull();
  });

  it('renomme le sous-indicateur à la validation du nouveau nom', () => {
    const { renameSousIndicateur } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { canMutateIndicateur: true }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurSousIndicateurRenommer({ label: 'Papier' }),
      })
    );
    const input = screen.getByRole('textbox', {
      name: appLabels.indicateurSousIndicateurNom,
    });
    fireEvent.change(input, { target: { value: '  Carton  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(renameSousIndicateur).toHaveBeenCalledWith({
      indicateurId: 6,
      titre: 'Carton',
    });
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it("ne renomme rien quand l'édition est annulée, vide ou inchangée", () => {
    const { renameSousIndicateur } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { canMutateIndicateur: true }
    );
    const rename = (value: string, key: string) => {
      fireEvent.click(
        screen.getByRole('button', {
          name: appLabels.indicateurSousIndicateurRenommer({ label: 'Papier' }),
        })
      );
      const input = screen.getByRole('textbox', {
        name: appLabels.indicateurSousIndicateurNom,
      });
      fireEvent.change(input, { target: { value } });
      fireEvent.keyDown(input, { key });
    };

    rename('Carton', 'Escape');
    rename('   ', 'Enter');
    rename('Papier', 'Enter');

    expect(renameSousIndicateur).not.toHaveBeenCalled();
  });

  it('ouvre le champ du nom au clic sur le nom lui-même, sans passer par un crayon', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: true,
    });

    fireEvent.click(screen.getByRole('button', { name: /Renommer Papier/ }));

    expect(
      screen.getByRole('textbox', {
        name: appLabels.indicateurSousIndicateurNom,
      })
    ).toBeDefined();
  });

  it('garde un lien vers la page du sous-indicateur quand son nom est éditable', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: true,
    });

    expect(
      screen
        .getByRole('link', {
          name: appLabels.indicateurSousIndicateurOuvrir({ label: 'Papier' }),
        })
        .getAttribute('href')
    ).toBe(
      makeCollectiviteIndicateursUrl({
        collectiviteId: COLLECTIVITE_ID,
        indicateurView: 'perso',
        indicateurId: 6,
      })
    );
  });

  it("ne propose pas de renommer sans le droit de modifier l'indicateur", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: false,
    });

    expect(
      screen.queryByRole('button', {
        name: appLabels.indicateurSousIndicateurRenommer({ label: 'Papier' }),
      })
    ).toBeNull();
  });

  it("ouvre directement le champ du nom du sous-indicateur qui vient d'être créé, et le signale terminé à la validation", () => {
    const { onNameEditingEnd } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { canMutateIndicateur: true, focusedIndicateurId: 6 }
    );

    const input = screen.getByRole('textbox', {
      name: appLabels.indicateurSousIndicateurNom,
    });
    expect(document.activeElement).toBe(input);
    expect((input as HTMLInputElement).value).toBe('Papier');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onNameEditingEnd).toHaveBeenCalledTimes(1);
  });

  it("ne passe pas en édition un sous-indicateur qui n'est pas le nouveau", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: true,
      focusedIndicateurId: null,
    });

    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it("tronque avec une ellipsis le nom d'un sous-indicateur trop long et le garde lisible en infobulle", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    const name = screen.getByText('Papier');

    expect(name.className).toContain('truncate');
    expect(name.getAttribute('title')).toBe('Papier');
  });

  it("tronque aussi le nom d'un sous-indicateur éditable", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: true,
    });

    const name = screen.getByRole('button', { name: /Renommer Papier/ });

    expect(name.className).toContain('truncate');
    expect(name.getAttribute('title')).toBe('Papier');
  });

  it("laisse la cellule de titre du total sans fond blanc propre pour qu'elle prenne le gris de sa ligne", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(
      screen.getByRole('rowheader', { name: TOTAL_ROW_NAME }).className
    ).not.toContain('bg-white');
  });

  it('signale un nom éditable au survol par un curseur de texte et un fond gris clair, sans le souligner', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: true,
    });

    const { className } = screen.getByRole('button', {
      name: /Renommer Papier/,
    });

    expect(className).toContain('cursor-text');
    expect(className).toContain('hover:bg-grey-3');
    expect(className).not.toContain('hover:underline');
  });

  it('donne le même fond gris clair au survol aux actions du titre de ligne : dissocier, ouvrir et déplier', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: true,
    });

    const actions = [
      screen.getByRole('button', {
        name: appLabels.indicateurSousIndicateurDissocier({
          label: 'Ménagers',
        }),
      }),
      screen.getByRole('link', {
        name: appLabels.indicateurSousIndicateurOuvrir({ label: 'Ménagers' }),
      }),
      screen.getByRole('button', {
        name: appLabels.indicateurSousIndicateurDeplier({ label: 'Ménagers' }),
      }),
    ];

    expect(
      actions.map((action) => action.className.includes('hover:bg-grey-3'))
    ).toEqual([true, true, true]);
  });

  it("laisse le nom de chaque sous-indicateur occuper toute la largeur disponible avant d'être tronqué, au lieu de dépendre de son contenu", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    const nameColumn = screen.getByText('Papier').parentElement;

    expect(nameColumn?.className).toContain('flex-1');
    expect(nameColumn?.className).toContain('min-w-0');
    expect(nameColumn?.parentElement?.className).toContain('flex-1');
  });

  it('garde, comme le tableau de la page détail, un filet à droite et en bas de chaque titre de ligne', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    const titles = [
      screen.getByRole('rowheader', { name: TOTAL_ROW_NAME }),
      getRowOf(/^Papier/).querySelector('th') as HTMLElement,
    ];

    expect(
      titles.map(({ className }) => [
        className.includes('border-r'),
        className.includes('border-b'),
        className.includes('border-primary-4'),
      ])
    ).toEqual([
      [true, true, true],
      [true, true, true],
    ]);
  });

  it('grise la ligne du total sans griser les lignes de sous-indicateurs', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }));

    expect(getRowOf(TOTAL_ROW_NAME).className).toContain('bg-grey-2');
    expect(getRowOf(/^Papier/).className).not.toContain('bg-grey-2');
  });

  it('aligne sur une même ligne le bouton de création, le cumul et le résultat récent privé', () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: true,
    });

    const bar = screen.getByRole('button', {
      name: appLabels.indicateurCreerSousIndicateur,
    }).parentElement as HTMLElement;

    expect(
      [
        appLabels.indicateurCumulSousIndicateurs,
        appLabels.indicateurResultatRecentModePrive,
      ].map((name) => bar.contains(screen.getByRole('checkbox', { name })))
    ).toEqual([true, true]);
    expect(bar.className).toContain('flex');
  });

  it("sépare le bouton de création des interrupteurs par un séparateur ignoré des lecteurs d'écran", () => {
    renderReadyTable(toData({ totalCells: COMPLETE_TOTAL_CELLS }), {
      canMutateIndicateur: true,
    });

    const bar = screen.getByRole('button', {
      name: appLabels.indicateurCreerSousIndicateur,
    }).parentElement as HTMLElement;

    expect(bar.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(1);
  });

  it('active et désactive le résultat récent en mode privé selon son état', () => {
    const { onPrivateModeChange } = renderReadyTable(
      toData({ totalCells: COMPLETE_TOTAL_CELLS }),
      { canMutateIndicateur: true, isConfidentiel: true }
    );

    const toggle = screen.getByRole('checkbox', {
      name: appLabels.indicateurResultatRecentModePrive,
    }) as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);

    expect(onPrivateModeChange).toHaveBeenCalledWith(false);
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
          .getByRole('link', {
            name: appLabels.indicateurSousIndicateurOuvrir({ label }),
          })
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

  it('nomme les sous-indicateurs manquants quand le total est incomplet', () => {
    renderReadyTable(
      toData({
        totalCells: [
          {
            resultat: {
              status: 'incomplete',
              filledCount: 1,
              expectedCount: 3,
              missingLabels: ['Gaz', 'Eau'],
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
    expect(
      within(incompleteCell).getByText('Résultat manquant : Gaz, Eau')
    ).toBeDefined();
    expect(within(incompleteCell).queryByText(/^\d+$/)).toBeNull();
  });

  it("signale un total incomplet par une icône d'information, pas par un avertissement", () => {
    renderReadyTable(
      toData({
        totalCells: [
          {
            resultat: {
              status: 'incomplete',
              filledCount: 1,
              expectedCount: 3,
              missingLabels: ['Gaz', 'Eau'],
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
    const marker = within(incompleteCell).getByText(
      'Résultat manquant : Gaz, Eau'
    ).parentElement;
    expect(marker?.innerHTML).toContain('text-info-1');
    expect(marker?.innerHTML).not.toContain('text-warning-1');
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
