import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FicheSecteursAVerifier } from './data/use-list-plan-fiches-secteurs-a-verifier';
import { FicheSecteursBadges } from './fiche-secteurs.badge';

const ficheAttribuee = {
  ficheId: 1,
  etat: 'attribue',
  secteurs: ['residentiel', 'tertiaire', 'transport_routier'],
} as FicheSecteursAVerifier;

describe('FicheSecteursBadges', () => {
  it('affiche un badge par secteur validé, dans une rangée qui replie', () => {
    const { container } = render(
      <FicheSecteursBadges fiche={ficheAttribuee} />
    );

    expect(screen.getByText('Résidentiel')).toBeInTheDocument();
    expect(screen.getByText('Tertiaire')).toBeInTheDocument();
    expect(screen.getByText('Transport routier')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('flex-wrap');
  });

  it("n'affiche rien tant que les secteurs restent à renseigner", () => {
    const { container } = render(
      <FicheSecteursBadges
        fiche={{ ficheId: 1, etat: 'a_renseigner' } as FicheSecteursAVerifier}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
