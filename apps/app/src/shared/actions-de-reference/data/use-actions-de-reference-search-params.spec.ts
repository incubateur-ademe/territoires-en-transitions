import { act, renderHook, waitFor } from '@testing-library/react';
import {
  withNuqsTestingAdapter,
  type UrlUpdateEvent,
} from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';
import type {
  ActionsDeReferenceSearch,
  ActionsDeReferenceSearchParams,
} from '../actions-de-reference.contract';
import { useActionsDeReferenceSearchParams } from './use-actions-de-reference-search-params';

type WrittenUrl = {
  readonly query: Record<string, string>;
  readonly history: UrlUpdateEvent['options']['history'];
};

type RenderedSearchParams = {
  readonly readSearch: () => ActionsDeReferenceSearch;
  readonly changeSearch: ActionsDeReferenceSearchParams['changeSearch'];
  readonly changeSearchWithinSameRender: (
    successiveChanges: readonly Partial<ActionsDeReferenceSearch>[]
  ) => void;
  readonly resetSearch: ActionsDeReferenceSearchParams['resetSearch'];
  readonly readUrlWriteCount: () => number;
  readonly waitForUrlWriteCount: (count: number) => Promise<WrittenUrl>;
};

const toWrittenUrl = (event: UrlUpdateEvent): WrittenUrl => ({
  query: Object.fromEntries(event.searchParams),
  history: event.options.history,
});

const waitForPendingUrlWrite = (): Promise<void> =>
  act(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      })
  );

const renderSearchParamsAt = (
  searchParams: string,
  { hasUrlMemory }: { readonly hasUrlMemory: boolean } = {
    hasUrlMemory: true,
  }
): RenderedSearchParams => {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const { result } = renderHook(() => useActionsDeReferenceSearchParams(), {
    wrapper: withNuqsTestingAdapter({
      searchParams,
      onUrlUpdate,
      hasMemory: hasUrlMemory,
    }),
  });

  return {
    readSearch: () => result.current.search,
    changeSearch: (changes) => {
      act(() => {
        result.current.changeSearch(changes);
      });
    },
    changeSearchWithinSameRender: (successiveChanges) => {
      const { changeSearch } = result.current;
      act(() => {
        successiveChanges.forEach((changes) => changeSearch(changes));
      });
    },
    resetSearch: () => {
      act(() => {
        result.current.resetSearch();
      });
    },
    readUrlWriteCount: () => onUrlUpdate.mock.calls.length,
    waitForUrlWriteCount: (count) =>
      waitFor(() => {
        expect(onUrlUpdate).toHaveBeenCalledTimes(count);
        return toWrittenUrl(onUrlUpdate.mock.calls[count - 1][0]);
      }),
  };
};

describe('recherche-partageable-par-url', () => {
  it("lit le texte, les leviers, les catégories et le tri depuis les paramètres de l'URL", () => {
    const { readSearch } = renderSearchParamsAt(
      '?searchedText=combles&leviers=covoiturage,gestion_haies&categories=financement,gouvernance&sortBy=levier'
    );

    expect(readSearch()).toEqual({
      searchedText: 'combles',
      leviers: ['covoiturage', 'gestion_haies'],
      categories: ['financement', 'gouvernance'],
      sortBy: 'levier',
    });
  });

  it('sans paramètre, la recherche est vide et triée par titre', () => {
    const { readSearch } = renderSearchParamsAt('');

    expect(readSearch()).toEqual({
      searchedText: '',
      leviers: [],
      categories: [],
      sortBy: 'titre',
    });
  });

  it("écrit chaque changement de recherche dans l'URL en remplaçant l'entrée d'historique", async () => {
    const { readSearch, changeSearch, waitForUrlWriteCount } =
      renderSearchParamsAt('');

    changeSearch({ searchedText: 'Combles isolés' });
    const firstWrite = await waitForUrlWriteCount(1);
    changeSearch({
      leviers: ['covoiturage', 'gestion_haies'],
      categories: ['financement'],
      sortBy: 'categorie',
    });
    const secondWrite = await waitForUrlWriteCount(2);

    expect({ firstWrite, secondWrite, search: readSearch() }).toEqual({
      firstWrite: {
        query: { searchedText: 'Combles isolés' },
        history: 'replace',
      },
      secondWrite: {
        query: {
          searchedText: 'Combles isolés',
          leviers: 'covoiturage,gestion_haies',
          categories: 'financement',
          sortBy: 'categorie',
        },
        history: 'replace',
      },
      search: {
        searchedText: 'Combles isolés',
        leviers: ['covoiturage', 'gestion_haies'],
        categories: ['financement'],
        sortBy: 'categorie',
      },
    });
  });

  it('cumule deux changements demandés coup sur coup', async () => {
    const { readSearch, changeSearchWithinSameRender, waitForUrlWriteCount } =
      renderSearchParamsAt('?sortBy=levier');

    changeSearchWithinSameRender([
      { searchedText: 'combles' },
      { leviers: ['covoiturage'] },
    ]);
    const write = await waitForUrlWriteCount(1);

    expect({ write, search: readSearch() }).toEqual({
      write: {
        query: {
          searchedText: 'combles',
          leviers: 'covoiturage',
          sortBy: 'levier',
        },
        history: 'replace',
      },
      search: {
        searchedText: 'combles',
        leviers: ['covoiturage'],
        categories: [],
        sortBy: 'levier',
      },
    });
  });

  it('cumule des changements de plusieurs filtres demandés coup sur coup', async () => {
    const { readSearch, changeSearchWithinSameRender, waitForUrlWriteCount } =
      renderSearchParamsAt('?view=grid&sortBy=levier');

    changeSearchWithinSameRender([
      { searchedText: 'combles', leviers: ['covoiturage'] },
      { categories: ['financement'] },
      { sortBy: 'titre' },
    ]);
    const write = await waitForUrlWriteCount(1);

    expect({ write, search: readSearch() }).toEqual({
      write: {
        query: {
          view: 'grid',
          searchedText: 'combles',
          leviers: 'covoiturage',
          categories: 'financement',
        },
        history: 'replace',
      },
      search: {
        searchedText: 'combles',
        leviers: ['covoiturage'],
        categories: ['financement'],
        sortBy: 'titre',
      },
    });
  });

  it("laisse dans l'URL un filtre passé sans valeur", async () => {
    const { readSearch, changeSearch, waitForUrlWriteCount } =
      renderSearchParamsAt('?searchedText=combles&sortBy=levier');

    changeSearch({ searchedText: undefined, leviers: ['covoiturage'] });
    const write = await waitForUrlWriteCount(1);

    expect({ write, search: readSearch() }).toEqual({
      write: {
        query: {
          searchedText: 'combles',
          leviers: 'covoiturage',
          sortBy: 'levier',
        },
        history: 'replace',
      },
      search: {
        searchedText: 'combles',
        leviers: ['covoiturage'],
        categories: [],
        sortBy: 'levier',
      },
    });
  });

  it("retire de l'URL un filtre vidé et le tri par titre", async () => {
    const { readSearch, changeSearch, waitForUrlWriteCount } =
      renderSearchParamsAt(
        '?searchedText=combles&leviers=covoiturage&categories=financement&sortBy=levier'
      );

    changeSearch({ leviers: [], categories: [], sortBy: 'titre' });
    const write = await waitForUrlWriteCount(1);

    expect({ write, search: readSearch() }).toEqual({
      write: { query: { searchedText: 'combles' }, history: 'replace' },
      search: {
        searchedText: 'combles',
        leviers: [],
        categories: [],
        sortBy: 'titre',
      },
    });
  });
});

describe('filtre-url-inconnu-ignore', () => {
  it('ignore une valeur inconnue et applique le reste de la recherche', () => {
    const { readSearch } = renderSearchParamsAt(
      '?searchedText=combles&leviers=covoiturage,levier_inconnu&categories=subvention&sortBy=prix'
    );

    expect(readSearch()).toEqual({
      searchedText: 'combles',
      leviers: ['covoiturage'],
      categories: [],
      sortBy: 'titre',
    });
  });

  it("réécrit l'URL sans la valeur inconnue dès l'affichage", async () => {
    const { waitForUrlWriteCount } = renderSearchParamsAt(
      '?view=grid&searchedText=combles&leviers=covoiturage,levier_inconnu&categories=subvention&sortBy=prix',
      { hasUrlMemory: false }
    );

    const write = await waitForUrlWriteCount(1);

    expect(write).toEqual({
      query: { view: 'grid', searchedText: 'combles', leviers: 'covoiturage' },
      history: 'replace',
    });
  });

  it('ne réécrit pas une URL dont toutes les valeurs sont connues', async () => {
    const { readUrlWriteCount } = renderSearchParamsAt(
      '?view=grid&searchedText=combles&leviers=covoiturage,gestion_haies&categories=financement&sortBy=levier',
      { hasUrlMemory: false }
    );

    await waitForPendingUrlWrite();

    expect(readUrlWriteCount()).toBe(0);
  });
});

describe('aucune-action-trouvee', () => {
  it('resetSearch efface le texte, les leviers et les catégories et ramène le tri au titre', async () => {
    const { readSearch, resetSearch, waitForUrlWriteCount } =
      renderSearchParamsAt(
        '?searchedText=combles&leviers=covoiturage&categories=financement&sortBy=levier'
      );

    resetSearch();
    const write = await waitForUrlWriteCount(1);

    expect({ write, search: readSearch() }).toEqual({
      write: { query: {}, history: 'replace' },
      search: {
        searchedText: '',
        leviers: [],
        categories: [],
        sortBy: 'titre',
      },
    });
  });
});
