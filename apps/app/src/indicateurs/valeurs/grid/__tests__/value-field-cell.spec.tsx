import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridCellServicesProvider } from '../grid-context';
import { GridCell, toIndicateurId, toYear, ValeurField } from '../types';
import { ValueFieldCell } from '../value-field-cell';

const currentYear = 2026;
const rowLabel = 'NOx';
const resultatLabel = 'Résultat';
const objectifLabel = 'Objectif';

const celluleChamp = (year: number, fieldLabel: string): string =>
  `${rowLabel}, ${year} — ${fieldLabel}`;

const renderValueFieldCell = ({
  cell,
  year,
  field,
  saveCellValue = vi.fn().mockResolvedValue({ ok: true, value: undefined }),
}: {
  cell: GridCell;
  year: number;
  field: ValeurField;
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
      <ValueFieldCell
        field={field}
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

describe('ValueFieldCell', () => {
  it('affiche la valeur résultat avec un nom accessible', () => {
    renderValueFieldCell({
      cell: { resultat: 10, objectif: 20 },
      year: currentYear,
      field: 'resultat',
    });

    expect(
      screen.getByRole('button', {
        name: celluleChamp(currentYear, resultatLabel),
      }).textContent
    ).toContain('10');
  });

  it('affiche la valeur objectif avec un nom accessible', () => {
    renderValueFieldCell({
      cell: { resultat: 10, objectif: 20 },
      year: currentYear,
      field: 'objectif',
    });

    expect(
      screen.getByRole('button', {
        name: celluleChamp(currentYear, objectifLabel),
      }).textContent
    ).toContain('20');
  });

  it('enregistre le champ objectif via saveCellValue au blur', async () => {
    const saveCellValue = vi.fn().mockResolvedValue({ ok: true, value: undefined });
    renderValueFieldCell({
      cell: { resultat: 10, objectif: 20 },
      year: currentYear,
      field: 'objectif',
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
    expect(document.activeElement).toBe(input);

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

  it('affiche le bouton d ajout résultat sur une année passée vide', () => {
    renderValueFieldCell({
      cell: { resultat: null, objectif: null },
      year: currentYear - 1,
      field: 'resultat',
    });

    expect(screen.getByRole('button', { name: '+ Résultat' })).toBeDefined();
  });

  it('réserve un emplacement vide pour le résultat sur une année future', () => {
    const { container } = renderValueFieldCell({
      cell: { resultat: null, objectif: null },
      year: currentYear + 1,
      field: 'resultat',
    });

    expect(
      container.querySelector(
        '[data-test="indicateurs.grid.value-field-cell-resultat"]'
      )
    ).not.toBeNull();
    expect(screen.queryByRole('button', { name: '+ Résultat' })).toBeNull();
  });

  it("n'affiche pas + Résultat sur une année future", () => {
    renderValueFieldCell({
      cell: { resultat: null, objectif: null },
      year: currentYear + 1,
      field: 'resultat',
    });

    expect(screen.queryByRole('button', { name: '+ Résultat' })).toBeNull();
  });

  it('affiche + Objectif sur une année future', () => {
    renderValueFieldCell({
      cell: { resultat: null, objectif: null },
      year: currentYear + 1,
      field: 'objectif',
    });

    expect(screen.getByRole('button', { name: '+ Objectif' })).toBeDefined();
  });

  it('place data-cell-id sur objectif quand le résultat est en lecture seule', () => {
    const futureYear = 2030;
    const { container: objectifContainer } = renderValueFieldCell({
      cell: { resultat: 10, objectif: null },
      year: futureYear,
      field: 'objectif',
    });

    const objectifButton = screen.getByRole('button', { name: '+ Objectif' });
    expect(objectifButton.getAttribute('data-cell-id')).toBe('12:2030:objectif');

    const resultatReadOnly = objectifContainer
      .closest('body')
      ?.querySelector('[aria-label="' + celluleChamp(futureYear, resultatLabel) + '"]');
    expect(resultatReadOnly).toBeNull();

    const { container: resultatContainer } = renderValueFieldCell({
      cell: { resultat: 10, objectif: null },
      year: futureYear,
      field: 'resultat',
    });

    const resultatLabelElement = resultatContainer.querySelector(
      `[aria-label="${celluleChamp(futureYear, resultatLabel)}"]`
    );
    expect(resultatLabelElement?.getAttribute('data-cell-id')).toBeNull();
  });

  it('attribue un data-cell-id distinct à chaque champ', () => {
    const { container: resultatContainer } = renderValueFieldCell({
      cell: { resultat: 10, objectif: 20 },
      year: currentYear,
      field: 'resultat',
    });
    const { container: objectifContainer } = renderValueFieldCell({
      cell: { resultat: 10, objectif: 20 },
      year: currentYear,
      field: 'objectif',
    });

    expect(
      resultatContainer.querySelector('[data-cell-id="12:2026:resultat"]')
    ).not.toBeNull();
    expect(
      objectifContainer.querySelector('[data-cell-id="12:2026:objectif"]')
    ).not.toBeNull();
  });
});
