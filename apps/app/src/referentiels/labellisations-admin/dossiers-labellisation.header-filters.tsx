'use client';

import { HeaderFilterButton } from '@/app/demarches/components/header-filter.button';
import { appLabels } from '@/app/labels/catalog';
import { Z_INDEX_ABOVE_STICKY_HEADER } from '@tet/design-tokens';
import {
  DossierLabellisationStatut,
  dossierLabellisationStatutValues,
  SujetDemande,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { Input, SelectFilter } from '@tet/ui';
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useState } from 'react';
import { DossiersSort, sortValues } from './labellisations-admin.utils';

export const sujetValues = Object.values(SujetDemandeEnum);
export type { DossiersSort };

/**
 * Recherche, filtres et tri de la liste des dossiers, gardés dans l'URL : la
 * vue et les en-têtes de colonne les lisent chacun directement, sans contexte
 * ni fermeture.
 */
export const useFilterDossiersLabellisation = () => {
  const [filters, setFilters] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      sujets: parseAsArrayOf(parseAsStringLiteral(sujetValues)).withDefault([]),
      statuts: parseAsArrayOf(
        parseAsStringLiteral(dossierLabellisationStatutValues)
      ).withDefault([]),
      sort: parseAsStringLiteral(sortValues),
      direction: parseAsStringLiteral(['asc', 'desc'] as const).withDefault(
        'asc'
      ),
    },
    {
      urlKeys: {
        search: '$q',
        sujets: '$sj',
        statuts: '$st',
        sort: '$s',
        direction: '$d',
      },
    }
  );
  // Un clic sur la colonne déjà triée inverse le sens.
  const sortBy = (sort: DossiersSort) =>
    setFilters({
      sort,
      direction:
        filters.sort === sort && filters.direction === 'asc' ? 'desc' : 'asc',
    });
  const sortDirection = (sort: DossiersSort) =>
    filters.sort === sort ? filters.direction : null;
  return { filters, setFilters, sortBy, sortDirection };
};

export type DossiersView = 'en-attente' | 'en-cours' | 'clos';

export const CollectiviteHeaderFilter = ({
  placeholder = appLabels.labellisationsAdminRechercheNomOuId,
}: {
  placeholder?: string;
}) => {
  const { filters, setFilters } = useFilterDossiersLabellisation();
  const [search, setSearch] = useState(filters.search);
  // Suit l'URL quand elle change d'ailleurs (réinitialisation, précédent/suivant),
  // ajusté au rendu plutôt que dans un effet. Une valeur venue de cette saisie
  // (debounce) est ignorée, pour ne pas écraser ce qui a été tapé depuis.
  const [urlSearch, setUrlSearch] = useState(filters.search);
  const [sentSearch, setSentSearch] = useState(filters.search);
  if (urlSearch !== filters.search) {
    setUrlSearch(filters.search);
    if (filters.search !== sentSearch) {
      setSearch(filters.search);
      setSentSearch(filters.search);
    }
  }
  return (
    <Input
      type="search"
      displaySize="sm"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      onSearch={(value) => {
        setSentSearch(value);
        setFilters({ search: value || null });
      }}
      placeholder={placeholder}
      containerClassname="w-full"
      icon={undefined}
    />
  );
};

export const SujetHeaderFilter = () => {
  const { filters, setFilters } = useFilterDossiersLabellisation();
  return (
    <SelectFilter
      dataTest="referentiels.labellisations-admin.filtre-sujet"
      dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
      options={sujetValues.map((value) => ({
        value,
        label: appLabels.labellisationsAdminSujet[value],
      }))}
      values={filters.sujets}
      onChange={({ values }) =>
        setFilters({ sujets: (values ?? []) as SujetDemande[] })
      }
      placeholder={appLabels.filtrer}
      small
      custom={{
        triggerButton: {
          button: <HeaderFilterButton filterCount={filters.sujets.length} />,
        },
      }}
    />
  );
};

/** Les statuts, dans l'ordre du cycle de vie, sauf « clos » qui a son onglet. */
const statutOptions = dossierLabellisationStatutValues.filter(
  (statut) => statut !== 'clos'
);

export const StatutHeaderFilter = () => {
  const { filters, setFilters } = useFilterDossiersLabellisation();
  return (
    <SelectFilter
      dataTest="referentiels.labellisations-admin.filtre-statut"
      dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
      options={statutOptions.map((value) => ({
        value,
        label: appLabels.labellisationsAdminStatut[value],
      }))}
      values={filters.statuts}
      onChange={({ values }) =>
        setFilters({
          statuts: (values ?? []) as DossierLabellisationStatut[],
        })
      }
      placeholder={appLabels.filtrer}
      small
      custom={{
        triggerButton: {
          button: <HeaderFilterButton filterCount={filters.statuts.length} />,
        },
      }}
    />
  );
};
