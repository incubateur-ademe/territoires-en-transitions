'use client';

import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { getFormattedNumber } from '@/site/src/utils/getFormattedNumber';
import { Badge, Icon } from '@tet/ui';
import classNames from 'classnames';
import Image from 'next/image';

type CollectiviteHeaderProps = {
  collectivite: {
    nom: string;
    region_name?: string;
    region_code?: string;
    departement_name?: string;
    departement_code?: string;
    type?: string;
    population_totale?: number;
    url?: string;
    couverture?: StrapiItem;
    couvertureDefaut?: StrapiItem;
    logo?: StrapiItem;
    annuaireUrl: string | null;
  };
};

const CollectiviteHeader = ({
  collectivite: {
    nom,
    region_name,
    region_code,
    departement_name,
    departement_code,
    type,
    population_totale,
    url,
    couverture,
    couvertureDefaut,
    logo,
    annuaireUrl,
  },
}: CollectiviteHeaderProps) => {
  return (
    <div className="flex flex-col md:rounded-[10px] bg-primary-7">
      <div className="relative w-full h-[314px] overflow-hidden md:rounded-t-[10px]">
        {couverture ? (
          <DEPRECATED_StrapiImage
            data={couverture}
            className="object-cover object-center h-full w-full"
            containerClassName="h-[314px] w-full overflow-hidden"
            displayCaption
          />
        ) : (
          <div className="bg-primary-3 h-full w-full relative">
            <div className="h-full w-full absolute top-0 left-0 flex flex-col justify-center items-center">
              <p className="text-grey-9 font-bold text-[20px] px-6 text-center">
                Envoyez-nous la photo de votre collectivité à
                contact@territoiresentransitions.fr
              </p>
            </div>
            {couvertureDefaut ? (
              <DEPRECATED_StrapiImage
                data={couvertureDefaut}
                className="object-cover object-center h-full w-full"
                containerClassName="h-full w-full object-cover object-center hover:opacity-10 transition-opacity duration-500 relative z-10 bg-primary-2"
                containerStyle={{
                  WebkitTransition:
                    'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                displayCaption={false}
              />
            ) : (
              <Image
                src="/collectivites/placeholder.jpg"
                alt=""
                fill={true}
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                  minHeight: '100%',
                  minWidth: '100%',
                  WebkitTransition:
                    'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="hover:opacity-10 transition-opacity duration-500 bg-primary-2"
              />
            )}
          </div>
        )}
      </div>

      {/* Texte de présentation de la collectivité */}
      <div className="py-10 px-8 md:p-16 flex justify-between relative">
        <div>
          {/* Nom de la collectivité */}
          <h1
            className={classNames(
              'text-grey-1 text-[25px] lg:text-[46px] leading-[30px] lg:leading-[48px] mb-3',
              {
                'pb-0.5 hover:p-0 hover:border-b-2 flex items-end gap-2 w-fit':
                  !!annuaireUrl,
              }
            )}
          >
            {!annuaireUrl ? (
              nom
            ) : (
              <a
                href={annuaireUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="bg-none active:!bg-transparent after:hidden flex items-end gap-1.5"
              >
                <span className="inline-block">{nom}</span>
                <Icon
                  icon="external-link-line"
                  size="2xl"
                  className="inline-block mb-1.5"
                />
              </a>
            )}
          </h1>

          {/* Région et département */}
          <p className="text-white font-bold text-[16px] lg:text-[18px] leading-[18px] lg:leading-[22px]">
            {region_name && departement_name ? (
              <>
                <a href={`/stats/region/${region_code}`}>{region_name}</a>
                {' / '}
                <a href={`/stats/departement/${departement_code}`}>
                  {departement_name}
                </a>
              </>
            ) : region_name ? (
              <a href={`/stats/region/${region_code}`}>{region_name}</a>
            ) : departement_name ? (
              <a href={`/stats/departement/${departement_code}`}>
                {departement_name}
              </a>
            ) : (
              ''
            )}
          </p>

          {/* Badges avec nombre d'habitants et type de collectivité */}
          <div
            className={classNames('flex gap-2 flex-wrap', { 'mb-6': !!url })}
          >
            {!!population_totale && (
              <Badge
                title={`${getFormattedNumber(population_totale)} habitants`}
                state="new"
              />
            )}
            {!!type && <Badge title={type} state="info" />}
          </div>

          {/* URL */}
          {!!url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-white font-bold text-[14px] lg:text-[16px]"
            >
              {url}
            </a>
          )}
        </div>

        {/* Logo de la collectivité */}
        {logo && (
          <div
            className="absolute md:static right-8 top-0 -translate-y-3/4 md:translate-y-0 h-fit max-w-[250px]"
            style={{ boxShadow: '0px 4px 20px 0px rgba(0, 0, 0, 0.3)' }}
          >
            <DEPRECATED_StrapiImage
              data={logo}
              className="bg-white max-h-[70px] sm:max-h-[100px] lg:max-h-[150px] w-auto"
              containerClassName="h-fit w-fit"
              displayCaption={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectiviteHeader;
