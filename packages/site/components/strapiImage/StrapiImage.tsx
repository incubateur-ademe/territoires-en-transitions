/* eslint-disable @next/next/no-img-element */
import classNames from 'classnames';
import {StrapiItem} from 'src/strapi/StrapiItem';

const baseURL = process.env.NEXT_PUBLIC_STRAPI_URL;

type Size = 'large' | 'medium' | 'small' | 'thumbnail';

type StrapiImageProps = {
  data: StrapiItem;
  size?: Size;
  className?: string;
  containerClassName?: string;
  displayCaption?: boolean;
};

export function StrapiImage({
  data,
  size,
  className,
  containerClassName,
  displayCaption = false,
}: StrapiImageProps) {
  const attributes = data.attributes;

  const url =
    size && attributes.formats?.size
      ? `${attributes.formats[size].url}`
      : `${attributes.url}`;

  return (
    <picture className={containerClassName}>
      <img
        className={classNames('block', className)}
        src={url.startsWith('http') ? url : `${baseURL}${url}`}
        alt={`${attributes.alternativeText ?? ''}`}
      />
      {displayCaption && !!attributes.caption && (
        <p className="!text-sm text-[#666] mt-2 mb-0 w-full text-center">
          {`${attributes.caption}`}
        </p>
      )}
    </picture>
  );
}
