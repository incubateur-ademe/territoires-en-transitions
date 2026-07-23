import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  fakeCells,
  fakeGridActions,
  fakeGroupsInput,
  fakeReferenceYear,
  fakeYears,
} from './grid-fixtures';
import { IndicateurValuesGrid } from '../indicateur-values-grid';
import { GridGroups, GridRow, toIndicateurId } from '../types';

const renderGrid = (): void => {
  render(
    <IndicateurValuesGrid
      rows={fakeGroupsInput}
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

const secteursDuPolluant: GridRow[] = [
  { indicateurId: toIndicateurId(1), label: 'Résidentiel' },
  { indicateurId: toIndicateurId(2), label: 'Transport routier' },
];

const polluantUnique: GridGroups = {
  nox: { label: 'NOx', rows: secteursDuPolluant },
};

describe('IndicateurValuesGrid groupes repliables', () => {
  it('affiche le libelle du groupe quand le prop est un objet groupe', () => {
    render(
      <IndicateurValuesGrid
        rows={fakeGroupsInput}
        years={fakeYears}
        referenceYear={fakeReferenceYear}
        cells={fakeCells()}
        actions={fakeGridActions}
      />
    );

    expect(screen.getByText('Résidentiel')).toBeDefined();
  });

  it('affiche le libelle du groupe meme quand le groupe est unique', () => {
    render(
      <IndicateurValuesGrid
        rows={polluantUnique}
        years={fakeYears}
        referenceYear={fakeReferenceYear}
        cells={new Map()}
        actions={fakeGridActions}
      />
    );

    expect(screen.getByText('NOx')).toBeDefined();
  });

  it('masque la ligne parente de groupe quand le prop est un tableau plat', () => {
    render(
      <IndicateurValuesGrid
        rows={secteursDuPolluant}
        years={fakeYears}
        referenceYear={fakeReferenceYear}
        cells={new Map()}
        actions={fakeGridActions}
      />
    );

    expect(screen.queryByText('NOx')).toBeNull();
    expect(screen.getByText('Résidentiel')).toBeDefined();
    expect(
      screen.queryByRole('button', { name: /Déplier|Replier/ })
    ).toBeNull();
  });

  it('affiche le titre et l’unité dans la cellule haut gauche', () => {
    render(
      <IndicateurValuesGrid
        rows={fakeGroupsInput}
        years={fakeYears}
        referenceYear={fakeReferenceYear}
        title="Profil énergie CLIMAT"
        unit="kteq CO2"
        cells={fakeCells()}
        actions={fakeGridActions}
      />
    );

    expect(screen.getByText('Profil énergie CLIMAT')).toBeDefined();
    expect(screen.getByText('kteq CO2')).toBeDefined();
  });

  it('replie et déplie les sous-secteurs d’un groupe', () => {
    render(
      <IndicateurValuesGrid
        rows={polluantUnique}
        years={fakeYears}
        referenceYear={fakeReferenceYear}
        cells={new Map()}
        actions={fakeGridActions}
      />
    );

    expect(screen.getByText('Résidentiel')).toBeDefined();
    expect(screen.getByText('2 sous-secteurs')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Replier NOx' }));

    expect(screen.queryByText('Résidentiel')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Déplier NOx' })
    ).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Déplier NOx' }));

    expect(screen.getByText('Résidentiel')).toBeDefined();
  });
});
