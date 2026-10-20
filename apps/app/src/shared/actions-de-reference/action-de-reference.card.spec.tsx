import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionDeReferenceCard } from './action-de-reference.card';
import {
  noInterest,
  isolationComblesAction,
  longDescriptionAction,
} from './actions-de-reference.fixture';

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: (): number => 5596,
}));

vi.mock('next/navigation', () => ({
  usePathname: (): string => '/collectivite/5596/actions-reference',
  useSearchParams: (): URLSearchParams =>
    new URLSearchParams('searchedText=velo'),
}));

const keepWhitespace = (text: string): string => text;

afterEach(cleanup);

describe('card-mene-au-detail', () => {
  it("le titre est un lien vers la page détail de l'action, qui mémorise la page d'origine", () => {
    render(
      <ActionDeReferenceCard
        action={isolationComblesAction}
        updateAccess={{ status: 'forbidden' }}
        interest={noInterest}
      />
    );

    expect(
      screen
        .getByRole('link', {
          name: 'Isoler les combles perdus des bâtiments communaux',
        })
        .getAttribute('href')
    ).toBe(
      '/collectivite/5596/actions-reference/1?from=%2Fcollectivite%2F5596%2Factions-reference%3FsearchedText%3Dvelo'
    );
  });

  it('avec le droit de modification, la card porte le lien du titre et le bouton de modification, sans les confondre', () => {
    render(
      <ActionDeReferenceCard
        action={isolationComblesAction}
        updateAccess={{ status: 'allowed', onUpdate: vi.fn() }}
        interest={noInterest}
      />
    );

    const link = screen.getByRole('link');
    const button = screen.getByRole('button', { name: /Modifier l'action/ });

    expect(link.contains(button)).toBe(false);
  });
});

describe('card-affiche-action-entiere', () => {
  it('montre le titre, la description, le libellé du levier et le libellé de la catégorie', () => {
    render(
      <ActionDeReferenceCard
        action={isolationComblesAction}
        updateAccess={{ status: 'forbidden' }}
        interest={noInterest}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'Isoler les combles perdus des bâtiments communaux',
      })
    ).toBeDefined();
    expect(
      screen.getByText(
        "Programmer l'isolation des combles perdus des écoles et des équipements sportifs."
      )
    ).toBeDefined();
    expect(
      screen.getByText('Sobriété et isolation des bâtiments (tertiaire)')
    ).toBeDefined();
    expect(screen.getByText('Exemplarité interne')).toBeDefined();
  });

  it('masque les badges de levier et de catégorie sur demande, en gardant le titre', () => {
    render(
      <ActionDeReferenceCard
        action={isolationComblesAction}
        updateAccess={{ status: 'forbidden' }}
        interest={noInterest}
        showLevierAndCategorieBadges={false}
      />
    );

    expect({
      titre: screen.queryByRole('heading', {
        name: 'Isoler les combles perdus des bâtiments communaux',
      }),
      levier: screen.queryByText(
        'Sobriété et isolation des bâtiments (tertiaire)'
      ),
      categorie: screen.queryByText('Exemplarité interne'),
    }).toEqual({
      titre: expect.anything(),
      levier: null,
      categorie: null,
    });
  });

  it('montre une description longue en entier, sans la tronquer', () => {
    render(
      <ActionDeReferenceCard
        action={longDescriptionAction}
        updateAccess={{ status: 'forbidden' }}
        interest={noInterest}
      />
    );

    expect(
      screen.getByText(longDescriptionAction.description, {
        normalizer: keepWhitespace,
      })
    ).toBeDefined();
  });
});

describe('modification-reservee-super-admin', () => {
  it('sans droit de modification, la card ne porte aucun bouton de modification', () => {
    render(
      <ActionDeReferenceCard
        action={isolationComblesAction}
        updateAccess={{ status: 'forbidden' }}
        interest={noInterest}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'Isoler les combles perdus des bâtiments communaux',
      })
    ).toBeDefined();
    expect(
      screen.queryByRole('button', { name: /Modifier l'action/ })
    ).toBeNull();
  });

  it("avec le droit de modification, le bouton « Modifier l'action » transmet l'action de la card", () => {
    const onUpdate = vi.fn();
    render(
      <ActionDeReferenceCard
        action={isolationComblesAction}
        updateAccess={{ status: 'allowed', onUpdate }}
        interest={noInterest}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: "Modifier l'action « Isoler les combles perdus des bâtiments communaux »",
      })
    );

    expect(onUpdate.mock.calls).toEqual([[isolationComblesAction]]);
  });
});
