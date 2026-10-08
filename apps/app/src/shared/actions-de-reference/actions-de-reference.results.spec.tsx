import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aireCovoiturageAction,
  isolationComblesAction,
  longDescriptionAction,
} from './actions-de-reference.fixture';
import { ActionsDeReferenceResults } from './actions-de-reference.results';

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: (): number => 5596,
}));

const EMPTY_STATE_TITLE =
  'Aucune action de référence ne correspond à votre recherche';

const ignoreResetSearch = (): void => undefined;

afterEach(cleanup);

describe('liste-en-chargement', () => {
  it('montre un indicateur de chargement à la place des cards', () => {
    render(
      <ActionsDeReferenceResults
        list={{ status: 'loading' }}
        updateAccess={{ status: 'forbidden' }}
        onResetSearch={ignoreResetSearch}
      />
    );

    expect(
      within(screen.getByRole('status')).getByText('Chargement en cours...')
    ).toBeDefined();
    expect(screen.queryAllByRole('listitem')).toEqual([]);
  });
});

describe('liste-en-erreur', () => {
  it("montre une carte d'erreur à la place des cards", () => {
    render(
      <ActionsDeReferenceResults
        list={{ status: 'error', retry: vi.fn() }}
        updateAccess={{ status: 'forbidden' }}
        onResetSearch={ignoreResetSearch}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Une erreur est survenue' })
    ).toBeDefined();
    expect(screen.queryAllByRole('listitem')).toEqual([]);
  });

  it('le bouton « Réessayer » relance le chargement', () => {
    const retry = vi.fn();
    render(
      <ActionsDeReferenceResults
        list={{ status: 'error', retry }}
        updateAccess={{ status: 'forbidden' }}
        onResetSearch={ignoreResetSearch}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});

describe('aucune-action-trouvee', () => {
  it("une liste chargée sans action montre l'état vide et le bouton « Effacer les filtres »", () => {
    render(
      <ActionsDeReferenceResults
        list={{ status: 'loaded', actions: [] }}
        updateAccess={{ status: 'forbidden' }}
        onResetSearch={ignoreResetSearch}
      />
    );

    expect(
      screen.getByRole('heading', { name: EMPTY_STATE_TITLE })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Effacer les filtres' })
    ).toBeDefined();
    expect(screen.queryAllByRole('listitem')).toEqual([]);
  });

  it('le bouton « Effacer les filtres » demande la remise à zéro de la recherche', () => {
    const onResetSearch = vi.fn();
    render(
      <ActionsDeReferenceResults
        list={{ status: 'loaded', actions: [] }}
        updateAccess={{ status: 'forbidden' }}
        onResetSearch={onResetSearch}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Effacer les filtres' })
    );

    expect(onResetSearch).toHaveBeenCalledTimes(1);
  });
});

describe('aucune-action-en-base', () => {
  it('sans recherche ni filtre, une liste chargée sans action montre le même état vide, bouton compris', () => {
    const onResetSearch = vi.fn();
    render(
      <ActionsDeReferenceResults
        list={{ status: 'loaded', actions: [] }}
        updateAccess={{ status: 'allowed', onUpdate: vi.fn() }}
        onResetSearch={onResetSearch}
      />
    );

    expect(
      screen.getByRole('heading', { name: EMPTY_STATE_TITLE })
    ).toBeDefined();

    fireEvent.click(
      screen.getByRole('button', { name: 'Effacer les filtres' })
    );

    expect(onResetSearch).toHaveBeenCalledTimes(1);
  });
});

describe('card-affiche-action-entiere', () => {
  it("montre une card par action, dans l'ordre reçu", () => {
    render(
      <ActionsDeReferenceResults
        list={{
          status: 'loaded',
          actions: [
            longDescriptionAction,
            aireCovoiturageAction,
            isolationComblesAction,
          ],
        }}
        updateAccess={{ status: 'forbidden' }}
        onResetSearch={ignoreResetSearch}
      />
    );

    const cardTitles = screen
      .getAllByRole('listitem')
      .map((card) => within(card).getByRole('heading').textContent);

    expect(cardTitles).toEqual([
      'Planter et gérer durablement les haies bocagères',
      'Aménager des aires de covoiturage',
      'Isoler les combles perdus des bâtiments communaux',
    ]);
  });
});

describe('modification-reservee-super-admin', () => {
  it('transmet le droit de modification à chaque card', () => {
    const onUpdate = vi.fn();
    render(
      <ActionsDeReferenceResults
        list={{
          status: 'loaded',
          actions: [aireCovoiturageAction, isolationComblesAction],
        }}
        updateAccess={{ status: 'allowed', onUpdate }}
        onResetSearch={ignoreResetSearch}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: "Modifier l'action « Aménager des aires de covoiturage »",
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: "Modifier l'action « Isoler les combles perdus des bâtiments communaux »",
      })
    );

    expect(onUpdate.mock.calls).toEqual([
      [aireCovoiturageAction],
      [isolationComblesAction],
    ]);
  });
});
