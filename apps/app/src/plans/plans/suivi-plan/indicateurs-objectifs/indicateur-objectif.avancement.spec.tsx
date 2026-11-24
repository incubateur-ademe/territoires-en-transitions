import { computeAvancementObjectif } from '@tet/domain/plans';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IndicateurObjectifAvancement } from './indicateur-objectif.avancement';

// l'exemple d'Ugo : 152 en 2015, 124 en 2024, objectif 90 en 2030
const ges = {
  depart: { annee: 2015, valeur: 152 },
  dernier: { annee: 2024, valeur: 124 },
  cible: { annee: 2030, valeur: 90 },
  anneeCourante: 2026,
};

const renderAvancement = (params: Partial<typeof ges> = {}) => {
  const avancement = computeAvancementObjectif({ ...ges, ...params });
  if (!avancement) {
    throw new Error('avancement attendu');
  }
  return render(
    <IndicateurObjectifAvancement
      avancement={avancement}
      formatValeur={(valeur) => `${valeur} kteq`}
    />
  );
};

describe('IndicateurObjectifAvancement', () => {
  it('dit le chemin parcouru et le temps écoulé depuis le départ', () => {
    renderAvancement();

    const barre = screen.getByRole('progressbar', {
      name: "Chemin parcouru vers l'objectif",
    });
    expect(barre.getAttribute('aria-valuenow')).toBe('45');
    expect(
      screen.getByText(/^45\s%\sdu chemin, 60\s%\sdu temps écoulé depuis 2015$/)
    ).toBeDefined();
  });

  it('dit le recul en évolution depuis le départ, sans pourcentage négatif', () => {
    renderAvancement({ dernier: { annee: 2024, valeur: 163.4 } });

    expect(
      screen.getByText(/^En recul : \+7[,.]5\s%\sdepuis 2015$/)
    ).toBeDefined();
  });

  it('dit l’objectif atteint', () => {
    renderAvancement({ dernier: { annee: 2024, valeur: 85 } });

    expect(screen.getByText('Objectif atteint')).toBeDefined();
  });

  it('après l’échéance, ne garde que le verdict, sans barre', () => {
    renderAvancement({ anneeCourante: 2031 });

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(
      screen.getByText(
        'Objectif 2030 non atteint (124 kteq au lieu de 90 kteq)'
      )
    ).toBeDefined();
  });

  it('après l’échéance, dit l’objectif atteint à temps', () => {
    renderAvancement({
      anneeCourante: 2031,
      dernier: { annee: 2030, valeur: 88 },
    });

    expect(screen.getByText('Objectif 2030 atteint')).toBeDefined();
  });
});
