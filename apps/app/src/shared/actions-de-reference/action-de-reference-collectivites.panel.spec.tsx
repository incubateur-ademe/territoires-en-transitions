import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionDeReferenceCollectivitesPanel } from './action-de-reference-collectivites.panel';
import {
  isolationComblesAction,
  toFicheFixture,
} from './actions-de-reference.fixture';
import { useListFichesOfOtherCollectivites } from './data/use-list-fiches-of-other-collectivites';

vi.mock('./data/use-list-fiches-of-other-collectivites', () => ({
  useListFichesOfOtherCollectivites: vi.fn(),
}));

const twoCollectivitiesFiches = [
  toFicheFixture({
    id: 1,
    titre: 'Inventaire énergétique du patrimoine',
    description: 'Relevé des consommations de 60 bâtiments.',
    collectiviteId: 10,
    collectiviteNom: 'CA Porte de l Isère',
    restreint: false,
  }),
  toFicheFixture({
    id: 2,
    titre: 'Fonds de concours rénovation',
    description: null,
    collectiviteId: 20,
    collectiviteNom: 'Métropole de Lyon',
    restreint: false,
  }),
];

afterEach(cleanup);

const mockFichesList = (
  list: ReturnType<typeof useListFichesOfOtherCollectivites>
): void => {
  vi.mocked(useListFichesOfOtherCollectivites).mockReturnValue(list);
};

const renderPanel = (): void => {
  render(
    <ActionDeReferenceCollectivitesPanel
      actionDeReferenceId={isolationComblesAction.id}
    />
  );
};

describe('fiches-restreintes-et-descriptions-longues', () => {
  it('une fiche restreinte porte un cadenas accessible à côté de son titre', () => {
    mockFichesList({
      status: 'loaded',
      fiches: [
        toFicheFixture({
          id: 4,
          titre: 'Fiche confidentielle',
          description: null,
          collectiviteId: 40,
          collectiviteNom: 'Commune de Vienne',
          restreint: true,
        }),
      ],
    });

    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Voir' }));

    expect(screen.getByTitle('Action en accès restreint')).toBeDefined();
    expect(
      screen.queryByRole('link', { name: 'Fiche confidentielle' })
    ).toBeNull();
  });

  it('une description de plus de 150 caractères est tronquée à la fin d un mot', () => {
    const longDescription = `${'Rénovation des bâtiments communaux. '.repeat(
      10
    )}Fin.`;
    mockFichesList({
      status: 'loaded',
      fiches: [
        toFicheFixture({
          id: 5,
          titre: 'Fiche longue',
          description: longDescription,
          collectiviteId: 50,
          collectiviteNom: 'Commune de Lyon',
          restreint: false,
        }),
      ],
    });

    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Voir' }));

    expect(
      screen.getByRole('link', { name: 'Fiche longue' }).getAttribute('href')
    ).toBe('/collectivite/50/actions/5/details');
    expect(
      screen.getByText(/^Rénovation des bâtiments communaux/).textContent
    ).toMatch(/^(?=.{1,153}$)Rénovation.*\.\.\.$/);
  });
});

describe('panneau-collectivites-liees', () => {
  it('replié, compte les collectivités liées sans montrer leurs fiches', () => {
    mockFichesList({ status: 'loaded', fiches: twoCollectivitiesFiches });

    renderPanel();

    expect(
      screen.getByText('2 collectivités ont des actions liées')
    ).toBeDefined();
    expect(
      screen.queryByText('Inventaire énergétique du patrimoine')
    ).toBeNull();
  });

  it('au singulier, indique une seule collectivité liée', () => {
    mockFichesList({
      status: 'loaded',
      fiches: [twoCollectivitiesFiches[0]],
    });

    renderPanel();

    expect(
      screen.getByText('1 collectivité a des actions liées')
    ).toBeDefined();
  });

  it('Voir déplie les fiches liées avec leur collectivité, Masquer les replie', () => {
    mockFichesList({ status: 'loaded', fiches: twoCollectivitiesFiches });

    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Voir' }));

    expect(screen.getByText('CA Porte de l Isère')).toBeDefined();
    expect(
      screen.getByText('Inventaire énergétique du patrimoine')
    ).toBeDefined();
    expect(
      screen.getByText('Relevé des consommations de 60 bâtiments.')
    ).toBeDefined();
    expect(screen.getByText('Fonds de concours rénovation')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Masquer' }));

    expect(screen.queryByText('Fonds de concours rénovation')).toBeNull();
  });

  it('compte les collectivités des seules fiches des autres collectivités', () => {
    mockFichesList({
      status: 'loaded',
      fiches: [
        toFicheFixture({
          id: 2,
          titre: 'Fonds de concours rénovation',
          description: null,
          collectiviteId: 20,
          collectiviteNom: 'Métropole de Lyon',
          restreint: false,
        }),
      ],
    });

    renderPanel();

    expect(
      screen.getByText('1 collectivité a des actions liées')
    ).toBeDefined();
  });

  it('sans aucune fiche liée, ne rend rien', () => {
    mockFichesList({ status: 'loaded', fiches: [] });

    const { container } = render(
      <ActionDeReferenceCollectivitesPanel
        actionDeReferenceId={isolationComblesAction.id}
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('en erreur, propose de réessayer la lecture des fiches liées', () => {
    const retry = vi.fn();
    mockFichesList({ status: 'error', retry });

    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(retry).toHaveBeenCalledOnce();
  });
});
