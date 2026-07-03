import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OpenDataPicker } from './open-data-picker';
import { OpenDataSource, toYear } from '../types';

const sources: OpenDataSource[] = [
  {
    sourceId: 'ame',
    libelle: 'AME',
    value: 640,
    methodologie: 'Projection « avec mesures existantes »',
    dateVersion: '2024-01-01',
  },
  {
    sourceId: 'ams',
    libelle: 'AMS',
    value: 560,
    methodologie: null,
    dateVersion: '2024-01-01',
  },
];

const renderPicker = (
  overrides: Partial<Parameters<typeof OpenDataPicker>[0]> = {}
): void => {
  render(
    <OpenDataPicker
      groupLabel="Résidentiel"
      rowLabel="NOx"
      year={toYear(2030)}
      unit="t"
      sources={sources}
      onSelect={vi.fn()}
      onClose={vi.fn()}
      onReset={vi.fn()}
      {...overrides}
    />
  );
};

describe('OpenDataPicker', () => {
  it('affiche le titre, le contexte de la cellule et chaque source avec sa valeur', () => {
    renderPicker();
    expect(screen.getByText("Compléter avec de l'open data")).not.toBeNull();
    expect(screen.getByText('Résidentiel · NOx · 2030')).not.toBeNull();
    expect(screen.getByText('AME')).not.toBeNull();
    expect(screen.getByText('640 t')).not.toBeNull();
    expect(screen.getByText('AMS')).not.toBeNull();
    expect(screen.getByText('560 t')).not.toBeNull();
  });

  it('remonte le sourceId au clic sur une source', () => {
    const onSelect = vi.fn();
    renderPicker({ onSelect });
    fireEvent.click(screen.getByText('AMS'));
    expect(onSelect).toHaveBeenCalledWith('ams');
  });

  it('ferme au clic sur le bouton de fermeture', () => {
    const onClose = vi.fn();
    renderPicker({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalled();
  });

  it("propose la sélection en lot quand columnSelection est fourni", () => {
    const onSelectLot = vi.fn();
    renderPicker({
      columnSelection: { source: sources[0], count: 9, onSelect: onSelectLot },
    });
    fireEvent.click(
      screen.getByText(
        'Sélectionner la donnée AME pour les 9 cellules vides du secteur Résidentiel'
      )
    );
    expect(onSelectLot).toHaveBeenCalled();
  });

  it('marque la source sélectionnée', () => {
    renderPicker({ selectedSourceId: 'ame' });
    const selected = screen.getByRole('button', { pressed: true });
    expect(selected.textContent).toContain('AME');
  });

  it("n'affiche pas la sélection en lot sans columnSelection", () => {
    renderPicker();
    expect(screen.queryByText(/Sélectionner .* pour les/)).toBeNull();
  });

  it('propose de repasser en saisie manuelle quand une source est sélectionnée', () => {
    const onReset = vi.fn();
    renderPicker({ selectedSourceId: 'ame', onReset });
    fireEvent.click(screen.getByText('Repasser en saisie manuelle'));
    expect(onReset).toHaveBeenCalled();
  });

  it('ne propose pas la saisie manuelle quand aucune source n est selectionnee', () => {
    renderPicker();
    expect(screen.queryByText('Repasser en saisie manuelle')).toBeNull();
  });
});
