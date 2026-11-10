import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErreurAccesPage } from './erreur-acces.page';

const back = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back }),
  usePathname: () => '/collectivite/900/instruction/12',
}));

const trackView = vi.fn();
vi.mock('@/app/demarches/use-demarche-tracker', () => ({
  useTrackDemarcheView: (...args: unknown[]) => trackView(...args),
}));

describe('ErreurAccesPage', () => {
  it('affiche le heading et les deux actions de retour', () => {
    render(<ErreurAccesPage dashboardHref="/collectivite/900/demandes-avis" />);

    expect(
      screen.getByRole('heading', {
        name: 'Vous n’avez pas accès à cette page.',
      })
    ).toBeDefined();

    expect(
      screen
        .getByRole('link', { name: 'Retour au tableau de bord' })
        .getAttribute('href')
    ).toBe('/collectivite/900/demandes-avis');

    fireEvent.click(
      screen.getByRole('button', { name: 'Revenir à la page précédente' })
    );
    expect(back).toHaveBeenCalled();
  });

  it("signale le refus d'accès, avec l'espace refusé", () => {
    render(<ErreurAccesPage dashboardHref="/collectivite/900/demandes-avis" />);

    expect(trackView).toHaveBeenCalledWith(
      'demarches:pcaet:acces_refuse',
      expect.objectContaining({ properties: { espace: 'instruction' } })
    );
  });
});
