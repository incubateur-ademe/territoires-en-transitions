import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridCellServicesProvider } from '../grid-context';
import { UserDataCell } from '../user-data-cell';
import {
  GridCell,
  OpenDataSource,
  toIndicateurId,
  toSourceId,
  toYear,
} from '../types';

const typeAndCommit = (input: HTMLElement, raw: string): void => {
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: raw } });
  fireEvent.keyDown(input, { key: 'Enter' });
};

const emptyUserCell: Extract<GridCell, { kind: 'user-data' }> = {
  kind: 'user-data',
  value: null,
  coveringSources: [],
};

const filledUserCell: Extract<GridCell, { kind: 'user-data' }> = {
  kind: 'user-data',
  value: 12,
  coveringSources: [],
};

const renderCell = (
  cell: Extract<GridCell, { kind: 'user-data' }>,
  saveCellValue: ReturnType<typeof vi.fn>
): HTMLInputElement => {
  render(
    <GridCellServicesProvider
      services={{
        saveCellValue,
        selectOpenData: vi.fn(),
        clearCell: vi.fn(),
        unit: 't',
        notify: vi.fn(),
      }}
    >
      <UserDataCell
        cell={cell}
        groupLabel="Résidentiel"
        rowLabel="NOx"
        indicateurId={toIndicateurId(12)}
        year={toYear(2030)}
        variationToReferenceYear={null}
      />
    </GridCellServicesProvider>
  );
  return screen.getByRole('textbox') as HTMLInputElement;
};

const renderEmptyCell = (
  saveCellValue: ReturnType<typeof vi.fn>
): HTMLInputElement => renderCell(emptyUserCell, saveCellValue);

const coveringSources: OpenDataSource[] = [
  {
    sourceId: toSourceId('citepa'),
    libelle: 'CITEPA',
    value: 42,
    methodologie: null,
    dateVersion: '2026-01-01',
  },
];

const openDataDotName = 'Valeur open data disponible';

describe('UserDataCell edition', () => {
  it('commit la valeur saisie via saveCellValue a la validation', async () => {
    const saveCellValue = vi.fn().mockResolvedValue({ ok: true, value: undefined });
    const input = renderEmptyCell(saveCellValue);

    typeAndCommit(input, '42');

    await waitFor(() =>
      expect(saveCellValue).toHaveBeenCalledWith({
        indicateurId: 12,
        year: 2030,
        value: 42,
      })
    );
    await screen.findByText('Enregistré');
  });

  it('filtre les caracteres non numeriques a la saisie', () => {
    const input = renderEmptyCell(
      vi.fn().mockResolvedValue({ ok: true, value: undefined })
    );

    fireEvent.change(input, { target: { value: '1a2b' } });

    expect(input.value).toBe('12');
  });

  it('conserve la saisie et signale une erreur quand le write echoue', async () => {
    const saveCellValue = vi.fn().mockResolvedValue({ ok: false });
    const input = renderEmptyCell(saveCellValue);

    typeAndCommit(input, '7');

    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(input.value).toBe('7');
    expect(screen.queryByText('Enregistré')).toBe(null);
  });

  it('reste editable et signale une erreur si le write rejette', async () => {
    const saveCellValue = vi.fn().mockRejectedValue(new Error('network'));
    const input = renderEmptyCell(saveCellValue);

    typeAndCommit(input, '42');
    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));

    typeAndCommit(input, '43');
    await waitFor(() => expect(saveCellValue).toHaveBeenCalledTimes(2));
  });

  it('signale une erreur sans ecrire quand la saisie est invalide', async () => {
    const saveCellValue = vi.fn().mockResolvedValue({ ok: true, value: undefined });
    const input = renderCell(filledUserCell, saveCellValue);

    typeAndCommit(input, '1..2');

    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(saveCellValue).not.toHaveBeenCalled();
  });

  it('associe la variation signee comme description accessible de la cellule editable', () => {
    render(
      <GridCellServicesProvider
        services={{
          saveCellValue: vi.fn(),
          selectOpenData: vi.fn(),
          clearCell: vi.fn(),
          unit: 't',
          notify: vi.fn(),
        }}
      >
        <UserDataCell
          cell={filledUserCell}
          groupLabel="Résidentiel"
          rowLabel="NOx"
          indicateurId={toIndicateurId(12)}
          year={toYear(2050)}
          variationToReferenceYear={-0.6}
        />
      </GridCellServicesProvider>
    );

    const description = screen.getByText(
      /-60\s*% par rapport à l'année de référence/
    );
    expect(screen.getByRole('textbox').getAttribute('aria-describedby')).toBe(
      description.id
    );
  });

  it("ne commit pas quand la valeur n'a pas change", () => {
    const saveCellValue = vi.fn();
    const input = renderCell(filledUserCell, saveCellValue);

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(saveCellValue).not.toHaveBeenCalled();
  });
});

describe('UserDataCell dot open-data', () => {
  it('affiche le dot quand une valeur user est saisie et que de l open data est disponible', () => {
    renderCell({ ...filledUserCell, coveringSources }, vi.fn());

    expect(
      screen.getByRole('button', { name: openDataDotName })
    ).toBeDefined();
  });

  it('affiche le dot sur une cellule vide couverte', () => {
    renderCell({ ...emptyUserCell, coveringSources }, vi.fn());

    expect(
      screen.getByRole('button', { name: openDataDotName })
    ).toBeDefined();
  });

  it("n'affiche pas le dot quand aucune open data n'est disponible", () => {
    renderCell(filledUserCell, vi.fn());

    expect(screen.queryByRole('button', { name: openDataDotName })).toBe(null);
  });
});
