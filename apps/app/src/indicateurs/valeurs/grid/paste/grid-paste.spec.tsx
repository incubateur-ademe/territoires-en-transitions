import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
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
]);

const renderGrid = (
  actions: IndicateurValuesGridActions,
  notify: (message: string) => void
): HTMLElement =>
  render(
    <IndicateurValuesGrid
      rows={rows}
      years={years}
      cells={cells}
      actions={actions}
      notify={notify}
    />
  ).container;

const cellInput = (container: HTMLElement, key: string): HTMLElement => {
  const input = container.querySelector<HTMLElement>(`[data-cell-id="${key}"]`);
  if (input === null) {
    throw new Error(`no cell input for ${key}`);
  }
  return input;
};

describe('IndicateurValuesGrid paste', () => {
  it('colle un bloc via saveCellValues et signale les cellules ignorees par un toast', async () => {
    const saveCellValues = vi
      .fn()
      .mockResolvedValue({ ok: true, value: { written: 4, failed: [] } });
    const notify = vi.fn();
    const container = renderGrid({ ...fakeGridActions, saveCellValues }, notify);
    const anchor = cellInput(container, '1:2030');
    anchor.focus();

    fireEvent.paste(anchor, {
      clipboardData: { getData: () => '10\t20\n30\t40\n50\t60' },
    });

    await waitFor(() => expect(saveCellValues).toHaveBeenCalledTimes(1));
    expect(saveCellValues.mock.calls[0][0]).toEqual([
      { indicateurId: toIndicateurId(1), valueId: undefined, year: toYear(2030), resultat: 10 },
      { indicateurId: toIndicateurId(1), valueId: undefined, year: toYear(2036), resultat: 20 },
      { indicateurId: toIndicateurId(2), valueId: undefined, year: toYear(2030), resultat: 30 },
      { indicateurId: toIndicateurId(2), valueId: undefined, year: toYear(2036), resultat: 40 },
    ]);
    expect(notify).toHaveBeenCalledWith(
      appLabels.indicateurCollageIgnore({ count: 2 })
    );
  });

  it("n'appelle pas le toast quand tout le collage aboutit", async () => {
    const saveCellValues = vi
      .fn()
      .mockResolvedValue({ ok: true, value: { written: 1, failed: [] } });
    const notify = vi.fn();
    const container = renderGrid({ ...fakeGridActions, saveCellValues }, notify);
    const anchor = cellInput(container, '1:2036');
    anchor.focus();

    fireEvent.paste(anchor, { clipboardData: { getData: () => '7' } });

    await waitFor(() => expect(saveCellValues).toHaveBeenCalledTimes(1));
    expect(notify).not.toHaveBeenCalled();
  });

  it('signale les cellules rejetees au serveur lors d un collage partiellement echoue', async () => {
    const failedInput = {
      indicateurId: toIndicateurId(2),
      valueId: undefined,
      year: toYear(2036),
      resultat: 40,
    };
    const saveCellValues = vi
      .fn()
      .mockResolvedValue({ ok: true, value: { written: 3, failed: [failedInput] } });
    const notify = vi.fn();
    const container = renderGrid({ ...fakeGridActions, saveCellValues }, notify);
    const anchor = cellInput(container, '1:2030');
    anchor.focus();

    fireEvent.paste(anchor, { clipboardData: { getData: () => '10\t20\n30\t40' } });

    await waitFor(() => expect(saveCellValues).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        appLabels.indicateurCollageEchec({ count: 1 })
      )
    );
  });

  it('signale les cellules quand saveCellValues rejette', async () => {
    const saveCellValues = vi.fn().mockRejectedValue(new Error('network'));
    const notify = vi.fn();
    const container = renderGrid({ ...fakeGridActions, saveCellValues }, notify);
    const anchor = cellInput(container, '1:2030');
    anchor.focus();

    fireEvent.paste(anchor, { clipboardData: { getData: () => '10\t20\n30\t40' } });

    await waitFor(() => expect(saveCellValues).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        appLabels.indicateurCollageEchec({ count: 4 })
      )
    );
  });

  it('signale toutes les cellules quand le collage echoue entierement', async () => {
    const saveCellValues = vi.fn().mockResolvedValue({ ok: false });
    const notify = vi.fn();
    const container = renderGrid({ ...fakeGridActions, saveCellValues }, notify);
    const anchor = cellInput(container, '1:2030');
    anchor.focus();

    fireEvent.paste(anchor, { clipboardData: { getData: () => '10\t20\n30\t40' } });

    await waitFor(() => expect(saveCellValues).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        appLabels.indicateurCollageEchec({ count: 4 })
      )
    );
  });
});
