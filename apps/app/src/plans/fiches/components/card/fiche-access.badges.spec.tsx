import { appLabels } from '@/app/labels/catalog';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FicheAccessBadges } from './fiche-access.badges';

afterEach(cleanup);

const ownCollectiviteId = 4322;

const toFiche = ({
  restreint,
  sharedWithCollectivites,
}: {
  restreint: boolean;
  sharedWithCollectivites: { id: number; nom: string }[];
}) => ({
  id: 1,
  collectiviteId: ownCollectiviteId,
  collectiviteNom: 'Bordeaux Métropole',
  restreint,
  sharedWithCollectivites,
});

describe('FicheAccessBadges', () => {
  it("n'affiche rien, pas même un 0, pour une fiche ni restreinte ni partagée", () => {
    const { container } = render(
      <FicheAccessBadges
        ficheAction={toFiche({ restreint: false, sharedWithCollectivites: [] })}
        collectiviteId={ownCollectiviteId}
      />
    );

    expect(container.textContent).toBe('');
  });

  it("n'affiche que le cadenas, sans 0, pour une fiche restreinte non partagée", () => {
    const { container } = render(
      <FicheAccessBadges
        ficheAction={toFiche({ restreint: true, sharedWithCollectivites: [] })}
        collectiviteId={ownCollectiviteId}
      />
    );

    expect(screen.getAllByTitle(appLabels.actionAccesRestreint).length).toBe(1);
    expect(container.textContent).toBe('');
  });

  it('indique le partage d’une fiche non restreinte', () => {
    render(
      <FicheAccessBadges
        ficheAction={toFiche({
          restreint: false,
          sharedWithCollectivites: [{ id: 10, nom: 'CA Porte de l’Isère' }],
        })}
        collectiviteId={ownCollectiviteId}
      />
    );

    expect(
      screen.getByTitle(
        'Cette action est partagée en édition avec la collectivité CA Porte de l’Isère'
      )
    ).toBeTruthy();
    expect(screen.queryByTitle(appLabels.actionAccesRestreint)).toBeNull();
  });

  it('distingue le cadenas et le partage pour une fiche restreinte et partagée', () => {
    render(
      <FicheAccessBadges
        ficheAction={toFiche({
          restreint: true,
          sharedWithCollectivites: [{ id: 10, nom: 'CA Porte de l’Isère' }],
        })}
        collectiviteId={ownCollectiviteId}
      />
    );

    expect(screen.getAllByTitle(appLabels.actionAccesRestreint).length).toBe(1);
    expect(
      screen.getAllByTitle(
        'Cette action est partagée en édition avec la collectivité CA Porte de l’Isère'
      ).length
    ).toBe(1);
  });
});
