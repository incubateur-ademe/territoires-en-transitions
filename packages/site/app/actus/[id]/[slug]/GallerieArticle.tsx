import { StrapiImage } from '@tet/site/components/strapiImage/StrapiImage';
import classNames from 'classnames';
import { GallerieArticleData } from '@tet/site/app/types';

type GallerieArticleProps = {
  data: GallerieArticleData;
};

const GallerieArticle = ({
  data: { data, colonnes, legende, legendeVisible },
}: GallerieArticleProps) => {
  return (
    <div className="flex flex-col mb-6 items-center mx-auto">
      <div
        className={classNames(
          'grid grid-cols-1 w-full lg:w-4/5 mx-auto gap-6',
          {
            'md:grid-cols-2': colonnes >= 2,
            'lg:grid-cols-3': colonnes >= 3,
            'xl:grid-cols-4': colonnes === 4,
          }
        )}
      >
        {data.map((image, index) => (
          <StrapiImage
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
        <span className="!text-sm text-[#666] mt-4 w-full text-center">
          {legende}
        </span>
      )}
    </div>
  );
};

export default GallerieArticle;
