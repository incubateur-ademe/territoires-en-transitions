import {
  actionDeReferenceSortFieldEnumValues,
  categorieActionEnumValues,
  levierIdEnumValues,
} from '@tet/domain/shared';
import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs';
import type {
  ActionsDeReferenceSearch,
  CleanSearchParams,
} from '../actions-de-reference.contract';

const searchParsers = {
  searchedText: parseAsString.withDefault(''),
  leviers: parseAsArrayOf(parseAsStringLiteral(levierIdEnumValues)).withDefault(
    []
  ),
  categories: parseAsArrayOf(
    parseAsStringLiteral(categorieActionEnumValues)
  ).withDefault([]),
  sortBy: parseAsStringLiteral(
    actionDeReferenceSortFieldEnumValues
  ).withDefault('titre'),
};

type SearchParamKey = keyof typeof searchParsers;

const parseSearch: (searchParams: URLSearchParams) => ActionsDeReferenceSearch =
  createLoader(searchParsers);

const serializeSearch = createSerializer(searchParsers);

const toSearchParams = (
  searchParams: URLSearchParams,
  search: ActionsDeReferenceSearch
): URLSearchParams =>
  new URLSearchParams(
    serializeSearch(searchParams, {
      searchedText: search.searchedText,
      leviers: [...search.leviers],
      categories: [...search.categories],
      sortBy: search.sortBy,
    })
  );

const cleanSearchParams: CleanSearchParams = (searchParams) =>
  toSearchParams(searchParams, parseSearch(searchParams));

export { cleanSearchParams, parseSearch, toSearchParams };
export type { SearchParamKey };
