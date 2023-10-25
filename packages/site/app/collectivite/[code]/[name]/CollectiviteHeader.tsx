import {Badge} from '@components/dstet/badge/Badge';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import classNames from 'classnames';
import Image from 'next/image';
import {StrapiItem} from 'src/strapi/StrapiItem';

type CollectiviteHeaderProps = {
  nom: string;
  region?: string;
  departement?: string;
  type?: string;
  population?: number;
  url?: string;
  couverture?: StrapiItem;
  logo?: StrapiItem;
};

const CollectiviteHeader = ({
  nom,
  region,
  departement,
  type,
  population,
  url,
  couverture,
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
          <Image
            src="/collectivites/placeholder.jpg"
            alt=""
            fill={true}
            style={{objectFit: 'cover', minHeight: '100%', minWidth: '100%'}}
          />
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
            {region && departement
              ? `${region} / ${departement}`
              : region
              ? region
              : departement
              ? departement
              : ''}
          </p>
          {/* Badges avec nombre d'habitants et type de collectivité */}
          <div className={classNames('flex gap-2 flex-wrap', {'mb-6': !!url})}>
            {population && (
              <Badge
                content={`${population
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} habitants`}
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
            className="bg-white p-3 md:p-4 absolute md:static right-8 top-0 -translate-y-3/4 md:translate-y-0"
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
