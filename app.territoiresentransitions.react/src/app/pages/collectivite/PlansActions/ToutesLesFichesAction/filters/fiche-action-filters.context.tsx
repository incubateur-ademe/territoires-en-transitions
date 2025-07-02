'use client';

import { useSearchParams } from '@/app/core-logic/hooks/query';
import { ListFichesRequestFilters as Filtres } from '@/domain/plans/fiches';
import { Event, useEventTracker } from '@/ui';
import { usePathname } from 'next/navigation';
import { createContext, ReactNode, useContext } from 'react';

/** Paramètres d'URL possibles pour les filtres de fiches action */
export type FicheActionParam =
  | 's'
  | 'prio'
  | 'ms'
  | 'text'
  | 'bp'
  | 'r'
  | 'i'
  | 'il'
  | 'ml'
  | 'fa'
  | 'pa'
  | 'ra'
  | 'up'
  | 'pp'
  | 'ur'
  | 'pt'
  | 'pr'
  | 'sp'
  | 'sv'
  | 'lt'
  | 't'
  | 'f'
  | 'c'
  | 'dd'
  | 'df'
  | 'ac'
  | 'p'
  | 'lf'
  | 'sort'
  | 'ssp'
  | 'sssp'
  | 'sss'
  | 'tp'
  | 'dp'
  | 'fp'
  | 'pe'
  | 'st'
  | 'ea'
  | 'pc'
  | 'ax'
  | 'np'
  | 'npr'
  | 'ma'
  | 'nr';

export const nameToparams: Record<
  keyof Filtres | 'sort' | 'page',
  FicheActionParam
> = {
  statuts: 's',
  priorites: 'prio',
  modifiedSince: 'ms',
  texteNomOuDescription: 'text',
  hasBudgetPrevisionnel: 'bp',
  restreint: 'r',
  hasIndicateurLies: 'il',
  hasMesuresLiees: 'ml',
  planActionIds: 'pa',
  ficheIds: 'fa',
  mesureIds: 'ra',
  linkedFicheIds: 'lf',
  utilisateurPiloteIds: 'up',
  personnePiloteIds: 'pp',
  utilisateurReferentIds: 'ur',
  partenaireIds: 'pt',
  personneReferenteIds: 'pr',
  structurePiloteIds: 'sp',
  servicePiloteIds: 'sv',
  libreTagsIds: 'lt',
  thematiqueIds: 't',
  financeurIds: 'f',
  indicateurIds: 'i',
  cibles: 'c',
  ameliorationContinue: 'ac',
  page: 'p',
  sort: 'sort',
  noPilote: 'ssp',
  noServicePilote: 'sssp',
  noStatut: 'sss',
  noPlan: 'np',
  noPriorite: 'npr',
  typePeriode: 'tp',
  debutPeriode: 'dp',
  finPeriode: 'fp',
  modifiedAfter: 'ma',
  // Not supported for now in filters
  //piliersEci: 'pe',
  //effetsAttendus: 'ea',
  //participationCitoyenneType: 'pc',
  //axes: 'ax',
  sousThematiqueIds: 'st',
  noReferent: 'nr',
};

type FicheActionFiltersContextType = {
  filters: Filtres;
  setFilters: (filters: Filtres) => void;
  resetFilters: () => void;
  isFiltered: boolean;
  type: 'classifiees' | 'non-classifiees';
};

const FicheActionFiltersContext =
  createContext<FicheActionFiltersContextType | null>(null);

export const FicheActionFiltersProvider = ({
  children,
  type = 'classifiees',
}: {
  children: ReactNode;
  type?: 'classifiees' | 'non-classifiees';
}) => {
  const tracker = useEventTracker();
  const pathname = usePathname();
  const [filterParams, setFilterParams] = useSearchParams<Filtres>(
    pathname,
    {},
    nameToparams
  );

  const filters = convertParamsToFilters(filterParams);

  // Ajouter le filtre pour distinguer les fiches classées des non classées
  const finalFilters = {
    ...filters,
    noPlan: type === 'non-classifiees' ? true : undefined,
  };

  const setFilters = (newFilters: Filtres) => {
    setFilterParams(newFilters);
    tracker(Event.updateFiltres, {
      filtreValues: newFilters,
    });
  };

  const resetFilters = () => {
    setFilterParams({});
  };

  // Check if there are any active filters (excluding noPlan which is set based on type)
  const isFiltered = Object.keys(filters).length > 0;

  return (
    <FicheActionFiltersContext.Provider
      value={{
        filters: finalFilters,
        setFilters,
        resetFilters,
        isFiltered,
        type,
      }}
    >
      {children}
    </FicheActionFiltersContext.Provider>
  );
};

export const useFicheActionFilters = () => {
  const context = useContext(FicheActionFiltersContext);
  if (!context) {
    throw new Error(
      'useFicheActionFilters must be used within a FicheActionFiltersProvider'
    );
  }
  return context;
};

/** Convertit les paramètres d'URL en filtres */
const convertParamsToFilters = (paramFilters: Filtres) => {
  if (paramFilters.modifiedSince && Array.isArray(paramFilters.modifiedSince)) {
    paramFilters.modifiedSince = paramFilters.modifiedSince[0];
  }
  if (paramFilters.debutPeriode && Array.isArray(paramFilters.debutPeriode)) {
    paramFilters.debutPeriode = paramFilters.debutPeriode[0];
  }
  if (paramFilters.finPeriode && Array.isArray(paramFilters.finPeriode)) {
    paramFilters.finPeriode = paramFilters.finPeriode[0];
  }
  if (paramFilters.typePeriode && Array.isArray(paramFilters.typePeriode)) {
    paramFilters.typePeriode = paramFilters.typePeriode[0];
  }
  if (paramFilters.debutPeriode && Array.isArray(paramFilters.debutPeriode)) {
    paramFilters.debutPeriode = paramFilters.debutPeriode[0];
  }
  if (paramFilters.finPeriode && Array.isArray(paramFilters.finPeriode)) {
    paramFilters.finPeriode = paramFilters.finPeriode[0];
  }
  if (
    paramFilters.hasMesuresLiees &&
    Array.isArray(paramFilters.hasMesuresLiees)
  ) {
    const hasMesuresLieesAsString = paramFilters.hasMesuresLiees[0];
    paramFilters.hasMesuresLiees =
      hasMesuresLieesAsString === undefined
        ? undefined
        : hasMesuresLieesAsString === 'true';
  }
  return paramFilters;
};
