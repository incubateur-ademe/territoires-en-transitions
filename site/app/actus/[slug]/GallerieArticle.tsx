import {StrapiImage} from '@components/strapiImage/StrapiImage';
import classNames from 'classnames';
import {GallerieArticleData} from './types';

type GallerieArticleProps = {
  data: GallerieArticleData;
};

const GallerieArticle = ({data: {data, colonnes}}: GallerieArticleProps) => {
  return (
    <div
      className={classNames(
        'grid grid-cols-1 w-full lg:w-4/5 mx-auto gap-6 mb-6',
        {
          'md:grid-cols-2': colonnes >= 2,
          'lg:grid-cols-3': colonnes >= 3,
          'xl:grid-cols-4': colonnes === 4,
        },
      )}
    >
      {data.map((image, index) => (
        <picture key={index}>
          <StrapiImage
            data={image}
            className={classNames(
              'w-full h-full min-h-[250px] max-h-[300px] object-cover',
            )}
          />
        </picture>
      ))}
    </div>
  );
};

export default GallerieArticle;
