import { fireEvent, render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
import { IndicateurValeursTable } from '../indicateur-valeurs.table';
import { GridGroups, GridRow, toIndicateurId, toYear } from '../types';
import {
  fakeCells,
  fakeGridActions,
  fakeGroupsInput,
  fakeReferenceYear,
  fakeYears,
} from './grid-fixtures';

const notify = vi.fn();

const renderGrid = (
  overrides: Partial<ComponentProps<typeof IndicateurValeursTable>> = {}
): ReturnType<typeof render> =>
  render(
    <IndicateurValeursTable
      rows={fakeGroupsInput}
      years={fakeYears}
      referenceYear={fakeReferenceYear}
      title="Profil énergie CLIMAT"
      unit="kteq CO2"
      cells={fakeCells()}
      actions={fakeGridActions}
      notify={notify}
      {...overrides}
    />
  );

describe('IndicateurValeursTable smoke', () => {
  it('rend sans lever', () => {
    renderGrid();
  });

  it("n'affiche pas de colonne + sans onAddYear", () => {
    renderGrid();

    expect(
      screen.queryByRole('button', { name: appLabels.indicateurAjouterAnnee })
    ).toBeNull();
  });

  it('ajoute une année via la colonne + quand onAddYear est fourni', () => {
    const onAddYear = vi.fn();
    renderGrid({ onAddYear });

    fireEvent.click(
      screen.getByRole('button', { name: appLabels.indicateurAjouterAnnee })
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '2040' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onAddYear).toHaveBeenCalledWith(toYear(2040));
  });

  it('aligne la colonne + avec des cellules sticky à droite dans le corps', () => {
    const { container } = renderGrid({ onAddYear: vi.fn() });

    const stickyTrailingCells = container.querySelectorAll(
      'tbody td.sticky.right-0'
    );
    // 5 group-parent rows + 30 data rows (5 secteurs x 6 polluants).
    expect(stickyTrailingCells.length).toBe(35);
    stickyTrailingCells.forEach((cell) => {
      expect(cell.className).toContain('sticky');
      expect(cell.className).toContain('right-0');
    });
  });
});

const secteursDuPolluant: GridRow[] = [
  { indicateurId: toIndicateurId(1), label: 'Résidentiel' },
  { indicateurId: toIndicateurId(2), label: 'Transport routier' },
];

const polluantUnique: GridGroups = {
  nox: { label: 'NOx', rows: secteursDuPolluant },
};

describe('IndicateurValeursTable groupes repliables', () => {
  it('affiche le libelle du groupe quand le prop est un objet groupe', () => {
    renderGrid();

    expect(screen.getByText('Résidentiel')).toBeDefined();
  });

  it('affiche le libelle du groupe meme quand le groupe est unique', () => {
    renderGrid({
      rows: polluantUnique,
      cells: new Map(),
    });

    expect(screen.getByText('NOx')).toBeDefined();
  });

  it('masque la ligne parente de groupe quand le prop est un tableau plat', () => {
    renderGrid({
      rows: secteursDuPolluant,
      cells: new Map(),
    });

    expect(screen.queryByText('NOx')).toBeNull();
    expect(screen.getByText('Résidentiel')).toBeDefined();
    expect(
      screen.queryByRole('button', { name: /Déplier|Replier/ })
    ).toBeNull();
  });

  it('affiche le titre et l’unité dans la cellule haut gauche', () => {
    renderGrid();

    expect(screen.getByText('Profil énergie CLIMAT')).toBeDefined();
    expect(screen.getByText('kteq CO2')).toBeDefined();
  });

  it('replie et déplie les sous-secteurs d’un groupe', () => {
    renderGrid({
      rows: polluantUnique,
      cells: new Map(),
    });

    expect(screen.getByText('Résidentiel')).toBeDefined();
    expect(screen.getByText('2 sous-secteurs')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Replier NOx' }));

    expect(screen.queryByText('Résidentiel')).toBeNull();
    expect(screen.getByRole('button', { name: 'Déplier NOx' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Déplier NOx' }));

    expect(screen.getByText('Résidentiel')).toBeDefined();
  });
});
