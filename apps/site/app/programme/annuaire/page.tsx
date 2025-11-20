'use client';

import Section from '@/site/components/sections/Section';
import { Input, Pagination } from '@tet/ui';
import { useEffect, useState } from 'react';
import CarteConseiller from './CarteConseiller';
import { ConseillerType, getData } from './utils';

const PAGINATION_LIMIT = 12;

const Annuaire = () => {
  const [selectedPage, setSelectPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [total, setTotal] = useState(0);
  const [data, setData] = useState<ConseillerType[]>([]);

  const getConseillersData = async () => {
    const { data, pagination } = await getData({
      page: selectedPage,
      limit: PAGINATION_LIMIT,
      search: searchInput,
    });
    setData(data);
    setSelectPage(pagination.start / PAGINATION_LIMIT + 1);
    setTotal(pagination.total);
  };

  useEffect(() => {
    getConseillersData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPage, searchInput]);

  return (
    <Section containerClassName="grow bg-primary-1">
      <div className="flex flex-wrap gap-y-6 justify-between items-center mb-6">
        <h1 id="annuaire-header" className="text-3xl mb-0">
          Annuaire des conseillers-conseillères
        </h1>
        <Input
          className="!w-[435px]"
          onChange={(evt) => setSearchInput(evt.target.value)}
          onSearch={() => undefined}
          type="search"
          placeholder="Rechercher un nom, prénom, structure ou région"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {data.map((carte) => (
          <CarteConseiller
            key={`${carte.prenom}-${carte.nom}-${carte.id}`}
            {...carte}
          />
        ))}
      </div>

      <Pagination
        className="mt-8 mx-auto"
        selectedPage={selectedPage}
        nbOfElements={total}
        maxElementsPerPage={PAGINATION_LIMIT}
        idToScrollTo="annuaire-header"
        onChange={setSelectPage}
      />
    </Section>
  );
};

export default Annuaire;
