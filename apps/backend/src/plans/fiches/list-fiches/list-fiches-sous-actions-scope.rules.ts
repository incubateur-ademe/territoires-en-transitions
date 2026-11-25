import {
  ListFichesRequestFilters,
  sousActionFieldFilterKeys,
  sousActionPeriodeFilterKeys,
} from '@tet/domain/plans';
import { omit, pick } from 'es-toolkit';

export type SousActionFieldFilters = Pick<
  ListFichesRequestFilters,
  | (typeof sousActionFieldFilterKeys)[number]
  | (typeof sousActionPeriodeFilterKeys)[number]
>;

const isPeriodeOnDateFin = (filters: ListFichesRequestFilters) =>
  filters.typePeriode === 'fin';

/**
 * Répartit les filtres entre ceux qui portent sur l'action seule et ceux qui
 * portent sur les champs propres à une sous-action.
 */
export const splitFiltersBySousActionScope = (
  filters: ListFichesRequestFilters
): {
  actionFilters: ListFichesRequestFilters;
  sousActionFieldFilters: SousActionFieldFilters;
} => {
  const sousActionKeys: (keyof SousActionFieldFilters)[] = isPeriodeOnDateFin(
    filters
  )
    ? [...sousActionFieldFilterKeys, ...sousActionPeriodeFilterKeys]
    : [...sousActionFieldFilterKeys];

  return {
    actionFilters: omit(filters, [...sousActionKeys, 'withSousActionsMatches']),
    sousActionFieldFilters: pick(filters, sousActionKeys),
  };
};

/**
 * Le périmètre « Actions et sous-actions » ne vaut que pour une liste
 * d'actions : avec `onlyChildren` ou `parentsId`, les lignes listées sont déjà
 * des sous-actions.
 */
export const isSousActionsMatchingEnabled = (
  filters: ListFichesRequestFilters
): boolean =>
  Boolean(
    filters.withSousActionsMatches &&
      !filters.onlyChildren &&
      !filters.parentsId?.length
  );
