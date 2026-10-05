import { GallerieArticleData } from '@/site/app/types';
import { StrapiImage } from '@/site/components/strapiImage/strapi-image';
import classNames from 'classnames';

/**
 * Cellules recadrées (object-cover) de 250 à 300 px de haut : une photo 16/9
 * y occupe au moins ~545 px de large, quelle que soit l'étroitesse de la
 * colonne. Dès 2 colonnes (md), ce plancher couvre la largeur d'une colonne
 * de la galerie (lg:w-4/5 du contenu), d'où une valeur commune.
 */
const getGallerySizes = (colonnes: number) =>
  colonnes >= 2
    ? '(min-width: 768px) 545px, (min-width: 545px) 100vw, 545px'
    : '(min-width: 1440px) 1114px, (min-width: 1024px) 80vw, (min-width: 545px) 100vw, 545px';

type GallerieArticleProps = {
  data: GallerieArticleData;
};

const GallerieArticle = ({
  data: { data, colonnes, legende, legendeVisible },
}: GallerieArticleProps) => {
  return (
    <div className="flex flex-col items-center mx-auto w-full lg:w-4/5">
      <div
        className={classNames('grid grid-cols-1 gap-6', {
          'md:grid-cols-2': colonnes >= 2,
          'lg:grid-cols-3': colonnes >= 3,
          'xl:grid-cols-4': colonnes === 4,
        })}
      >
        {data.map((image, index) => (
          <StrapiImage
            key={index}
            media={image}
            sizes={getGallerySizes(colonnes)}
            className="w-full h-full min-h-[250px] max-h-[300px] object-cover"
          />
        ))}
      </div>
      {!!legende && !!legendeVisible && (
        <div className="mt-4 text-center text-grey-8 !text-sm !leading-4 py-1 px-2 bg-grey-3/50 rounded-sm">
          {legende}
        </div>
      )}
    </div>
  );
};

export default GallerieArticle;
