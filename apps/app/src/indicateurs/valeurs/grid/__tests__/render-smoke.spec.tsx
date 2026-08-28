import { fireEvent, render, screen } from '@testing-library/react';
import { capitalize } from '@tet/ui/labels/plural';
import { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
import { IndicateurValeursTable } from '../indicateur-valeurs.table';
import { IndicateurTableRow } from '../types';
import {
  fakeReferenceYear,
  fakeRow,
  fakeRows,
  fakeYears,
} from './grid-fixtures';

vi.mock(
  '@/app/demarches/pcaet/diagnostic/data/use-update-diagnostic-indicateurs-valeurs',
  () => ({
    useUpdateDiagnosticIndicateursValeurs: () => ({
      updateIndicateurValeurs: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    }),
  })
);

const renderGrid = (
  overrides: Partial<ComponentProps<typeof IndicateurValeursTable>> = {}
): ReturnType<typeof render> =>
  render(
    <IndicateurValeursTable
      demarcheId={1}
      rows={fakeRows}
      years={fakeYears}
      referenceYear={fakeReferenceYear}
      title="Profil énergie CLIMAT"
      unit="kteq CO2"
      onReferenceYearChange={vi.fn()}
      isRequired
      {...overrides}
    />
  );

describe('IndicateurValeursTable smoke', () => {
  it('rend sans lever', () => {
    renderGrid();
  });
});

describe('IndicateurValeursTable année de référence', () => {
  it("place le champ d'année de référence dans l'en-tête du tableau", () => {
    const { container } = renderGrid({ onReferenceYearChange: vi.fn() });

    const field = container.querySelector(
      '[data-test="indicateurs.valeurs.reference-year"]'
    );
    const table = container.querySelector('table');

    expect(field).not.toBeNull();
    expect(table?.contains(field)).toBe(true);
  });

  it("permet de saisir l'année dans l'en-tête de la première colonne", () => {
    const onReferenceYearChange = vi.fn();
    renderGrid({ onReferenceYearChange });

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurAnneeReferenceChamp,
      })
    );
    const input = screen.getByRole('textbox', {
      name: appLabels.indicateurAnneeReferenceChamp,
    });
    fireEvent.change(input, { target: { value: '2018' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onReferenceYearChange).toHaveBeenCalledWith(2018);
  });

  it("affiche un placeholder sans année quand la référence n'est pas saisie", () => {
    renderGrid({
      referenceYear: null,
      years: [2030, 2036, 2050],
      onReferenceYearChange: vi.fn(),
    });

    expect(
      screen.getByRole('button', {
        name: appLabels.indicateurAnneeReferenceChamp,
      }).textContent
    ).toBe(appLabels.indicateurAnneeReferencePlaceholder);
    expect(screen.getByText('2030')).toBeDefined();
  });
});

describe('IndicateurValeursTable lecture seule', () => {
  it('affiche les valeurs sans ouvrir l’éditeur au clic', () => {
    renderGrid({ isReadonly: true });

    const firstValue = String(
      fakeRows[0].indicateurValeurs[0]?.resultat ??
        fakeRows[0].indicateurValeurs[0]?.objectif
    );
    fireEvent.click(screen.getAllByText(firstValue)[0]);

    expect(
      screen.queryByLabelText(capitalize(appLabels.indicateurResultat()))
    ).toBeNull();
  });

  it('laisse les cellules éditables au clic quand la grille est saisissable', () => {
    renderGrid();

    expect(
      screen.queryByLabelText(capitalize(appLabels.indicateurResultat()))
    ).toBeNull();
  });
});

const secteursDuPolluant: IndicateurTableRow[] = [
  fakeRow({ indicateurId: 1, indicateurLabel: 'Résidentiel', indicateurValeurs: [] }),
  fakeRow({
    indicateurId: 2,
    indicateurLabel: 'Transport routier',
    indicateurValeurs: [],
  }),
];

describe('IndicateurValeursTable lignes', () => {
  it('affiche les libellés de ligne', () => {
    renderGrid({
      rows: secteursDuPolluant,
    });

    expect(screen.getByText('Résidentiel')).toBeDefined();
    expect(screen.getByText('Transport routier')).toBeDefined();
  });

  it('affiche le titre et l’unité dans la cellule haut gauche', () => {
    renderGrid();

    expect(screen.getByText('Profil énergie CLIMAT')).toBeDefined();
    expect(screen.getByText(/kteq CO2/)).toBeDefined();
  });
});
