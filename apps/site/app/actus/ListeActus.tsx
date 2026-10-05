'use client';

import BlogCard from '@/site/components/cards/BlogCard';
import MasonryGallery from '@/site/components/galleries/MasonryGallery';
import { convertNameToSlug } from '@/site/src/utils/convertNameToSlug';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Field, Pagination, SelectFilter, SelectOption } from '@tet/ui';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import { useMemo } from 'react';
import { getData } from './utils';

const PAGINATION_LIMIT = 12;
const actusSearchParams = {
  selectedPage: parseAsInteger.withDefault(1),
  selectedCategories: parseAsArrayOf(parseAsString).withDefault([]),
};

type ListeActusProps = {
  categories: SelectOption[];
  /** id numérique → documentId, pour les liens filtrés d'avant Strapi 5. */
  legacyCategoryIds: Record<string, string>;
};

const ListeActus = ({ categories, legacyCategoryIds }: ListeActusProps) => {
  const [{ selectedPage, selectedCategories }, setSearchParams] =
    useQueryStates(actusSearchParams, {
      urlKeys: {
        selectedPage: 'p',
        selectedCategories: 'c',
      },
    });
  // Une valeur inconnue (catégorie supprimée, lien abîmé) est ignorée plutôt
  // que de vider la liste.
  const categoriesFilter = useMemo(() => {
    const knownDocumentIds = new Set(Object.values(legacyCategoryIds));
    return (selectedCategories ?? [])
      .map((value) => legacyCategoryIds[value] ?? value)
      .filter((documentId) => knownDocumentIds.has(documentId));
  }, [selectedCategories, legacyCategoryIds]);

  const {
    data: actusData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['actualites', selectedPage, categoriesFilter],
    queryFn: () =>
      getData({
        page: selectedPage,
        limit: PAGINATION_LIMIT,
        categories: categoriesFilter,
      }),
    placeholderData: keepPreviousData,
  });

  const data = actusData?.data;
  const total = actusData?.pagination.total ?? 0;
  if (isPending && !actusData) {
    return <div className="py-8 text-center">Chargement des actualités…</div>;
  }

  if (isError) {
    return (
      <div className="py-8 text-center">
        Impossible de charger les actualités.
      </div>
    );
  }

  return (
    <>
      {categories.length > 0 && (
        <Field title="Catégorie" className="w-full sm:w-96 ml-auto mb-6" small>
          <SelectFilter
            values={categoriesFilter}
            options={categories}
            onChange={({ values }) => {
              // quand le filtre change, on revient sur la page 1
              setSearchParams({
                selectedCategories: (values as string[]) ?? [],
                selectedPage: 1,
              });
            }}
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
                key={actu.documentId}
                title={actu.titre}
                date={actu.dateCreation}
                description={actu.resume}
                image={actu.couverture}
                badge={actu.epingle ? 'À la une' : undefined}
                categories={actu.categories}
                href={`/actus/${actu.documentId}/${convertNameToSlug(
                  actu.titre
                )}`}
              />
            ))}
          />
          <Pagination
            className="mt-8 mx-auto"
            selectedPage={selectedPage}
            nbOfElements={total}
            maxElementsPerPage={PAGINATION_LIMIT}
            idToScrollTo="actus-header"
            onChange={(selectedPage) => setSearchParams({ selectedPage })}
          />
        </>
      )}
    </>
  );
};

export default ListeActus;
