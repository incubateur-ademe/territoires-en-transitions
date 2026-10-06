import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LeviersMondrianChart } from './leviers-mondrian.chart';
import { NO_MOBILISATION } from './to-leviers-priorisation';
import { LevierPlace } from './to-matrix-points';

const PRODUCTION_INDUSTRIELLE: LevierPlace = {
  levierId: 'production_industrielle',
  nom: 'Production industrielle',
  secteur: 'Industrie',
  ficheCount: 0,
  mobilisationScore: 0,
  noteByCategorie: { ...NO_MOBILISATION, financement: 1 },
  potentielReduction: 30,
  potentielScore: 90,
};

const BIOGAZ: LevierPlace = {
  levierId: 'biogaz',
  nom: 'Biogaz',
  secteur: 'Branche énergie',
  ficheCount: 0,
  mobilisationScore: 0,
  noteByCategorie: NO_MOBILISATION,
  potentielReduction: 10,
  potentielScore: 30,
};

const renderMondrian = ({
  selectedLevierId,
}: {
  selectedLevierId?: LevierPlace['levierId'];
} = {}): ReturnType<typeof vi.fn> => {
  const onLevierSelected = vi.fn();
  render(
    <LeviersMondrianChart
      places={[PRODUCTION_INDUSTRIELLE, BIOGAZ]}
      selectedLevierId={selectedLevierId}
      onLevierSelected={onLevierSelected}
    />
  );
  return onLevierSelected;
};

describe('LeviersMondrianChart', () => {
  it('sélectionne le levier dont on active le nom', () => {
    const onLevierSelected = renderMondrian();

    fireEvent.click(
      screen.getByRole('button', { name: 'Production industrielle' })
    );

    expect(onLevierSelected).toHaveBeenCalledWith('production_industrielle');
  });

  it('signale le levier ouvert comme enfoncé', () => {
    renderMondrian({ selectedLevierId: 'biogaz' });

    expect(
      screen.getByRole('button', { name: 'Biogaz', pressed: true })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: 'Production industrielle',
        pressed: false,
      })
    ).toBeTruthy();
  });

  it('donne pour chaque catégorie son niveau de mobilisation et son impact sur 100 du potentiel du territoire', () => {
    renderMondrian();

    expect(
      screen.getByText(
        'Financement & fiscalité, Peu mobilisé, Impact potentiel : 38/100 du territoire'
      )
    ).toBeTruthy();
  });
});
