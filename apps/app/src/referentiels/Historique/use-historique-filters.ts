import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  UrlKeys,
  useQueryStates,
} from 'nuqs';
import { Filters, SetFilters, withPageReset } from './filters';
import { historiqueTypeEnumValues } from '@tet/domain/referentiels';

/** Parsers nuqs pour les parametres de recherche URL de l'historique */
const filtersParsers = {
  modifiedBy: parseAsArrayOf(parseAsString),
  types: parseAsArrayOf(parseAsStringLiteral(historiqueTypeEnumValues)),
  startDate: parseAsString,
  endDate: parseAsString,
  page: parseAsInteger,
};

/** Mapping noms -> cles URL courtes */
const filtersUrlKeys: UrlKeys<typeof filtersParsers> = {
  modifiedBy: 'm',
  types: 't',
  startDate: 's',
  endDate: 'e',
  page: 'p',
} as const;

/**
 * Les filtres de l'historique, synchronisés avec l'URL. Seul point d'écriture :
 * la réinitialisation de pagination y est appliquée pour tous les appelants.
 *
 * À appeler depuis le composant hôte le plus haut, jamais depuis les
 * composants de filtre : ils reçoivent `filters` et `onFiltersChange`.
 */
export const useHistoriqueFilters = (): [Filters, SetFilters] => {
  const [filters, setQueryStates] = useQueryStates(filtersParsers, {
    urlKeys: filtersUrlKeys,
  });

  const setFilters: SetFilters = (patch) => {
    const nextPatch = patch === null ? null : withPageReset(patch);
    void setQueryStates(nextPatch);
  };

  return [filters, setFilters];
};
