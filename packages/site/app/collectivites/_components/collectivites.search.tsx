'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { convertNameToSlug } from '@/site/src/utils/convertNameToSlug';
import { Select } from '@/ui';
import { useFilteredCollectivites } from '../../useFilteredCollectivites';

const CollectiviteSearch = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useFilteredCollectivites(search);

  const filteredCollectivites = (data?.filteredCollectivites.map((c) => ({
    value: c.code_siren_insee,
    label: c.nom,
  })) ?? []) as { value: string; label: string }[];

  return (
    <div className="mx-auto w-96 max-w-full">
      <Select
        placeholder="Rechercher une collectivité"
        debounce={500}
        options={filteredCollectivites}
        isLoading={isLoading}
        onChange={(value) => {
          const name =
            filteredCollectivites.find((c) => c.value === value)?.label ?? '';
          router.push(`/collectivites/${value}/${convertNameToSlug(name)}`);
        }}
        onSearch={(value) => setSearch(value)}
      />
    </div>
  );
};

export default CollectiviteSearch;
