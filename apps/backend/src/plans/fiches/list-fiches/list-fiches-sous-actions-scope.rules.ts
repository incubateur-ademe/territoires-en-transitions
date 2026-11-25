import {
  ListFichesRequestFilters,
  ListFichesRequestFiltersKeys,
} from '@tet/domain/plans';
import { omit, pick } from 'es-toolkit';

/**
 * Filtres qui portent sur les champs qu'on saisit sur une sous-action : titre,
 * description, statut, pilotes et date de fin. Les autres filtres (priorité,
 * thématiques, services, tags, budget, indicateurs, mesures, notes…) portent
 * toujours sur l'action : la sous-action en hérite.
 */
const sousActionFieldFilterKeys = [
  'statuts',
  'noStatut',
  'utilisateurPiloteIds',
  'personnePiloteIds',
  'noPilote',
  'texteNomOuDescription',
  'noTitre',
  'noDescription',
  'hasDateDeFinPrevisionnelle',
] as const satisfies readonly ListFichesRequestFiltersKeys[];

/** La période ne porte sur la sous-action que si elle vise la date de fin. */
const periodeFilterKeys = [
  'typePeriode',
  'debutPeriode',
  'finPeriode',
] as const satisfies readonly ListFichesRequestFiltersKeys[];

export type SousActionFieldFilters = Pick<
  ListFichesRequestFilters,
  | (typeof sousActionFieldFilterKeys)[number]
  | (typeof periodeFilterKeys)[number]
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
    ? [...sousActionFieldFilterKeys, ...periodeFilterKeys]
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
