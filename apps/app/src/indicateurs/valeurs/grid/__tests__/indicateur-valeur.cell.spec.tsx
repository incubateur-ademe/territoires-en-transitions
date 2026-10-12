import { appLabels } from '@/app/labels/catalog';
import { CellContext } from '@tanstack/react-table';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  IndicateurPeriod,
  IndicateurPeriodiciteEnum,
  IndicateurPeriods,
  IndicateurValeur,
} from '@tet/domain/indicateurs';
import { capitalize } from '@tet/ui/labels/plural';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurValeurCell } from '../indicateur-valeur.cell';
import { IndicateurTableRow } from '../types';
import {
  IndicateurValeursTableFeatures,
  IndicateurValeursTableMeta,
} from '../utils';
import { fakeRow } from './grid-fixtures';

const indicateurId = 12;
const year = 2026;
const annualPeriod = IndicateurPeriods.parse(
  IndicateurPeriodiciteEnum.ANNUELLE,
  String(year)
);

const buildValeur = ({
  resultat,
  objectif,
  dateValeur,
}: {
  resultat: number | null;
  objectif: number | null;
  dateValeur?: string;
}): IndicateurValeur => ({
  id: 1,
  collectiviteId: 1,
  indicateurId,
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
  dateValeur: dateValeur ?? `${year}-01-01`,
  metadonneeId: null,
  resultat,
  resultatCommentaire: null,
  objectif,
  objectifCommentaire: null,
  estimation: null,
  calculAuto: null,
  calculAutoIdentifiantsManquants: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  modifiedAt: '2024-01-01T00:00:00.000Z',
  createdBy: null,
  modifiedBy: null,
});

const buildCellContext = ({
  resultat,
  objectif,
  dateValeur,
  updateIndicateurValeurs = vi.fn().mockResolvedValue(true),
}: {
  resultat: number | null;
  objectif: number | null;
  dateValeur?: string;
  updateIndicateurValeurs?: IndicateurValeursTableMeta['updateIndicateurValeurs'];
}): {
  cell: CellContext<
    IndicateurValeursTableFeatures,
    IndicateurTableRow,
    unknown
  >;
  updateIndicateurValeurs: IndicateurValeursTableMeta['updateIndicateurValeurs'];
} => {
  const row = fakeRow({
    indicateurId,
    indicateurLabel: 'Résidentiel',
    indicateurValeurs: [buildValeur({ resultat, objectif, dateValeur })],
  });

  const meta: IndicateurValeursTableMeta = {
    onReferenceYearChange: vi.fn(),
    updateIndicateurValeurs,
    setIndicateurApplicable: vi.fn().mockResolvedValue(true),
  };

  const cell = {
    row: { original: row },
    table: { options: { meta } },
  } as unknown as CellContext<
    IndicateurValeursTableFeatures,
    IndicateurTableRow,
    unknown
  >;

  return { cell, updateIndicateurValeurs };
};

const renderCell = ({
  indicateurValeurType,
  resultat,
  objectif,
  dateValeur,
  period = annualPeriod,
  updateIndicateurValeurs,
}: {
  indicateurValeurType: 'resultat' | 'objectif';
  resultat: number | null;
  objectif: number | null;
  dateValeur?: string;
  isRequired?: boolean;
  period?: IndicateurPeriod | null;
  updateIndicateurValeurs?: IndicateurValeursTableMeta['updateIndicateurValeurs'];
}) => {
  const { cell, updateIndicateurValeurs: persist } = buildCellContext({
    resultat,
    objectif,
    dateValeur,
    updateIndicateurValeurs,
  });

  return {
    updateIndicateurValeurs: persist,
    ...render(
      <table>
        <tbody>
          <tr>
            <IndicateurValeurCell
              cell={cell}
              indicateurValeurType={indicateurValeurType}
              period={period}
            />
          </tr>
        </tbody>
      </table>
    ),
  };
};

const editAndCommit = (displayedValue: string, nextValue: string): void => {
  fireEvent.click(screen.getByText(displayedValue));
  const input = screen.getByLabelText(
    capitalize(appLabels.indicateurResultat())
  );
  fireEvent.change(input, { target: { value: nextValue } });
  fireEvent.keyDown(input, { key: 'Enter' });
};

describe('IndicateurValeurCell', () => {
  it('affiche la valeur résultat', () => {
    renderCell({
      indicateurValeurType: 'resultat',
      resultat: 10,
      objectif: 20,
    });

    expect(screen.getByText('10')).toBeDefined();
    expect(document.querySelector('[data-field="resultat"]')).not.toBeNull();
  });

  it.each(['2026-06-15', '2026-12-31'])(
    'affiche une valeur annuelle historique datée du %s',
    (dateValeur) => {
      renderCell({
        indicateurValeurType: 'resultat',
        resultat: 10,
        objectif: null,
        dateValeur,
      });
      expect(screen.getByText('10')).toBeDefined();
    }
  );

  it("ne reprend pas une valeur d'une autre période", () => {
    renderCell({
      indicateurValeurType: 'resultat',
      resultat: 10,
      objectif: null,
      dateValeur: '2025-12-31',
    });
    expect(screen.queryByText('10')).toBeNull();
  });

  it("n'ouvre pas d'éditeur tant que la période de référence est absente", () => {
    const { updateIndicateurValeurs } = renderCell({
      indicateurValeurType: 'resultat',
      resultat: 10,
      objectif: null,
      period: null,
    });
    fireEvent.click(screen.getByRole('cell'));
    expect(
      screen.queryByLabelText(capitalize(appLabels.indicateurResultat()))
    ).toBeNull();
    expect(updateIndicateurValeurs).not.toHaveBeenCalled();
  });

  it('affiche la valeur objectif', () => {
    renderCell({
      indicateurValeurType: 'objectif',
      resultat: 10,
      objectif: 20,
    });

    expect(screen.getByText('20')).toBeDefined();
    expect(document.querySelector('[data-field="objectif"]')).not.toBeNull();
  });

  it('marque d’un astérisque une cellule requise encore vide', () => {
    renderCell({
      indicateurValeurType: 'objectif',
      resultat: null,
      objectif: null,
      isRequired: true,
    });

    expect(screen.getByTitle(appLabels.indicateurValeurRequise)).toBeDefined();
  });

  it('enregistre la valeur via updateIndicateurValeurs à la fermeture de l’éditeur', async () => {
    const { updateIndicateurValeurs } = renderCell({
      indicateurValeurType: 'resultat',
      resultat: 10,
      objectif: 20,
    });

    editAndCommit('10', '42');

    await waitFor(() =>
      expect(updateIndicateurValeurs).toHaveBeenCalledWith({
        indicateurId,
        period: annualPeriod,
        field: 'resultat',
        value: 42,
      })
    );
  });

  it('n’enregistre pas quand l’édition est annulée', async () => {
    const { updateIndicateurValeurs } = renderCell({
      indicateurValeurType: 'resultat',
      resultat: 10,
      objectif: 20,
    });

    fireEvent.click(screen.getByText('10'));
    const input = screen.getByLabelText(
      capitalize(appLabels.indicateurResultat())
    );
    fireEvent.change(input, { target: { value: '42' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() =>
      expect(
        screen.queryByLabelText(capitalize(appLabels.indicateurResultat()))
      ).toBeNull()
    );
    expect(updateIndicateurValeurs).not.toHaveBeenCalled();
  });
});
