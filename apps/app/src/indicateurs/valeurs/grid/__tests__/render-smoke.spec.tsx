import { fireEvent, render, screen } from '@testing-library/react';
import { capitalize } from '@tet/ui/labels/plural';
import { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
import { IndicateurValeursTable } from '../indicateur-valeurs.table';
import {
  CELL_ID_ATTRIBUTE,
  GridGroups,
  GridRow,
  toIndicateurId,
  toYear,
} from '../types';
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

  it("colle les lignes de secteur juste sous l'en-tête", () => {
    const { container } = renderGrid({ onAddYear: vi.fn() });

    const groupHeaders = container.querySelectorAll('th[scope="rowgroup"]');
    expect(groupHeaders.length).toBe(5);
    groupHeaders.forEach((cell) => {
      expect(cell.className).toContain('sticky');
      expect(cell.className).toContain('top-[var(--grid-head-height)]');
    });
  });
});

describe('IndicateurValeursTable lecture seule', () => {
  it('affiche les valeurs dans des champs désactivés', () => {
    renderGrid({ isReadonly: true });

    const champs = screen.getAllByLabelText(
      capitalize(appLabels.indicateurResultat())
    );
    expect(champs.length).toBeGreaterThan(0);
    champs.forEach((champ) => {
      expect((champ as HTMLInputElement).disabled).toBe(true);
    });
  });

  it('laisse les cellules éditables au clic quand la grille est saisissable', () => {
    renderGrid();

    // Hors lecture seule, la valeur est un texte : aucun champ n'est rendu tant
    // que la cellule n'est pas ouverte à l'édition.
    expect(
      screen.queryByLabelText(capitalize(appLabels.indicateurResultat()))
    ).toBeNull();
  });

  it('ignore le collage en lecture seule', () => {
    const saveCellValues = vi.fn();
    const { container } = renderGrid({
      isReadonly: true,
      actions: { ...fakeGridActions, saveCellValues },
    });

    // Le collage se lit sur la cellule elle-même : viser la table ferait passer
    // le test sans rien prouver, faute d'atteindre le gestionnaire.
    const cellule = container.querySelector(`[${CELL_ID_ATTRIBUTE}]`);
    expect(cellule).not.toBeNull();
    fireEvent.paste(cellule as Element, {
      clipboardData: { getData: () => '12\t13' },
    });

    expect(saveCellValues).not.toHaveBeenCalled();
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
