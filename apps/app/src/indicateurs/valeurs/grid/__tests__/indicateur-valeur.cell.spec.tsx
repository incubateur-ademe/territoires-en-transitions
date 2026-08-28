import { appLabels } from '@/app/labels/catalog';
import { CellContext } from '@tanstack/react-table';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IndicateurValeur } from '@tet/domain/indicateurs';
import { capitalize } from '@tet/ui/labels/plural';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurValeurCell } from '../indicateur-valeur.cell';
import { IndicateurTableRow } from '../types';
import { IndicateurValeursTableMeta } from '../utils';
import { fakeRow } from './grid-fixtures';

const indicateurId = 12;
const year = 2026;

const buildValeur = ({
  resultat,
  objectif,
}: {
  resultat: number | null;
  objectif: number | null;
}): IndicateurValeur => ({
  id: 1,
  collectiviteId: 1,
  indicateurId,
  dateValeur: `${year}-01-01`,
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
  updateIndicateurValeurs = vi.fn().mockResolvedValue(true),
}: {
  resultat: number | null;
  objectif: number | null;
  updateIndicateurValeurs?: IndicateurValeursTableMeta['updateIndicateurValeurs'];
}): {
  cell: CellContext<IndicateurTableRow, unknown>;
  updateIndicateurValeurs: IndicateurValeursTableMeta['updateIndicateurValeurs'];
} => {
  const row = fakeRow({
    indicateurId,
    indicateurLabel: 'Résidentiel',
    indicateurValeurs: [buildValeur({ resultat, objectif })],
  });

  const meta: IndicateurValeursTableMeta = {
    onReferenceYearChange: vi.fn(),
    updateIndicateurValeurs,
  };

  const cell = {
    row: { original: row },
    table: { options: { meta } },
  } as unknown as CellContext<IndicateurTableRow, unknown>;

  return { cell, updateIndicateurValeurs };
};

const renderCell = ({
  indicateurValeurType,
  resultat,
  objectif,
  updateIndicateurValeurs,
}: {
  indicateurValeurType: 'resultat' | 'objectif';
  resultat: number | null;
  objectif: number | null;
  isRequired?: boolean;
  updateIndicateurValeurs?: IndicateurValeursTableMeta['updateIndicateurValeurs'];
}) => {
  const { cell, updateIndicateurValeurs: persist } = buildCellContext({
    resultat,
    objectif,
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
              year={year}
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
        year,
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
