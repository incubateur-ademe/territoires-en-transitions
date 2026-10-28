/* eslint-disable @next/next/no-img-element -- remplace `next/image` hors de Next */
import { forwardRef, ImgHTMLAttributes } from 'react';

/* `next/image` hors de Next : une image simple, sans optimisation. */
type StaticImage = Readonly<{ src: string; width?: number; height?: number }>;

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  src: string | StaticImage;
  alt: string;
  priority?: unknown;
  fill?: unknown;
  quality?: unknown;
  placeholder?: unknown;
};

const toImageAttributes = (src: string | StaticImage) =>
  typeof src === 'string'
    ? { src }
    : { src: src.src, width: src.width, height: src.height };

const Image = forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt,
      priority: _priority,
      fill: _fill,
      quality: _quality,
      placeholder: _placeholder,
      ...props
    },
    ref
  ) => <img ref={ref} alt={alt} {...toImageAttributes(src)} {...props} />
);
Image.displayName = 'Image';

export default Image;
