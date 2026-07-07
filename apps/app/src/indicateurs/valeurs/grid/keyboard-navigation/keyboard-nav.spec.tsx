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

const userData: GridCell = { kind: 'user-data', value: null, coveringSources: [] };
const openData: GridCell = {
  kind: 'open-data',
  value: 5,
  selectedSourceId: 's',
  source: { sourceId: 's', libelle: 'S', methodologie: null, dateVersion: '2026-01-01' },
  coveringSources: [],
};

const cells = new Map<CellKey, GridCell>([
  [generateCellKey(toIndicateurId(1), toYear(2030)), userData],
  [generateCellKey(toIndicateurId(1), toYear(2036)), userData],
  [generateCellKey(toIndicateurId(2), toYear(2030)), openData],
  [generateCellKey(toIndicateurId(2), toYear(2036)), userData],
  [generateCellKey(toIndicateurId(3), toYear(2030)), userData],
  [generateCellKey(toIndicateurId(3), toYear(2036)), userData],
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
  it('ArrowDown déplace le focus vers la cellule dessous, open-data comprise', () => {
    const container = renderGrid();
    const first = cellInput(container, '1:2030');
    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowDown' });

    expect(focusedCellId()).toBe('2:2030');
  });

  it('Tab déplace vers la cellule navigable suivante', () => {
    const container = renderGrid();
    const cell = cellInput(container, '1:2036');
    cell.focus();

    fireEvent.keyDown(cell, { key: 'Tab' });

    expect(focusedCellId()).toBe('2:2030');
  });

  it('Enter enregistre la valeur puis descend', () => {
    const saveCellValue = vi.fn().mockResolvedValue({ ok: true, value: undefined });
    const container = renderGrid({ ...fakeGridActions, saveCellValue });
    const first = cellInput(container, '1:2030');
    first.focus();

    fireEvent.change(first, { target: { value: '5' } });
    fireEvent.keyDown(first, { key: 'Enter' });

    expect(saveCellValue).toHaveBeenCalledWith(
      expect.objectContaining({ value: 5 })
    );
    expect(focusedCellId()).toBe('2:2030');
  });

  it('Tab sur la dernière cellule ne piège pas le focus', () => {
    const container = renderGrid();
    const last = cellInput(container, '3:2036');
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
    const target = cellInput(container, '3:2036');
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
    cellInput(container, '1:2030').focus();

    const swapped = new Map(cells);
    swapped.set(generateCellKey(toIndicateurId(1), toYear(2030)), openData);
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

  it('ne piège pas le focus quand la cellule cible est absente de la grille', () => {
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
    const first = cellInput(container, '1:2030');
    first.focus();

    const event = createEvent.keyDown(first, { key: 'ArrowDown' });
    fireEvent(first, event);

    expect(event.defaultPrevented).toBe(false);
    expect(focusedCellId()).toBe('1:2030');
  });
});
