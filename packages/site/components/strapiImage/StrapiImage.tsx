'use client';

/* eslint-disable @next/next/no-img-element */
import classNames from 'classnames';
import {CSSProperties, useState} from 'react';
import Image from 'next/image';
import {StrapiItem} from 'src/strapi/StrapiItem';

const baseURL = process.env.NEXT_PUBLIC_STRAPI_URL;

type Size = 'large' | 'medium' | 'small' | 'thumbnail';

type StrapiImageProps = {
  data: StrapiItem;
  size?: Size;
  className?: string;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  displayCaption?: boolean;
};

export function StrapiImage({
  data,
  size,
  className,
  containerClassName,
  containerStyle,
  displayCaption = false,
}: StrapiImageProps) {
  const [error, setError] = useState(false);

  const attributes = data.attributes;

  const url =
    size && attributes.formats?.size
      ? `${attributes.formats[size].url}`
      : `${attributes.url}`;

  return !error ? (
    <div className={containerClassName} style={containerStyle}>
      <Image
        className={classNames('block', className)}
        src={url.startsWith('http') ? url : `${baseURL}/${url}`}
        alt={`${attributes.alternativeText ?? ''}`}
        width={attributes.width as unknown as number}
        height={attributes.height as unknown as number}
        placeholder="blur"
        blurDataURL="/blurImage.png"
        onErrorCapture={() => setError(true)}
      />
      {displayCaption && !!attributes.caption && (
        <p className="!text-sm text-[#666] mt-2 mb-0 w-full text-center">
          {`${attributes.caption}`}
        </p>
      )}
    </div>
  ) : null;
}
