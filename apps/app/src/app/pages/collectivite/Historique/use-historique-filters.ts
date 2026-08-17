import { useQueryStates } from 'nuqs';
import {
  Filters,
  filtersParsers,
  filtersUrlKeys,
  SetFilters,
  withPageReset,
} from './filters';

/**
 * Les filtres de l'historique, synchronisés avec l'URL. Seul point
 * d'écriture : la réinitialisation de pagination y est appliquée pour tous
 * les appelants.
 */
export const useHistoriqueFilters = (): [Filters, SetFilters] => {
  const [filters, setQueryStates] = useQueryStates(filtersParsers, {
    urlKeys: filtersUrlKeys,
  });

  const setFilters: SetFilters = (patch) => {
    void setQueryStates(patch === null ? null : withPageReset(patch));
  };

  return [filters, setFilters];
};
