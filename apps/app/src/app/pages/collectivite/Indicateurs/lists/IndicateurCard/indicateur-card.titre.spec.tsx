import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IndicateurCardTitre } from './indicateur-card.titre';

const toAncestor = (id: number, titre: string) => ({
  id,
  identifiantReferentiel: null,
  titre,
  titreCourt: null,
});

describe('IndicateurCardTitre', () => {
  it('affiche le titre seul pour un indicateur sans ancêtre', () => {
    const { container } = render(
      <IndicateurCardTitre ancestors={[]} titre="Verre" />
    );

    expect(container.textContent).toBe('Verre');
  });

  it("affiche le parent avant l'indicateur, séparés par un chevron", () => {
    const { container } = render(
      <IndicateurCardTitre
        ancestors={[toAncestor(1, 'Déchets')]}
        titre="Verre"
      />
    );

    expect(container.textContent).toBe('Déchets > Verre');
  });

  it('affiche toute la chaîne, du plus haut ancêtre au plus proche', () => {
    const { container } = render(
      <IndicateurCardTitre
        ancestors={[toAncestor(1, 'Déchets'), toAncestor(2, 'Ménagers')]}
        titre="Verre"
      />
    );

    expect(container.textContent).toBe('Déchets > Ménagers > Verre');
  });
});
