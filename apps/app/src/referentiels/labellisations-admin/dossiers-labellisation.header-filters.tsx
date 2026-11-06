'use client';

import { appLabels } from '@/app/labels/catalog';
import { Input } from '@tet/ui';
import { parseAsString, useQueryStates } from 'nuqs';
import { useState } from 'react';

/**
 * Recherche dans la liste des dossiers, gardée dans l'URL : la vue et l'en-tête
 * de colonne la lisent chacun directement, sans contexte ni fermeture.
 */
export const useFilterDossiersLabellisation = () => {
  const [filters, setFilters] = useQueryStates(
    { search: parseAsString.withDefault('') },
    { urlKeys: { search: '$q' } }
  );
  return { filters, setFilters };
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
