import { LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { type JSX, useState } from 'react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';
import type {
  ActionsDeReferenceFiltersProps,
  ActionsDeReferenceSearch,
} from './actions-de-reference.contract';
import { ActionsDeReferenceFilters } from './actions-de-reference.filters';

const SEARCH_BAR = 'Rechercher une action de référence';
const LEVIERS_GROUP = 'Leviers';
const CATEGORIES_GROUP = 'Catégories';
const SORT_GROUP = 'Trier par';
const OPEN_MENU_BUTTON = 'ouvrir le menu';
const SEARCH_DEBOUNCE_IN_MS = 500;

const emptySearch: ActionsDeReferenceSearch = {
  searchedText: '',
  leviers: [],
  categories: [],
  sortBy: 'titre',
};

type OnSearchChange = ActionsDeReferenceFiltersProps['onSearchChange'];

type RenderedFilters = {
  readonly onSearchChange: Mock<OnSearchChange>;
  readonly listProposedLabels: () => readonly (string | null)[];
};

const FiltersKeepingTheSearch = ({
  initialSearch,
  onSearchChange,
}: {
  readonly initialSearch: ActionsDeReferenceSearch;
  readonly onSearchChange: OnSearchChange;
}): JSX.Element => {
  const [search, setSearch] = useState(initialSearch);
  return (
    <ActionsDeReferenceFilters
      search={search}
      onSearchChange={(changes) => {
        onSearchChange(changes);
        setSearch((previousSearch) => ({ ...previousSearch, ...changes }));
      }}
    />
  );
};

const renderFilters = (
  search: Partial<ActionsDeReferenceSearch> = {}
): RenderedFilters => {
  const onSearchChange = vi.fn<OnSearchChange>();
  const { container } = render(
    <FiltersKeepingTheSearch
      initialSearch={{ ...emptySearch, ...search }}
      onSearchChange={onSearchChange}
    />
  );
  const isProposedOption = (element: HTMLElement): boolean =>
    element instanceof HTMLButtonElement && !container.contains(element);
  return {
    onSearchChange,
    listProposedLabels: () =>
      screen
        .getAllByRole('button')
        .filter(isProposedOption)
        .map((button) => button.textContent),
  };
};

const getSearchBar = (): HTMLElement =>
  screen.getByRole('searchbox', { name: SEARCH_BAR });

const openMenuOf = (groupName: string): void => {
  fireEvent.click(
    within(screen.getByRole('group', { name: groupName })).getByRole('button', {
      name: OPEN_MENU_BUTTON,
    })
  );
};

const chooseOption = (label: string): void => {
  fireEvent.click(screen.getByRole('button', { name: label }));
};

afterEach(() => {
  vi.useRealTimers();
});

describe('rechercher-actions', () => {
  it('affiche le texte cherché dans la barre de recherche', () => {
    renderFilters({ searchedText: 'combles' });

    expect(getSearchBar()).toHaveProperty('value', 'combles');
  });

  it('transmet le texte saisi dans la barre de recherche', () => {
    vi.useFakeTimers();
    const { onSearchChange } = renderFilters();

    fireEvent.change(getSearchBar(), { target: { value: 'Combles isolés' } });
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_IN_MS);
    });

    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith({
      searchedText: 'Combles isolés',
    });
  });

  it('attend 500 ms sans saisie avant de transmettre le texte', () => {
    vi.useFakeTimers();
    const { onSearchChange } = renderFilters();

    fireEvent.change(getSearchBar(), { target: { value: 'comb' } });
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_IN_MS - 1);
    });

    expect(getSearchBar()).toHaveProperty('value', 'comb');
    expect(onSearchChange).not.toHaveBeenCalled();
  });

  it('vide la barre de recherche quand la recherche est remise à zéro', () => {
    const { rerender } = render(
      <ActionsDeReferenceFilters
        search={{ ...emptySearch, searchedText: 'combles' }}
        onSearchChange={vi.fn<OnSearchChange>()}
      />
    );

    rerender(
      <ActionsDeReferenceFilters
        search={emptySearch}
        onSearchChange={vi.fn<OnSearchChange>()}
      />
    );

    expect(getSearchBar()).toHaveProperty('value', '');
  });

  it('ne transmet pas le texte saisi quand la recherche est remise à zéro avant 500 ms', () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn<OnSearchChange>();
    const { rerender } = render(
      <ActionsDeReferenceFilters
        search={{ ...emptySearch, searchedText: 'combles' }}
        onSearchChange={onSearchChange}
      />
    );

    fireEvent.change(getSearchBar(), { target: { value: 'combles isolés' } });
    rerender(
      <ActionsDeReferenceFilters
        search={emptySearch}
        onSearchChange={onSearchChange}
      />
    );
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_IN_MS);
    });

    expect(getSearchBar()).toHaveProperty('value', '');
    expect(onSearchChange).not.toHaveBeenCalled();
  });

  it('garde la saisie reprise avant que le texte transmis ne revienne', () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn<OnSearchChange>();
    const { rerender } = render(
      <ActionsDeReferenceFilters
        search={emptySearch}
        onSearchChange={onSearchChange}
      />
    );

    fireEvent.change(getSearchBar(), { target: { value: 'comb' } });
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_IN_MS);
    });
    fireEvent.change(getSearchBar(), { target: { value: 'combl' } });
    rerender(
      <ActionsDeReferenceFilters
        search={{ ...emptySearch, searchedText: 'comb' }}
        onSearchChange={onSearchChange}
      />
    );
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_IN_MS);
    });

    expect(getSearchBar()).toHaveProperty('value', 'combl');
    expect(onSearchChange.mock.calls).toEqual([
      [{ searchedText: 'comb' }],
      [{ searchedText: 'combl' }],
    ]);
  });
});

describe('filtrer-leviers-categories', () => {
  it('propose les 29 leviers par leur libellé', () => {
    const { listProposedLabels } = renderFilters();

    openMenuOf(LEVIERS_GROUP);

    const proposedLabels = listProposedLabels();
    expect({
      count: proposedLabels.length,
      first: proposedLabels.at(0),
      last: proposedLabels.at(-1),
    }).toEqual({
      count: 29,
      first: 'Changement chaudières fioul + rénovation (résidentiel)',
      last: 'Réseaux de chaleur décarbonés',
    });
  });

  it('propose les 6 catégories par leur libellé', () => {
    const { listProposedLabels } = renderFilters();

    openMenuOf(CATEGORIES_GROUP);

    expect(listProposedLabels()).toEqual([
      'Aménagement & infrastructures',
      'Réglementation & planification',
      'Financement & fiscalité',
      'Gouvernance & partenariats',
      'Exemplarité interne',
      'Sensibilisation & accompagnement',
    ]);
  });

  it('transmet plusieurs leviers choisis', () => {
    const { onSearchChange } = renderFilters();

    openMenuOf(LEVIERS_GROUP);
    chooseOption(LEVIER_NOM_BY_ID.chaudieres_gaz_renovation_residentiel);
    chooseOption(LEVIER_NOM_BY_ID.chaudieres_fioul_renovation_residentiel);

    expect(onSearchChange.mock.calls).toEqual([
      [{ leviers: ['chaudieres_gaz_renovation_residentiel'] }],
      [
        {
          leviers: [
            'chaudieres_fioul_renovation_residentiel',
            'chaudieres_gaz_renovation_residentiel',
          ],
        },
      ],
    ]);
  });

  it('transmet plusieurs catégories choisies', () => {
    const { onSearchChange } = renderFilters();

    openMenuOf(CATEGORIES_GROUP);
    chooseOption('Exemplarité interne');
    chooseOption('Aménagement & infrastructures');

    expect(onSearchChange.mock.calls).toEqual([
      [{ categories: ['exemplarite'] }],
      [{ categories: ['amenagement', 'exemplarite'] }],
    ]);
  });

  it('transmet une liste vide quand le dernier levier choisi est retiré', () => {
    const { onSearchChange } = renderFilters({
      leviers: ['chaudieres_fioul_renovation_residentiel'],
    });

    openMenuOf(LEVIERS_GROUP);
    chooseOption(LEVIER_NOM_BY_ID.chaudieres_fioul_renovation_residentiel);

    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith({ leviers: [] });
  });

  it('transmet une liste vide quand la dernière catégorie choisie est retirée', () => {
    const { onSearchChange } = renderFilters({ categories: ['exemplarite'] });

    openMenuOf(CATEGORIES_GROUP);
    chooseOption('Exemplarité interne');

    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith({ categories: [] });
  });
});

describe('trier-actions', () => {
  it('propose le tri par titre, par levier et par catégorie', () => {
    const { listProposedLabels } = renderFilters();

    openMenuOf(SORT_GROUP);

    expect(listProposedLabels()).toEqual(['Titre', 'Levier', 'Catégorie']);
  });

  it('affiche le tri en cours', () => {
    renderFilters({ sortBy: 'levier' });

    expect(
      within(screen.getByRole('group', { name: SORT_GROUP })).getByRole(
        'button',
        { name: OPEN_MENU_BUTTON }
      ).textContent
    ).toBe('Levier');
  });

  it('transmet le tri choisi', () => {
    const { onSearchChange } = renderFilters();

    openMenuOf(SORT_GROUP);
    chooseOption('Catégorie');

    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith({
      sortBy: 'categorie',
    });
  });

  it('ne transmet rien quand le tri en cours est choisi à nouveau', () => {
    const { onSearchChange } = renderFilters({ sortBy: 'levier' });

    openMenuOf(SORT_GROUP);
    chooseOption('Levier');

    expect(onSearchChange).not.toHaveBeenCalled();
  });
});
