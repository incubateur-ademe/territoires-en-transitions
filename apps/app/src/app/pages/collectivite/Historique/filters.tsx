import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  UrlKeys,
} from 'nuqs';
import { HistoriqueType, historiqueTypeEnumValues } from './types';

export const NB_ITEMS_PER_PAGE = 10;

export type TFilterType = HistoriqueType;

export const filtresTypeOptions: { value: TFilterType; label: string }[] = [
  { value: 'action_statut', label: 'Mesure : statut' },
  { value: 'action_precision', label: 'Mesure : texte' },
  { value: 'reponse', label: 'Caractéristique de la collectivité : réponse' },
  {
    value: 'justification',
    label: 'Caractéristique de la collectivité : justification',
  },
];

export type TFilters = {
  /** par membres de la collectivité */
  modifiedBy: string[] | null;
  /** Par type d'historique */
  types: TFilterType[] | null;
  /** par plage de dates */
  startDate: string | null;
  endDate: string | null;
  /** index de la page voulue */
  page: number | null;
};

export type TSetFilters = (newFilter: TFilters) => void;

export type TFiltreProps = {
  filters: TFilters;
  setFilters: TSetFilters;
};

/** Parsers nuqs pour les paramètres de recherche URL de l'historique */
export const filtersParsers = {
  modifiedBy: parseAsArrayOf(parseAsString),
  types: parseAsArrayOf(parseAsStringLiteral(historiqueTypeEnumValues)),
  startDate: parseAsString,
  endDate: parseAsString,
  page: parseAsInteger,
};

/** Mapping noms → clés URL courtes */
export const filtersUrlKeys: UrlKeys<typeof filtersParsers> = {
  modifiedBy: 'm',
  types: 't',
  startDate: 's',
  endDate: 'e',
  page: 'p',
} as const;
