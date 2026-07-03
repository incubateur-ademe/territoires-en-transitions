import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  fakeCells,
  fakeGridActions,
  fakeGroupsInput,
  fakeReferenceYear,
  fakeYears,
} from './grid-fixtures';
import { IndicateurValuesGrid } from '../indicateur-values-grid';

const reorderHandles = (): HTMLElement[] =>
  screen.queryAllByRole('button', { name: /^Réordonner / });

describe('IndicateurValuesGrid réordonnancement', () => {
  it('affiche des poignées de réordonnancement quand onReorderRows est fourni', () => {
    render(
      <IndicateurValuesGrid
        rows={fakeGroupsInput}
        years={fakeYears}
        referenceYear={fakeReferenceYear}
        cells={fakeCells()}
        actions={fakeGridActions}
        onReorderRows={() => undefined}
      />
    );

    expect(reorderHandles().length).toBeGreaterThan(0);
  });

  it('ne rend aucune poignée quand onReorderRows est absent', () => {
    render(
      <IndicateurValuesGrid
        rows={fakeGroupsInput}
        years={fakeYears}
        referenceYear={fakeReferenceYear}
        cells={fakeCells()}
        actions={fakeGridActions}
      />
    );

    expect(reorderHandles()).toHaveLength(0);
  });
});
