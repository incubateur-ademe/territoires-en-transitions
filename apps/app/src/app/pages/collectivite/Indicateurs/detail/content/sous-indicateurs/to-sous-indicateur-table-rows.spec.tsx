import type { SaveSousIndicateurValeur } from '@/app/indicateurs/sous-indicateurs/data/use-save-sous-indicateur-valeur';
import type {
  SousIndicateurRowCell,
  SousIndicateursTableData,
} from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
} from '@tet/domain/indicateurs';
import { render, screen } from '@testing-library/react';
import type { PeriodeTableRow } from '@/app/indicateurs/valeurs/periodes-table/periodes-table.types';
import { appLabels } from '@/app/labels/catalog';
import { describe, expect, it, vi } from 'vitest';
import {
  hasValeursOnPeriode,
  toSousIndicateurTable,
} from './to-sous-indicateur-table-rows';

const EMPTY = { status: 'empty' } as const;

const toRowCell = ({
  dateValeur,
  resultat,
}: {
  dateValeur: string;
  resultat: number | null;
}): SousIndicateurRowCell => ({
  dateValeur,
  resultat: resultat === null ? EMPTY : { status: 'value', valeur: resultat },
  objectif: EMPTY,
});

const toData = (cells: SousIndicateurRowCell[]): SousIndicateursTableData => ({
  columns: cells.map(({ dateValeur }) => ({ dateValeur })),
  totalCells: [],
  rows: [
    {
      rowKey: '1',
      parentRowKey: null,
      isExpandable: false,
      indicateurId: 1,
      label: 'Verre',
      color: 'x',
      depth: 0,
      cells,
    },
  ],
});

describe('hasValeursOnPeriode', () => {
  it('détecte une valeur datée en milieu de période annuelle même si la première date de la période est vide', () => {
    const data = toData([
      toRowCell({ dateValeur: '2022-01-01', resultat: null }),
      toRowCell({ dateValeur: '2022-06-30', resultat: 7 }),
    ]);

    expect(
      hasValeursOnPeriode({
        data,
        periode: IndicateurPeriodes.fromYear(2022),
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      })
    ).toBe(true);
  });

  describe('ligne qui a des enfants', () => {
    const cells = [toRowCell({ dateValeur: '2022-01-01', resultat: 7 })];
    const data: SousIndicateursTableData = {
      ...toData(cells),
      rows: toData(cells).rows.map((row) => ({ ...row, isExpandable: true })),
    };
    const periode = IndicateurPeriodes.fromYear(2022);

    it('ignore sa valeur par défaut, puisqu’elle est un total calculé', () => {
      expect(
        hasValeursOnPeriode({
          data,
          periode,
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        })
      ).toBe(false);
    });

    it('compte sa valeur quand elle est une valeur propre', () => {
      expect(
        hasValeursOnPeriode({
          data,
          periode,
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          withOwnValeursOnParentRows: true,
        })
      ).toBe(true);
    });
  });
});

describe('toSousIndicateurTable', () => {
  it("enregistre la saisie à la date de la valeur existante de la période plutôt qu'à son premier jour", async () => {
    const saveValeur = vi.fn().mockResolvedValue(true);
    const data = toData([
      toRowCell({ dateValeur: '2022-01-01', resultat: null }),
      toRowCell({ dateValeur: '2022-06-30', resultat: 7 }),
    ]);

    const { rows } = toSousIndicateurTable({
      data,
      hasTotalRow: false,
      visibleRows: data.rows,
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      collectiviteId: 1,
      isReadonly: false,
      saveValeur,
      requestDetachSousIndicateur: undefined,
      renameSousIndicateur: undefined,
      focusedNameIndicateurId: null,
      onNameEditingEnd: vi.fn(),
      isExpanded: () => false,
      onToggle: vi.fn(),
    });
    await rows[0].onSave(IndicateurPeriodes.fromYear(2022), 'resultat', 9);

    expect(saveValeur).toHaveBeenCalledWith(
      expect.objectContaining({ indicateurId: 1, dateValeur: '2022-06-30' })
    );
  });
});

describe('toSousIndicateurTable : lignes supplémentaires', () => {
  const extraRow: PeriodeTableRow = {
    key: 'extra',
    title: 'Résultats INSEE',
    cellOf: () => ({ kind: 'contenu', content: null, isBold: false }),
    onSave: () => Promise.resolve(false),
  };
  const data = toData([toRowCell({ dateValeur: '2022-01-01', resultat: 7 })]);

  const toRows = ({
    isExpanded,
    extraRows = () => [extraRow],
  }: {
    isExpanded: boolean;
    extraRows?: () => PeriodeTableRow[];
  }) =>
    toSousIndicateurTable({
      data,
      hasTotalRow: false,
      visibleRows: data.rows,
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      collectiviteId: 1,
      isReadonly: false,
      saveValeur: vi.fn(),
      requestDetachSousIndicateur: undefined,
      renameSousIndicateur: undefined,
      focusedNameIndicateurId: null,
      onNameEditingEnd: vi.fn(),
      isExpanded: () => isExpanded,
      onToggle: vi.fn(),
      extraRows,
    }).rows;

  it('cache les lignes supplémentaires tant que le sous-indicateur est replié', () => {
    expect(toRows({ isExpanded: false }).map(({ key }) => key)).toEqual(['1']);
  });

  it('affiche les lignes supplémentaires juste après le sous-indicateur déplié', () => {
    expect(toRows({ isExpanded: true }).map(({ key }) => key)).toEqual([
      '1',
      'extra',
    ]);
  });

  it('propose le chevron de dépliage à une feuille qui a des lignes supplémentaires', () => {
    render(
      <table>
        <tbody>
          <tr>{toRows({ isExpanded: false })[0].title}</tr>
        </tbody>
      </table>
    );

    expect(
      screen.getByRole('button', {
        name: appLabels.indicateurSousIndicateurDeplier({ label: 'Verre' }),
      })
    ).toBeDefined();
  });

  it('ne propose pas de chevron à une feuille sans ligne supplémentaire', () => {
    render(
      <table>
        <tbody>
          <tr>{toRows({ isExpanded: false, extraRows: () => [] })[0].title}</tr>
        </tbody>
      </table>
    );

    expect(
      screen.queryByRole('button', {
        name: appLabels.indicateurSousIndicateurDeplier({ label: 'Verre' }),
      })
    ).toBeNull();
  });
});

describe('toSousIndicateurTable : valeurs propres d’une ligne qui a des enfants', () => {
  const periode = IndicateurPeriodes.fromYear(2022);
  const toParentData = (
    acceptsOwnValeurs: boolean
  ): SousIndicateursTableData => {
    const base = toData([toRowCell({ dateValeur: '2022-01-01', resultat: 7 })]);
    return {
      ...base,
      rows: base.rows.map((row) => ({
        ...row,
        isExpandable: true,
        acceptsOwnValeurs,
      })),
    };
  };

  const toParentRow = ({
    data,
    parentValeursAreComputed,
    saveValeur = vi.fn().mockResolvedValue(true),
  }: {
    data: SousIndicateursTableData;
    parentValeursAreComputed?: boolean;
    saveValeur?: SaveSousIndicateurValeur;
  }) =>
    toSousIndicateurTable({
      data,
      hasTotalRow: false,
      visibleRows: data.rows,
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      collectiviteId: 1,
      isReadonly: false,
      saveValeur,
      requestDetachSousIndicateur: undefined,
      renameSousIndicateur: undefined,
      focusedNameIndicateurId: null,
      onNameEditingEnd: vi.fn(),
      isExpanded: () => false,
      onToggle: vi.fn(),
      parentValeursAreComputed,
    }).rows[0];

  it('garde une ligne qui a des enfants en lecture seule par défaut, comme un total calculé', () => {
    const row = toParentRow({ data: toParentData(true) });

    expect(row.cellOf(periode).kind).toBe('contenu');
  });

  it("permet de saisir les valeurs propres d'une ligne qui a des enfants quand son indicateur en accepte", async () => {
    const saveValeur = vi.fn().mockResolvedValue(true);
    const row = toParentRow({
      data: toParentData(true),
      parentValeursAreComputed: false,
      saveValeur,
    });

    expect(row.cellOf(periode)).toMatchObject({
      kind: 'valeurs',
      isReadonly: false,
    });
    await row.onSave(periode, 'resultat', 9);
    expect(saveValeur).toHaveBeenCalledWith(
      expect.objectContaining({ indicateurId: 1, field: 'resultat', value: 9 })
    );
  });

  it('garde en lecture seule une ligne qui regroupe sans accepter de valeur, même quand les valeurs des parents ne sont pas calculées', () => {
    const row = toParentRow({
      data: toParentData(false),
      parentValeursAreComputed: false,
    });

    expect(row.cellOf(periode).kind).toBe('contenu');
  });
});
