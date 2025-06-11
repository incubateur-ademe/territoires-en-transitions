'use client';

import CollectiviteSearch from '@/site/app/collectivites/_components/collectivites.search';
import CarteAvecFiltres from '@/site/components/carte/CarteAvecFiltres';
import { useCarteCollectivitesEngagees } from '@/site/components/carte/useCarteCollectivitesEngagees';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { natureCollectiviteToLabel } from '@/site/src/utils/labels';
import PageContainer from '@/ui/components/layout/page-container';
import CollectiviteCard, { LoadingCard } from './_components/collectivite.card';

type Props = {
  collectivitesStrapi: StrapiItem[];
};

const CollectivitesPage = ({ collectivitesStrapi }: Props) => {
  const { data, isLoading } = useCarteCollectivitesEngagees();

  const sirenArray = new Set(
    collectivitesStrapi.map((col) => col.attributes.code_siren_insee)
  ) as Set<any>;

  const tempArray =
    data?.collectivites.filter((col) => sirenArray.has(col.code_siren_insee)) ??
    [];

  const collectivitesALaUne = tempArray?.map((col) => ({
    nom: col.nom ?? '',
    region: col.region_name,
    departement: col.departement_name,
    population: col.population_totale,
    type: col.nature_collectivite
      ? natureCollectiviteToLabel[col.nature_collectivite]
      : col.type_collectivite,
    etoilesCAE: col.cae_etoiles ?? 0,
    etoilesECI: col.eci_etoiles ?? 0,
    siren: col.code_siren_insee,
    cover: collectivitesStrapi.find(
      (c) =>
        (c.attributes.code_siren_insee as unknown as string) ===
        col.code_siren_insee
    )?.attributes.couverture.data as unknown as StrapiItem,
  }));

  return (
    <PageContainer
      bgColor="white"
      innerContainerClassName="flex flex-col gap-14 md:py-20"
    >
      <h2 className="text-center text-primary-8 mb-0">
        De nombreuses collectivités ont déjà franchi le cap !
      </h2>
      <CollectiviteSearch />
      <p className="text-center text-grey-8 text-xl mb-0">
        Découvrez les collectivités à la une
      </p>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : (
          collectivitesALaUne?.map((col) => (
            <CollectiviteCard key={col.nom} {...col} />
          ))
        )}
      </div>
      <CarteAvecFiltres data={data} />
    </PageContainer>
  );
};

export default CollectivitesPage;
