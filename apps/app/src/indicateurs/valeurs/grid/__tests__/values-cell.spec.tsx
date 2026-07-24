import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridCellServicesProvider } from '../grid-context';
import { GridCell, toIndicateurId, toYear } from '../types';
import { ValuesCell } from '../values-cell';

const currentYear = 2026;
const rowLabel = 'NOx';
const resultatLabel = 'Résultat';
const objectifLabel = 'Objectif';

const celluleChamp = (year: number, fieldLabel: string): string =>
  `${rowLabel}, ${year} — ${fieldLabel}`;

const renderValuesCell = ({
  cell,
  year,
  saveCellValue = vi.fn().mockResolvedValue({ ok: true, value: undefined }),
}: {
  cell: GridCell;
  year: number;
  saveCellValue?: ReturnType<typeof vi.fn>;
}): ReturnType<typeof render> =>
  render(
    <GridCellServicesProvider
      services={{
        saveCellValue,
        unit: 't',
        notify: vi.fn(),
      }}
    >
      <ValuesCell
        cell={cell}
        groupLabel="Résidentiel"
        rowLabel="NOx"
        indicateurId={toIndicateurId(12)}
        year={toYear(year)}
        currentYear={currentYear}
        variationToReferenceYear={null}
      />
    </GridCellServicesProvider>
  );

describe('ValuesCell', () => {
  it('affiche les deux valeurs avec des noms accessibles', () => {
    renderValuesCell({
      cell: { resultat: 10, objectif: 20 },
      year: currentYear,
    });

    expect(
      screen.getByRole('button', {
        name: celluleChamp(currentYear, resultatLabel),
      }).textContent
    ).toContain('10');
    expect(
      screen.getByRole('button', {
        name: celluleChamp(currentYear, objectifLabel),
      }).textContent
    ).toContain('20');
  });

  it('enregistre le champ objectif via saveCellValue au blur', async () => {
    const saveCellValue = vi.fn().mockResolvedValue({ ok: true, value: undefined });
    renderValuesCell({
      cell: { resultat: 10, objectif: 20 },
      year: currentYear,
      saveCellValue,
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: celluleChamp(currentYear, objectifLabel),
      })
    );

    const input = screen.getByRole('textbox', {
      name: celluleChamp(currentYear, objectifLabel),
    });
    fireEvent.change(input, { target: { value: '25' } });
    fireEvent.blur(input);

    await waitFor(() =>
      expect(saveCellValue).toHaveBeenCalledWith({
        indicateurId: 12,
        year: currentYear,
        field: 'objectif',
        value: 25,
      })
    );
  });

  it('affiche les boutons d ajout sur une année passée vide', () => {
    renderValuesCell({
      cell: { resultat: null, objectif: null },
      year: currentYear - 1,
    });

    expect(
      screen.getByRole('button', { name: '+ Résultat' })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: '+ Objectif' })
    ).toBeDefined();
  });

  it("n'affiche pas + Résultat sur une année future", () => {
    renderValuesCell({
      cell: { resultat: null, objectif: null },
      year: currentYear + 1,
    });

    expect(screen.queryByRole('button', { name: '+ Résultat' })).toBeNull();
    expect(screen.getByRole('button', { name: '+ Objectif' })).toBeDefined();
  });

  it('place data-cell-id on objectif when future year has read-only resultat', () => {
    const futureYear = 2030;
    renderValuesCell({
      cell: { resultat: 10, objectif: null },
      year: futureYear,
    });

    const objectifButton = screen.getByRole('button', { name: '+ Objectif' });
    expect(objectifButton.getAttribute('data-cell-id')).toBe('12:2030');

    const resultatReadOnly = screen.getByLabelText(
      celluleChamp(futureYear, resultatLabel)
    );
    expect(resultatReadOnly.getAttribute('data-cell-id')).toBeNull();
  });

  it('garde un seul data-cell-id pendant l édition de l objectif', () => {
    const { container } = renderValuesCell({
      cell: { resultat: 10, objectif: 20 },
      year: currentYear,
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: celluleChamp(currentYear, objectifLabel),
      })
    );

    const withId = container.querySelectorAll('[data-cell-id="12:2026"]');
    expect(withId).toHaveLength(1);
    expect(withId[0]?.getAttribute('aria-label')).toBe(
      celluleChamp(currentYear, objectifLabel)
    );
  });
});
