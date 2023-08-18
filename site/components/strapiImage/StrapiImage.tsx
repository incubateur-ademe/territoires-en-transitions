/* eslint-disable @next/next/no-img-element */
import classNames from 'classnames';
import {StrapiItem} from 'src/StrapiItem';

const baseURL = process.env.NEXT_PUBLIC_STRAPI_URL;

type Size = 'large' | 'medium' | 'small' | 'thumbnail';

type StrapiImageProps = {
  data: StrapiItem;
  size?: Size;
  className?: string;
};

export function StrapiImage({data, size, className}: StrapiImageProps) {
  const attributes = data.attributes;
  const url =
    size && attributes.formats?.size
      ? `${attributes.formats[size].url}`
      : `${attributes.url}`;

  return (
    <img
      className={classNames('fr-responsive-img', className)}
      src={url.startsWith('http') ? url : `${baseURL}${url}`}
      alt={`${attributes.alternativeText}`}
    />
  );
}
