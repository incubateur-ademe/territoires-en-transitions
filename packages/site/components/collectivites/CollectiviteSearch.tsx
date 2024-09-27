'use client';

import { useRouter } from 'next/navigation';
import { Dispatch, SetStateAction, useState } from 'react';
import AutocompleteInputSelect from '@tet/site/components/select/AutocompleteInputSelect';
import { convertNameToSlug } from '@tet/site/src/utils/convertNameToSlug';
import { useFilteredCollectivites } from '../../app/useFilteredCollectivites';

type CollectiviteSearchProps = {
  filteredCollectivites: { value: string; label: string }[];
  isCollectivitesLoading: boolean;
  setSearch: Dispatch<SetStateAction<string>>;
};

const CollectiviteSearch = ({
  filteredCollectivites,
  isCollectivitesLoading,
  setSearch,
}: CollectiviteSearchProps) => {
  const router = useRouter();

  return (
    <div className="mb-6">
      <AutocompleteInputSelect
        dsfrButton
        containerWidthMatchButton
        buttonClassName="!shadow-none !border-b-2 !border-[#000091]"
        values={[]}
        options={filteredCollectivites}
        onSelect={(values) => {
          const name =
            filteredCollectivites.find((c) => c.value === values[0])?.label ??
            '';
          router.push(`/collectivites/${values[0]}/${convertNameToSlug(name)}`);
        }}
        onInputChange={(value) => setSearch(value)}
        placeholderText="Rechercher un EPCI, un syndicat, une commune, un PETR, un EPT"
        isLoading={isCollectivitesLoading}
        debounce
        externalOptionsFiltering
      />
    </div>
  );
};

const CollectiviteSearchConnected = () => {
  const [search, setSearch] = useState('');
  const data = useFilteredCollectivites(search);

  return (
    <CollectiviteSearch
      filteredCollectivites={
        (data.data?.filteredCollectivites.map((c) => ({
          value: c.code_siren_insee,
          label: c.nom,
        })) ?? []) as { value: string; label: string }[]
      }
      isCollectivitesLoading={data.isLoading}
      setSearch={setSearch}
    />
  );
};

export default CollectiviteSearchConnected;
