import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import classNames from 'classnames';

type ThreePicsMosaicProps = {
  images: StrapiItem[];
};

const ThreePicsMosaic = ({ images }: ThreePicsMosaicProps) => {
  const isPortrait = images.length
    ? images[0].attributes.height >= images[0].attributes.width
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
        <DEPRECATED_StrapiImage
          data={images[0]}
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
          <DEPRECATED_StrapiImage
            data={images[images.length === 2 && !isPortrait ? 0 : 1]}
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
            <DEPRECATED_StrapiImage
              data={images[images.length === 2 && !isPortrait ? 1 : 2]}
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
