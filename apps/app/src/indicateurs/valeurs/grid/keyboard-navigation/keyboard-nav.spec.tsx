import {
  cleanup,
  createEvent,
  fireEvent,
  render,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IndicateurValuesGrid } from '../indicateur-values-grid';
import { fakeGridActions } from '../__tests__/grid-fixtures';
import {
  generateCellKey,
  CellKey,
  GridCell,
  GridRow,
  IndicateurValuesGridActions,
  toIndicateurId,
  toYear,
} from '../types';

afterEach(cleanup);

const years = [2030, 2036].map(toYear);

const rows: GridRow[] = [
  { indicateurId: toIndicateurId(1), label: 'A' },
  { indicateurId: toIndicateurId(2), label: 'B' },
  { indicateurId: toIndicateurId(3), label: 'C' },
];

const emptyCell: GridCell = { resultat: null, objectif: null };
const cellWithObjectif: GridCell = { resultat: null, objectif: 5 };

const cells = new Map<CellKey, GridCell>([
  [generateCellKey(toIndicateurId(1), toYear(2030)), emptyCell],
  [generateCellKey(toIndicateurId(1), toYear(2036)), emptyCell],
  [generateCellKey(toIndicateurId(2), toYear(2030)), cellWithObjectif],
  [generateCellKey(toIndicateurId(2), toYear(2036)), emptyCell],
  [generateCellKey(toIndicateurId(3), toYear(2030)), emptyCell],
  [generateCellKey(toIndicateurId(3), toYear(2036)), emptyCell],
]);

const renderGrid = (
  actions: IndicateurValuesGridActions = fakeGridActions
): HTMLElement =>
  render(
    <IndicateurValuesGrid
      rows={rows}
      years={years}
      cells={cells}
      actions={actions}
    />
  ).container;

const cellInput = (container: HTMLElement, key: string): HTMLElement => {
  const input = container.querySelector<HTMLElement>(`[data-cell-id="${key}"]`);
  if (input === null) {
    throw new Error(`no cell input for ${key}`);
  }
  return input;
};

const focusedCellId = (): string | null =>
  document.activeElement?.getAttribute('data-cell-id') ?? null;

describe('IndicateurValuesGrid keyboard navigation', () => {
  it('ArrowDown déplace le focus vers la cellule dessous', () => {
    const container = renderGrid();
    const first = cellInput(container, '1:2030:objectif');
    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowDown' });

    expect(focusedCellId()).toBe('2:2030:objectif');
  });

  it('Tab déplace vers la cellule navigable suivante', () => {
    const container = renderGrid();
    const cell = cellInput(container, '1:2036:objectif');
    cell.focus();

    fireEvent.keyDown(cell, { key: 'Tab' });

    expect(focusedCellId()).toBe('2:2030:objectif');
  });

  it('Enter enregistre la valeur puis descend', () => {
    const saveCellValue = vi.fn().mockResolvedValue({ ok: true, value: undefined });
    const container = renderGrid({ ...fakeGridActions, saveCellValue });
    const first = cellInput(container, '1:2030:objectif');
    fireEvent.click(first);

    const input = cellInput(container, '1:2030:objectif');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(saveCellValue).toHaveBeenCalledWith(
      expect.objectContaining({ value: 5, field: 'objectif' })
    );
    expect(focusedCellId()).toBe('2:2030:objectif');
  });

  it('Tab sur la dernière cellule ne piège pas le focus', () => {
    const container = renderGrid();
    const last = cellInput(container, '3:2036:objectif');
    last.focus();

    const event = createEvent.keyDown(last, { key: 'Tab' });
    fireEvent(last, event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('établit un roving tabindex : une seule cellule tabbable', () => {
    const container = renderGrid();
    const tabbable = Array.from(
      container.querySelectorAll('[data-cell-id]')
    ).filter((input) => input.getAttribute('tabindex') === '0');

    expect(tabbable).toHaveLength(1);
  });

  it('préserve le roving tabindex quand la map cells est reconstruite', () => {
    const { container, rerender } = render(
      <IndicateurValuesGrid
        rows={rows}
        years={years}
        cells={cells}
        actions={fakeGridActions}
      />
    );
    const target = cellInput(container, '3:2036:objectif');
    target.focus();

    rerender(
      <IndicateurValuesGrid
        rows={rows}
        years={years}
        cells={new Map(cells)}
        actions={fakeGridActions}
      />
    );

    expect(target.getAttribute('tabindex')).toBe('0');
  });

  it('rétablit une cellule tabbable après remplacement du nœud tabbable', () => {
    const { container, rerender } = render(
      <IndicateurValuesGrid
        rows={rows}
        years={years}
        cells={cells}
        actions={fakeGridActions}
      />
    );
    cellInput(container, '1:2030:objectif').focus();

    const swapped = new Map(cells);
    swapped.set(generateCellKey(toIndicateurId(1), toYear(2030)), cellWithObjectif);
    rerender(
      <IndicateurValuesGrid
        rows={rows}
        years={years}
        cells={swapped}
        actions={fakeGridActions}
      />
    );

    const tabbable = Array.from(
      container.querySelectorAll('[data-cell-id]')
    ).filter((cell) => cell.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
  });

  it('saute une ligne sans cellule et déplace le focus vers la suivante', () => {
    const sparseCells = new Map(cells);
    sparseCells.delete(generateCellKey(toIndicateurId(2), toYear(2030)));
    const container = render(
      <IndicateurValuesGrid
        rows={rows}
        years={years}
        cells={sparseCells}
        actions={fakeGridActions}
      />
    ).container;
    const first = cellInput(container, '1:2030:objectif');
    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowDown' });

    expect(focusedCellId()).toBe('3:2030:objectif');
  });
});
