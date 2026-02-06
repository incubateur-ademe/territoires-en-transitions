'use client';

import BlogCard from '@/site/components/cards/BlogCard';
import MasonryGallery from '@/site/components/galleries/MasonryGallery';
import { convertNameToSlug } from '@/site/src/utils/convertNameToSlug';
import {
  Field,
  OptionValue,
  Pagination,
  SelectFilter,
  SelectOption,
} from '@tet/ui';
import { useEffect, useEffectEvent, useState } from 'react';
import { ActuCard, getData } from './utils';

const PAGINATION_LIMIT = 12;

type ListeActusProps = {
  categories: SelectOption[];
};

const ListeActus = ({ categories }: ListeActusProps) => {
  const [selectedCategories, setSelectedCategories] = useState<
    OptionValue[] | undefined
  >();

  const [selectedPage, setSelectedPage] = useState(1);
  const updateSelectedPage = useEffectEvent((value: number) =>
    setSelectedPage(value)
  );

  const [total, setTotal] = useState(0);
  const [data, setData] = useState<ActuCard[]>();

  const getActusData = useEffectEvent(async () => {
    const { data, pagination } = await getData({
      page: selectedPage,
      limit: PAGINATION_LIMIT,
      categories: (selectedCategories as number[]) ?? [],
    });
    setData(data);
    setSelectedPage(pagination.start / PAGINATION_LIMIT + 1);
    setTotal(pagination.total);
  });

  useEffect(() => {
    // Lorsque le filtre change, on revient en page 1 avant le fetch pour éviter des erreurs
    if (selectedPage === 1) getActusData();
    else updateSelectedPage(1);
  }, [selectedCategories, selectedPage]);

  useEffect(() => {
    getActusData();
  }, [selectedPage]);

  return (
    <>
      {categories.length > 0 && (
        <Field title="Catégorie" className="w-full sm:w-96 ml-auto mb-6" small>
          <SelectFilter
            values={selectedCategories}
            options={categories}
            onChange={({ values }) => setSelectedCategories(values)}
            placeholder="Sélectionner une ou plusieurs catégories"
            small
          />
        </Field>
      )}

      {!!data && (
        <>
          <MasonryGallery
            data={data.map((actu) => (
              <BlogCard
                key={actu.id}
                title={actu.titre}
                date={actu.dateCreation}
                description={actu.resume}
                image={actu.couverture}
                badge={actu.epingle ? 'À la une' : undefined}
                categories={actu.categories}
                href={`/actus/${actu.id}/${convertNameToSlug(actu.titre)}`}
              />
            ))}
          />
          <Pagination
            className="mt-8 mx-auto"
            selectedPage={selectedPage}
            nbOfElements={total}
            maxElementsPerPage={PAGINATION_LIMIT}
            idToScrollTo="actus-header"
            onChange={setSelectedPage}
          />
        </>
      )}
    </>
  );
};

export default ListeActus;
