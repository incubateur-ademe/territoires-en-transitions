import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import {
  fakeCells,
  fakeGridActions,
  fakeGroups,
  fakeReferenceYear,
  fakeYears,
} from './grid-fixtures';
import { IndicateurValuesGrid } from '../indicateur-values-grid';

describe('IndicateurValuesGrid smoke', () => {
  it('rend sans lever', () => {
    render(
      <IndicateurValuesGrid
        groups={fakeGroups}
        years={fakeYears}
        referenceYear={fakeReferenceYear}
        cells={fakeCells()}
        actions={fakeGridActions}
      />
    );
  });
});
