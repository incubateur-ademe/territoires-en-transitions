'use client';

import { StrapiItem } from '@/site/src/strapi/StrapiItem';

import classNames from 'classnames';
import { CSSProperties, useEffect, useState } from 'react';

const imagePlaceholder = '/placeholder.svg';

type Size = 'large' | 'medium' | 'small' | 'thumbnail';

type Format = { [size: string]: { url: string } };

const addBaseURL = (url: string) => {
  const baseURL = process.env.NEXT_PUBLIC_STRAPI_URL;

  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${baseURL}${url}`;
  return `${baseURL}/${url}`;
};

const getImageSrc = (
  size: Size | undefined,
  formats: Format,
  url: string | undefined
) => {
  if (url) {
    const tempURL = size && formats?.size ? `${formats[size].url}` : url;
    return addBaseURL(tempURL);
  } else return imagePlaceholder;
};

type StrapiImageProps = {
  data: StrapiItem;
  size?: Size;
  className?: string;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  displayCaption?: boolean;
};

/**
 * @deprecated en faveur de ImageStrapi
 */
export const DEPRECATED_StrapiImage = ({
  data,
  size,
  className,
  containerClassName,
  containerStyle,
  displayCaption = false,
}: StrapiImageProps) => {
  const attributes = data.attributes;

  const [src, setSrc] = useState(imagePlaceholder);

  const formats = Object.keys(attributes.formats ?? {})
    .map((srcKey) => ({
      url: addBaseURL(`${attributes.formats[srcKey].url}`),
      width: attributes.formats[srcKey].width as unknown as number,
    }))
    .sort((a, b) => a.width - b.width);

  useEffect(() => {
    setSrc(
      getImageSrc(
        size,
        attributes.formats as unknown as Format,
        attributes.url as unknown as string
      )
    );
  }, [size, attributes]);

  return (
    <div
      className={classNames('relative', containerClassName)}
      style={containerStyle}
    >
      <img
        className={classNames('block', className)}
        src={src}
        srcSet={`${
          formats.length ? `${formats.map((f) => `${f.url} ${f.width}w`)},` : ''
        } ${src} ${attributes.width}w`}
        alt={`${attributes.alternativeText ?? ''}`}
        onError={() => setSrc(imagePlaceholder)}
      />

      {displayCaption && !!attributes.caption && (
        <div className="text-right text-grey-1 !text-sm !leading-4 py-1 px-2 absolute right-0 bottom-0 bg-grey-8/50 rounded-tl-sm">
          {`${attributes.caption}`}
        </div>
      )}
    </div>
  );
};
