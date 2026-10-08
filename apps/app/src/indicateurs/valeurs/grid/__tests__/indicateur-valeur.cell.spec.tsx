import { appLabels } from '@/app/labels/catalog';
import { CellContext } from '@tanstack/react-table';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  IndicateurPeriodiciteEnum,
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
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
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
  isRequired = true,
  isApplicable = true,
  updateIndicateurValeurs = vi.fn().mockResolvedValue(true),
}: {
  resultat: number | null;
  objectif: number | null;
  isRequired?: boolean;
  isApplicable?: boolean;
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
    indicateurValeurs: [buildValeur({ resultat, objectif })],
    optionalYears: isRequired ? undefined : [year],
    isApplicable,
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
  isRequired,
  isApplicable,
  updateIndicateurValeurs,
}: {
  indicateurValeurType: 'resultat' | 'objectif';
  resultat: number | null;
  objectif: number | null;
  isRequired?: boolean;
  isApplicable?: boolean;
  updateIndicateurValeurs?: IndicateurValeursTableMeta['updateIndicateurValeurs'];
}) => {
  const { cell, updateIndicateurValeurs: persist } = buildCellContext({
    resultat,
    objectif,
    isRequired,
    isApplicable,
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

  it('conserve le format numérique français limité à trois décimales', async () => {
    const { updateIndicateurValeurs } = renderCell({
      indicateurValeurType: 'resultat',
      resultat: 10,
      objectif: null,
    });

    fireEvent.click(screen.getByText('10'));
    const input = screen.getByRole('textbox', { name: 'Résultat' });
    expect(input.getAttribute('aria-required')).toBe('true');
    fireEvent.change(input, { target: { value: '1234,5678' } });
    expect((input as HTMLInputElement).value).toBe('1 234,567');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(updateIndicateurValeurs).toHaveBeenCalledWith({
        indicateurId,
        year,
        field: 'resultat',
        value: 1234.567,
      })
    );
  });

  it.each([
    { text: '0', value: 0 },
    { text: '', value: null },
  ])('enregistre $value après saisie de "$text"', async ({ text, value }) => {
    const { updateIndicateurValeurs } = renderCell({
      indicateurValeurType: 'resultat',
      resultat: 10,
      objectif: null,
    });

    editAndCommit('10', text);

    await waitFor(() =>
      expect(updateIndicateurValeurs).toHaveBeenCalledWith({
        indicateurId,
        year,
        field: 'resultat',
        value,
      })
    );
  });

  it('ferme avant la réponse serveur et permet de reprendre le brouillon après un échec', async () => {
    let resolve: (saved: boolean) => void = () => undefined;
    const promise = new Promise<boolean>((resolveSave) => {
      resolve = resolveSave;
    });
    const persist = vi.fn(() => promise);
    renderCell({
      indicateurValeurType: 'resultat',
      resultat: 10,
      objectif: null,
      updateIndicateurValeurs: persist,
    });

    editAndCommit('10', '42');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(persist).toHaveBeenCalledOnce();
    await act(async () => resolve(false));

    expect(screen.getByRole('cell').getAttribute('aria-invalid')).toBe('true');
    fireEvent.click(screen.getByText('42'));
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('42');
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(screen.getByText('10')).toBeDefined();
    expect(persist).toHaveBeenCalledOnce();
  });

  it('laisse une valeur optionnelle vide sans marqueur requis', () => {
    renderCell({
      indicateurValeurType: 'objectif',
      resultat: null,
      objectif: null,
      isRequired: false,
    });

    expect(screen.queryByTitle(appLabels.indicateurValeurRequise)).toBeNull();
    fireEvent.click(screen.getByRole('cell'));
    expect(screen.getByRole('textbox').getAttribute('aria-required')).toBe(
      'false'
    );
  });

  it('désactive la saisie et le marqueur requis pour un indicateur non applicable', () => {
    const { updateIndicateurValeurs } = renderCell({
      indicateurValeurType: 'objectif',
      resultat: null,
      objectif: null,
      isApplicable: false,
    });

    fireEvent.click(
      screen.getByText(appLabels.pcaetDiagnosticValeurNonApplicable)
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByTitle(appLabels.indicateurValeurRequise)).toBeNull();
    expect(updateIndicateurValeurs).not.toHaveBeenCalled();
  });
});
