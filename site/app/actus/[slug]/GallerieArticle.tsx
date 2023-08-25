import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/strapi/StrapiItem';

type GallerieArticleProps = {
  images: StrapiItem[];
};

const GallerieArticle = ({images}: GallerieArticleProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 w-full lg:w-4/5 mx-auto gap-6">
      {images.map((image, index) => (
        <picture key={index}>
          <StrapiImage
            data={image}
            className="w-full h-full max-h-[350px] object-cover"
          />
        </picture>
      ))}
    </div>
  );
};

export default GallerieArticle;
