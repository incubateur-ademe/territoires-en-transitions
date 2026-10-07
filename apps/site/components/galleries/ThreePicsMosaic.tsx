import { StrapiImage } from '@/site/components/strapiImage/strapi-image';
import { StrapiMedia } from '@/site/src/strapi/types';
import classNames from 'classnames';

// Masquées sous lg : `1px` y fait choisir la plus petite source si le
// navigateur les charge malgré tout.
const SECONDARY_SIZES =
  '(min-width: 1440px) 360px, (min-width: 1024px) 26vw, 1px';

type ThreePicsMosaicProps = {
  images: StrapiMedia[];
};

const ThreePicsMosaic = ({ images }: ThreePicsMosaicProps) => {
  const isPortrait = images.length
    ? (images[0].height ?? 0) >= (images[0].width ?? 0)
    : false;
  const isTwoColumns =
    (isPortrait && images.length >= 2) || (!isPortrait && images.length >= 3);
  const isOneColumn = !isTwoColumns;

  const imageClassname =
    'rounded-3xl border-8 border-primary-3 h-full w-full object-cover';

  return images.length > 0 ? (
    <div
      className={classNames({
        'lg:min-w-[45%] lg:max-w-[45%] lg:grid gap-8': isTwoColumns,
        'lg:grid-cols-9': isPortrait && isTwoColumns,
        'lg:grid-cols-7': !isPortrait && isTwoColumns,
        'lg:min-w-[20%] lg:max-w-[20%]': isPortrait && isOneColumn,
        'lg:min-w-[25%] lg:max-w-[25%]': !isPortrait && isOneColumn,
      })}
    >
      {/* Image principale */}
      {(isPortrait || (!isPortrait && images.length !== 2)) && (
        <StrapiImage
          media={images[0]}
          // 26 % du contenu au plus dès lg (4/7 d'une mosaïque de 45 %).
          sizes="(min-width: 1440px) 380px, (min-width: 1024px) 27vw, 100vw"
          containerClassName={classNames({
            'h-full w-full lg:max-h-[500px]': isPortrait,
            'pb-8': isPortrait && images.length >= 2,
            'my-auto': !isPortrait && images.length >= 3,
            'col-span-4': images.length >= 2,
          })}
          className={classNames(imageClassname, {
            'lg:max-h-[220px]': !isPortrait,
          })}
        />
      )}

      {/* Deux images secondaires */}
      {images.length >= 2 && (
        <div
          className={classNames('flex flex-col gap-8 max-lg:hidden', {
            'col-span-5': isPortrait && isTwoColumns,
            'col-span-3': !isPortrait && isTwoColumns,
            'justify-center': !isPortrait,
          })}
        >
          <StrapiImage
            media={images[images.length === 2 && !isPortrait ? 0 : 1]}
            sizes={SECONDARY_SIZES}
            containerClassName={classNames({
              'pt-8 h-1/2 max-h-[235px] w-full': isPortrait,
              'pl-6': isPortrait && images.length >= 3,
            })}
            className={classNames(imageClassname, {
              'max-h-[180px]': !isPortrait,
            })}
          />
          {((isPortrait && images.length >= 3) ||
            (!isPortrait && images.length >= 2)) && (
            <StrapiImage
              media={images[images.length === 2 && !isPortrait ? 1 : 2]}
              sizes={SECONDARY_SIZES}
              containerClassName={classNames({
                'pr-8 h-1/2 max-h-[203px] w-full': isPortrait,
              })}
              className={classNames(imageClassname, {
                'max-h-[180px]': !isPortrait,
              })}
            />
          )}
        </div>
      )}
    </div>
  ) : null;
};

export default ThreePicsMosaic;
