import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridCellServicesProvider } from '../grid-context';
import { OpenDataCell } from '../open-data-cell';
import { GridCell, toIndicateurId, toYear } from '../types';

const snbcCell: Extract<GridCell, { kind: 'open-data' }> = {
  kind: 'open-data',
  value: 0.3,
  selectedSourceId: 'snbc',
  source: {
    sourceId: 'snbc',
    libelle: 'SNBC',
    methodologie: null,
    dateVersion: '2024-01-01',
  },
  coveringSources: [],
};

const renderOpenDataCell = (variationToReferenceYear: number | null): void => {
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
      <OpenDataCell
        cell={snbcCell}
        groupLabel="Résidentiel"
        rowLabel="NOx"
        indicateurId={toIndicateurId(25)}
        year={toYear(2050)}
        variationToReferenceYear={variationToReferenceYear}
      />
    </GridCellServicesProvider>
  );
};

describe('OpenDataCell', () => {
  it('affiche la valeur reprise de la source', () => {
    renderOpenDataCell(null);

    expect(screen.getByText('0.3')).toBeDefined();
  });

  it('associe la variation signee comme description accessible de la cellule', () => {
    renderOpenDataCell(-0.897);

    const description = screen.getByText(
      /-89,7\s*% par rapport à l'année de référence/
    );
    expect(
      document.querySelector(`[aria-describedby="${description.id}"]`)
    ).not.toBe(null);
  });
});
