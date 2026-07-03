import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  fakeCells,
  fakeGridActions,
  fakeGroups,
  fakeReferenceYear,
  fakeYears,
} from './grid-fixtures';
import { IndicateurValuesGrid } from '../indicateur-values-grid';

const renderGrid = (): void => {
  render(
    <IndicateurValuesGrid
      groups={fakeGroups}
      years={fakeYears}
      referenceYear={fakeReferenceYear}
      cells={fakeCells()}
      actions={fakeGridActions}
    />
  );
};

describe('IndicateurValuesGrid smoke', () => {
  it('rend sans lever', () => {
    renderGrid();
  });

  it('affiche des variations d objectif sur les colonnes futures', () => {
    renderGrid();

    expect(
      screen.getAllByText(/par rapport à l'année de référence/).length
    ).toBeGreaterThan(0);
  });
});
