import type {
  SousIndicateurRowCell,
  SousIndicateursTableData,
} from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
} from '@tet/domain/indicateurs';
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
