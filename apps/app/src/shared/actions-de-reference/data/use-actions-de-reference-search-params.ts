import { omitBy } from 'es-toolkit';
import { parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useEffect, useMemo } from 'react';
import type {
  ActionsDeReferenceSearch,
  UseActionsDeReferenceSearchParams,
} from '../actions-de-reference.contract';
import {
  cleanSearchParams,
  parseSearch,
  type SearchParamKey,
  toSearchParams,
} from './clean-search-params';

type UrlSearch = Readonly<Record<SearchParamKey, string | null>>;

const urlSearchParsers: Readonly<Record<SearchParamKey, typeof parseAsString>> =
  {
    searchedText: parseAsString,
    leviers: parseAsString,
    categories: parseAsString,
    sortBy: parseAsString,
  };

const emptySearch = parseSearch(new URLSearchParams());

const toRawSearchParams = (urlSearch: UrlSearch): URLSearchParams =>
  new URLSearchParams(
    Object.entries(urlSearch).flatMap(([key, value]) =>
      value === null ? [] : [[key, value]]
    )
  );

const toUrlSearch = (searchParams: URLSearchParams): UrlSearch => ({
  searchedText: searchParams.get('searchedText'),
  leviers: searchParams.get('leviers'),
  categories: searchParams.get('categories'),
  sortBy: searchParams.get('sortBy'),
});

const toChangedUrlSearch = (
  changes: Partial<ActionsDeReferenceSearch>
): Partial<UrlSearch> => {
  const providedChanges = omitBy(changes, (value) => value === undefined);
  const urlSearch = toUrlSearch(
    toSearchParams(new URLSearchParams(), {
      ...emptySearch,
      ...providedChanges,
    })
  );
  return Object.fromEntries(
    Object.entries(urlSearch).filter(([key]) => key in providedChanges)
  );
};

const useActionsDeReferenceSearchParams: UseActionsDeReferenceSearchParams =
  () => {
    const [urlSearch, setUrlSearch] = useQueryStates(urlSearchParsers, {
      history: 'replace',
    });

    const searchQuery = toRawSearchParams(urlSearch).toString();

    const search = useMemo(
      (): ActionsDeReferenceSearch =>
        parseSearch(new URLSearchParams(searchQuery)),
      [searchQuery]
    );

    useEffect(() => {
      const cleanedSearchQuery = cleanSearchParams(
        new URLSearchParams(searchQuery)
      ).toString();
      const isUrlAlreadyClean = cleanedSearchQuery === searchQuery;
      if (isUrlAlreadyClean) {
        return;
      }
      void setUrlSearch(toUrlSearch(new URLSearchParams(cleanedSearchQuery)));
    }, [searchQuery, setUrlSearch]);

    const changeSearch = useCallback(
      (changes: Partial<ActionsDeReferenceSearch>): void => {
        void setUrlSearch(toChangedUrlSearch(changes));
      },
      [setUrlSearch]
    );

    const resetSearch = useCallback((): void => {
      void setUrlSearch(null);
    }, [setUrlSearch]);

    return { search, changeSearch, resetSearch };
  };

export { useActionsDeReferenceSearchParams };
