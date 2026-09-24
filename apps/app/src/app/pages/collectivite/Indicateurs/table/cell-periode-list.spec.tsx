import { render, screen } from '@testing-library/react';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import type { PreparedData } from '../data/prepare-data';
import { CellPeriodeList } from './cell-periode-list';

describe('CellPeriodeList', () => {
  it('formate aussi une période mensuelle présente seulement dans une source extérieure', () => {
    const period = IndicateurPeriods.parse('mensuelle', '2026-02');
    const data = {
      periodes: [period],
      dernierePeriodeModePrive: undefined,
      valeursExistantes: [],
    } as unknown as PreparedData;

    render(
      <table>
        <tbody>
          <tr>
            <CellPeriodeList
              data={data}
              type="resultat"
              readonly
              onDelete={vi.fn()}
            />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByText('février 2026')).toBeDefined();
    expect(screen.queryByText('2026-02')).toBeNull();
  });
});
