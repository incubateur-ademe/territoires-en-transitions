import { GallerieArticleData } from '@/site/app/types';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import classNames from 'classnames';

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
          <DEPRECATED_StrapiImage
            key={index}
            data={image}
            className={classNames(
              'w-full h-full min-h-[250px] max-h-[300px] object-cover'
            )}
            displayCaption={false}
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
