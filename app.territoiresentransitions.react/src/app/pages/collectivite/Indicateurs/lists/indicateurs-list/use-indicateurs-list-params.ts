import { FetchFiltre } from '@/api/indicateurs';
import { indicateursNameToParams } from '@/app/app/pages/collectivite/Indicateurs/lists/utils';
import { useSearchParams } from '@/app/core-logic/hooks/query';

export type SortBy = keyof Pick<FetchFiltre, 'estComplet' | 'text'>;

export type ListOptions = {
  sortBy: SortBy;
  displayGraphs: boolean;
  currentPage: number;
};

export const defaultListOptions = {
  sortBy: 'estComplet',
  displayGraphs: true,
  currentPage: 1,
} as const;

type SortByItem = {
  label: string;
  value: SortBy;
  direction: 'asc' | 'desc';
};

export const sortByCompletude = {
  label: 'Complétude',
  value: 'estComplet',
  direction: 'desc',
} as const;

export const sortByItems: SortByItem[] = [
  sortByCompletude,
  {
    label: 'Ordre alphabétique',
    value: 'text',
    direction: 'asc',
  },
] as const;

// correspondances entre le nom d'une option et un searchParam dans l'url
// (on préfixe les searchParams avec $ pour éviter une éventuelle collision avec les filtres)
const optionsNameToParams: Record<keyof ListOptions, string> = {
  sortBy: '$s',
  displayGraphs: '$g',
  currentPage: '$p',
} as const;

export type SearchParams = FetchFiltre & ListOptions;
export const searchParamsMap = {
  ...indicateursNameToParams,
  ...optionsNameToParams,
};

// notre `useSearchParams` parse par défaut les paramètres en Array<string>
// on transforme ici les paramètres dans le type attendu
const transformListOptions = (params: SearchParams) => {
  if (params.text && Array.isArray(params.text)) {
    params.text = params.text[0];
  }
  if (params.currentPage && Array.isArray(params.currentPage)) {
    params.currentPage = parseInt(params.currentPage[0], 10);
  }
  if (params.displayGraphs && Array.isArray(params.displayGraphs)) {
    params.displayGraphs = params.displayGraphs[0] === 'true';
  }
};

/** Gère les paramètres d'une liste d'indicateurs */
export const useIndicateursListParams = (
  pathName: string,
  defaultFilters: FetchFiltre,
  defaultOptions: ListOptions
) => {
  const defaultParams = { ...defaultFilters, ...defaultOptions };
  const [searchParams, setSearchParams] = useSearchParams<SearchParams>(
    pathName,
    defaultParams,
    searchParamsMap
  );
  transformListOptions(searchParams);
  return {
    defaultParams,
    searchParams,
    setSearchParams,
  };
};
