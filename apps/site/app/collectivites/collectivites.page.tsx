'use client';

import CollectiviteSearch from '@/site/app/collectivites/_components/collectivites.search';
import CarteAvecFiltres from '@/site/components/carte/CarteAvecFiltres';
import { useCarteCollectivitesEngagees } from '@/site/components/carte/useCarteCollectivitesEngagees';
import type { StrapiEntry } from '@/site/src/strapi/types';
import { natureCollectiviteToLabel } from '@/site/src/utils/labels';
import CollectiviteCard, { LoadingCard } from './_components/collectivite.card';
import type { Collectivite } from './utils';

type Props = {
  collectivitesStrapi: StrapiEntry<Collectivite>[];
};

const CollectivitesPage = ({ collectivitesStrapi }: Props) => {
  const { data, isLoading } = useCarteCollectivitesEngagees();

  const sirenArray = new Set(
    collectivitesStrapi.map((col) => col.code_siren_insee)
  );

  const tempArray =
    data?.collectivites.filter(
      (col) => !!col.codeSirenInsee && sirenArray.has(col.codeSirenInsee)
    ) ?? [];

  const collectivitesALaUne = tempArray?.map((col) => ({
    nom: col.nom ?? '',
    region: col.regionName,
    departement: col.departementName,
    population: col.populationTotale,
    type: col.natureCollectivite
      ? natureCollectiviteToLabel[col.natureCollectivite]
      : col.typeCollectivite,
    etoilesCAE: col.caeEtoiles ?? 0,
    etoilesECI: col.eciEtoiles ?? 0,
    siren: col.codeSirenInsee,
    cover:
      collectivitesStrapi.find(
        (c) => c.code_siren_insee === col.codeSirenInsee
      )?.couverture ?? null,
  }));

  return (
    <div className="fr-container flex flex-col gap-14 md:py-20">
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
    </div>
  );
};

export default CollectivitesPage;
