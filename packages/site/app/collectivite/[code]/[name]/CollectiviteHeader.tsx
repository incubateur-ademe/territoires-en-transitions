import {Badge} from '@components/dstet/badge/Badge';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import classNames from 'classnames';
import Image from 'next/image';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {getFormattedNumber} from 'src/utils/getFormattedNumber';

type CollectiviteHeaderProps = {
  nom: string;
  region?: string;
  regionCode?: string;
  departement?: string;
  departementCode?: string;
  type?: string;
  population?: number;
  url?: string;
  couverture?: StrapiItem;
  couvertureDefaut?: StrapiItem;
  logo?: StrapiItem;
};

const CollectiviteHeader = ({
  nom,
  region,
  regionCode,
  departement,
  departementCode,
  type,
  population,
  url,
  couverture,
  couvertureDefaut,
  logo,
}: CollectiviteHeaderProps) => {
  return (
    <div className="flex flex-col md:rounded-[10px] bg-primary-7">
      <div className="relative w-full h-[314px] overflow-hidden md:rounded-t-[10px]">
        {couverture ? (
          <StrapiImage
            data={couverture}
            className="object-cover min-h-full min-w-full"
            containerClassName="h-full w-full"
            displayCaption={false}
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
              <StrapiImage
                data={couvertureDefaut}
                className="object-cover min-h-full min-w-full"
                containerClassName="h-full w-full hover:opacity-10 transition-opacity duration-500 relative z-10"
                displayCaption={false}
              />
            ) : (
              <Image
                src="/collectivites/placeholder.jpg"
                alt=""
                fill={true}
                style={{
                  objectFit: 'cover',
                  minHeight: '100%',
                  minWidth: '100%',
                }}
                className="hover:opacity-10 transition-opacity duration-500"
              />
            )}
          </div>
        )}
      </div>

      {/* Texte de présentation de la collectivité */}
      <div className="py-10 px-8 md:p-16 flex justify-between relative">
        <div>
          {/* Nom de la collectivité */}
          <h1 className="text-grey-1 text-[25px] lg:text-[46px] leading-[30px] lg:leading-[48px] mb-3">
            {nom}
          </h1>

          {/* Région et département */}
          <p className="text-white font-bold text-[16px] lg:text-[18px] leading-[18px] lg:leading-[22px]">
            {region && departement ? (
              <>
                <a href={`/stats/region/${regionCode}`}>{region}</a>
                {' / '}
                <a href={`/stats/department/${departementCode}`}>
                  {departement}
                </a>
              </>
            ) : region ? (
              <a href={`/stats/region/${regionCode}`}>{region}</a>
            ) : departement ? (
              <a href={`/stats/department/${departementCode}`}>{departement}</a>
            ) : (
              ''
            )}
          </p>

          {/* Badges avec nombre d'habitants et type de collectivité */}
          <div className={classNames('flex gap-2 flex-wrap', {'mb-6': !!url})}>
            {population && (
              <Badge
                content={`${getFormattedNumber(population)} habitants`}
                status="new"
                className="text-primary-7"
              />
            )}
            {type && (
              <Badge content={type} status="info" className="text-primary-7" />
            )}
          </div>

          {/* URL */}
          {url && (
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
            className="absolute md:static right-8 top-0 -translate-y-3/4 md:translate-y-0 h-fit w-fit"
            style={{boxShadow: '0px 4px 20px 0px rgba(0, 0, 0, 0.3)'}}
          >
            <StrapiImage
              data={logo}
              className="max-h-[70px] sm:max-h-[100px] lg:max-h-[150px] "
              containerClassName="h-fit "
              displayCaption={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectiviteHeader;
