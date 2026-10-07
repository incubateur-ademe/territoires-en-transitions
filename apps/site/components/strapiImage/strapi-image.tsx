'use client';

/* eslint-disable @next/next/no-img-element -- `<img>` natif choisi : les
   formats Strapi servent de srcset, sans passer par l'optimiseur de Next. */
import { getStrapiImageProps } from '@/site/src/strapi/media';
import { StrapiMedia } from '@/site/src/strapi/types';
import classNames from 'classnames';
import { CSSProperties, useState } from 'react';

const PLACEHOLDER = '/placeholder.svg';

type StrapiImageProps = {
  media: StrapiMedia | null | undefined;
  /**
   * Largeur affichée selon le viewport, ex. `(min-width: 1024px) 50vw, 100vw`.
   * Obligatoire : sans elle, le navigateur suppose 100vw et télécharge trop
   * lourd pour une vignette. Dans le doute, surestimer plutôt que sous-estimer.
   */
  sizes: string;
  className?: string;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  /** Affiche la légende (`caption`) du média en surimpression. */
  caption?: boolean;
  /** Image au-dessus de la ligne de flottaison : chargée tout de suite, en priorité. */
  priority?: boolean;
  /** Remplace le texte alternatif du média. */
  alt?: string;
  /**
   * Pose `width`/`height` pour réserver la place (CLS). Seulement pour une
   * image en largeur libre et hauteur automatique : avec une hauteur imposée,
   * ces attributs la déformeraient.
   */
  withIntrinsicSize?: boolean;
};

export const StrapiImage = ({
  media,
  sizes,
  className,
  containerClassName,
  containerStyle,
  caption = false,
  priority = false,
  alt,
  withIntrinsicSize = false,
}: StrapiImageProps) => {
  const props = media?.url ? getStrapiImageProps(media, sizes) : null;
  // Seul l'échec de chargement est un état : mémorisé par URL, il se réarme
  // dès que la source change.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !props || failedSrc === props.src;

  return (
    <div
      className={classNames('relative', containerClassName)}
      style={containerStyle}
    >
      {failed ? (
        <img
          className={classNames('block bg-grey-1', className)}
          src={PLACEHOLDER}
          alt=""
        />
      ) : (
        <img
          className={classNames('block', className)}
          src={props.src}
          srcSet={props.srcSet}
          sizes={props.sizes}
          width={withIntrinsicSize ? props.width : undefined}
          height={withIntrinsicSize ? props.height : undefined}
          alt={alt ?? props.alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          onError={() => setFailedSrc(props.src)}
        />
      )}

      {caption && !!media?.caption && (
        <div className="text-right text-grey-1 !text-sm !leading-4 py-1 px-2 absolute right-0 bottom-0 bg-grey-8/50 rounded-tl-sm">
          {media.caption}
        </div>
      )}
    </div>
  );
};
