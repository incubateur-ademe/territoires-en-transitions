import { appLabels } from '@/app/labels/catalog';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  UrlKeys,
} from 'nuqs';
import { HistoriqueType, historiqueTypeEnumValues } from './types';

export type TFilterType = HistoriqueType;

export const filtresTypeOptions: { value: TFilterType; label: string }[] = [
  { value: 'action_statut', label: appLabels.historiqueActionStatut },
  { value: 'action_precision', label: appLabels.historiqueActionPrecision },
  { value: 'reponse', label: appLabels.historiqueReponse },
  {
    value: 'justification',
    label: appLabels.historiqueJustification,
  },
];

export type TFilters = {
  /** par membres de la collectivite */
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

/** Parsers nuqs pour les parametres de recherche URL de l'historique */
export const filtersParsers = {
  modifiedBy: parseAsArrayOf(parseAsString),
  types: parseAsArrayOf(parseAsStringLiteral(historiqueTypeEnumValues)),
  startDate: parseAsString,
  endDate: parseAsString,
  page: parseAsInteger,
};

/** Mapping noms -> cles URL courtes */
export const filtersUrlKeys: UrlKeys<typeof filtersParsers> = {
  modifiedBy: 'm',
  types: 't',
  startDate: 's',
  endDate: 'e',
  page: 'p',
} as const;
