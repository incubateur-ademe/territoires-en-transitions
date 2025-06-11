import Link from 'next/link';

import { GreyStar, RedStar } from '@/site/components/labellisation/Star';
import ImageStrapi from '@/site/components/strapiImage/ImageStrapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { convertNameToSlug } from '@/site/src/utils/convertNameToSlug';
import { Badge } from '@/ui';

export const NumFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

export type CollectiviteCardProps = {
  nom: string;
  region: string | null;
  departement: string | null;
  population: number | null;
  type: string | null;
  etoilesCAE: number;
  etoilesECI: number;
  cover: StrapiItem;
  siren: string | null;
};

const CollectiviteCard = ({
  nom = '',
  region,
  departement,
  population,
  type,
  etoilesCAE,
  etoilesECI,
  cover,
  siren,
}: CollectiviteCardProps) => {
  return (
    <Link
      key={nom}
      className="flex flex-col items-center rounded-xl shadow overflow-hidden"
      href={`/collectivites/${siren}/${convertNameToSlug(nom)}`}
    >
      <div className="relative w-full">
        <ImageStrapi
          strapiImage={cover}
          size="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          imgClassName="object-cover aspect-[5/2] lg:aspect-[3/1]"
        />
        <div className="absolute -bottom-3 right-6 flex gap-4">
          {population && (
            <Badge
              title={`${Intl.NumberFormat('fr', {
                maximumFractionDigits: 3,
              }).format(population)} habitants`}
              state="new"
              size="sm"
            />
          )}
          {type && <Badge title={type} state="info" size="sm" />}
        </div>
      </div>
      <div className="flex flex-col items-center p-6 w-full text-center">
        <div className="mb-2 text-2xl text-primary-9 font-bold">{nom}</div>
        <div className="text-primary-9">
          {region} / {departement}
        </div>
        <div className="flex flex-col items-center gap-3 mt-6 lg:w-full lg:flex-row lg:justify-center">
          <Referentiel nom="Climat Air Énergie" etoiles={etoilesCAE} />
          <div className="w-full h-px lg:w-px lg:h-10 bg-grey-3" />
          <Referentiel nom="Économie Circulaire" etoiles={etoilesECI} />
        </div>
      </div>
    </Link>
  );
};

export default CollectiviteCard;

const Referentiel = ({ nom, etoiles }: { nom: string; etoiles: number }) => (
  <div className="flex flex-col items-center gap-3">
    <span className="text-primary-7 font-bold text-sm">{nom}</span>
    <div className="flex gap-3">
      {[1, 2, 3, 4, 5].map((i) =>
        etoiles >= i ? <RedStar key={i} /> : <GreyStar key={i} />
      )}
    </div>
  </div>
);

export const LoadingCard = () => (
  <div className="aspect-[4/3] rounded-xl bg-grey-3 shadow animate-pulse" />
);
