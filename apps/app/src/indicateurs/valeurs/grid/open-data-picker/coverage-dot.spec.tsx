import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridCellServicesProvider } from '../grid-context';
import { OpenDataSource, toIndicateurId, toYear } from '../types';
import { CoverageDot } from './coverage-dot';

const coveringSources: OpenDataSource[] = [
  {
    sourceId: 'citepa',
    libelle: 'CITEPA',
    value: 42,
    methodologie: null,
    dateVersion: '2026-01-01',
  },
];

const renderDot = (): void => {
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
      <CoverageDot
        coveringSources={coveringSources}
        groupLabel="Résidentiel"
        rowLabel="NOx"
        indicateurId={toIndicateurId(25)}
        year={toYear(2050)}
      />
    </GridCellServicesProvider>
  );
};

describe('CoverageDot', () => {
  it('affiche une infobulle au survol de la pastille', async () => {
    renderDot();

    const [pastille] = screen
      .getByRole('button', { name: 'Valeur open data disponible' })
      .getElementsByTagName('span');
    fireEvent.mouseEnter(pastille);

    expect(
      await screen.findByText('Open data disponible pour cette cellule')
    ).toBeDefined();
  });
});
