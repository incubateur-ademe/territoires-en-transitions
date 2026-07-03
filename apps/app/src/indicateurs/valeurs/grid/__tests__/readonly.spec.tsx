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

const renderGrid = (isReadonly: boolean) =>
  render(
    <IndicateurValuesGrid
      rows={fakeGroupsInput}
      years={fakeYears}
      referenceYear={fakeReferenceYear}
      cells={fakeCells()}
      actions={fakeGridActions}
      isReadonly={isReadonly}
    />
  );

const editableTargets = (container: HTMLElement): NodeListOf<Element> =>
  container.querySelectorAll('[data-cell-id]');

describe('IndicateurValuesGrid lecture seule', () => {
  it('expose des cibles éditables (saisie + sélecteur open data) par défaut', () => {
    const { container } = renderGrid(false);

    expect(editableTargets(container).length).toBeGreaterThan(0);
  });

  it('ne rend aucune cible éditable en lecture seule', () => {
    const { container } = renderGrid(true);

    expect(editableTargets(container)).toHaveLength(0);
  });

  it('affiche toujours les valeurs et variations en lecture seule', () => {
    renderGrid(true);

    expect(
      screen.getAllByText(/par rapport à l'année de référence/).length
    ).toBeGreaterThan(0);
  });
});
