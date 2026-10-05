import { StrapiMedia } from './types';

// Isomorphe : importé par des composants serveur comme client. Ne lire ici
// qu'une variable NEXT_PUBLIC_ (inlinée au build).
const strapiBaseUrl = (process.env.NEXT_PUBLIC_STRAPI_URL ?? '').replace(
  /\/+$/,
  ''
);

/**
 * URL absolue d'un média : Strapi Cloud renvoie déjà une URL absolue, le
 * provider d'upload local un chemin `/uploads/…` relatif à Strapi.
 */
export const getStrapiMediaUrl = (url: string): string =>
  /^(https?:)?\/\/|^data:/.test(url)
    ? url
    : `${strapiBaseUrl}/${url.replace(/^\/+/, '')}`;

/** Texte alternatif saisi ; jamais le nom du fichier, qui n'aide personne. */
const getAlt = (media: StrapiMedia) => {
  const alt = media.alternativeText?.trim();
  return alt && alt !== media.name ? alt : '';
};

type Candidate = {
  url: string;
  width: number;
  height: number;
  size: number;
  mime: string;
};

/** L'original et ses formats redimensionnés, dimensions connues. */
const getCandidates = (media: StrapiMedia): Candidate[] => {
  const formats = Object.values(media.formats ?? {}).map((format) => ({
    url: format.url,
    width: format.width,
    height: format.height,
    size: format.size,
    mime: format.mime,
  }));
  const original = {
    url: media.url,
    width: media.width ?? 0,
    height: media.height ?? 0,
    size: media.size,
    mime: media.mime,
  };
  return [...formats, original].filter((c) => c.width > 0 && c.height > 0);
};

export type StrapiImageProps = {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  alt: string;
};

/**
 * Attributs d'un `<img>` responsive : l'original et ses formats en `srcSet`.
 * Strapi ne convertit pas : une réduction de PNG pèse souvent plus que la
 * source. Dans ce cas l'original, plus net et plus léger, est servi seul :
 * retirer seulement les formats trop lourds laisserait un trou de largeur où
 * Chrome choisirait la variante trop petite, donc floue.
 */
export const getStrapiImageProps = (
  media: StrapiMedia,
  sizes: string
): StrapiImageProps => {
  const candidates = getCandidates(media)
    .sort((a, b) => a.width - b.width)
    .filter((c, i, all) => i === 0 || c.width !== all[i - 1].width);
  const formatHeavierThanOriginal = candidates.some(
    (c) => c.url !== media.url && c.size > media.size
  );

  const hasSrcSet =
    media.mime !== 'image/svg+xml' &&
    !formatHeavierThanOriginal &&
    candidates.length > 1;

  return {
    src: getStrapiMediaUrl(media.url),
    srcSet: hasSrcSet
      ? candidates
          .map((c) => `${getStrapiMediaUrl(c.url)} ${c.width}w`)
          .join(', ')
      : undefined,
    sizes: hasSrcSet ? sizes : undefined,
    width: media.width ?? undefined,
    height: media.height ?? undefined,
    alt: getAlt(media),
  };
};

export type OpenGraphImage = {
  url: string;
  width: number;
  height: number;
  type: string;
  alt?: string;
};

const OPEN_GRAPH_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const OPEN_GRAPH_MIN_WIDTH = 1200;
/** Strapi exprime `size` en Ko ; au-delà de 5 Mo, X refuse l'image. */
const OPEN_GRAPH_MAX_SIZE = 5 * 1024;

/**
 * Image de partage : le plus petit format d'au moins 1200 px de large (taille
 * recommandée par les réseaux), sinon le plus grand qui reste sous 5 Mo.
 * Les formats que les réseaux n'affichent pas (SVG, AVIF…) sont écartés.
 */
export const toOpenGraphImage = (
  media: StrapiMedia | null | undefined
): OpenGraphImage | undefined => {
  if (!media) return undefined;

  const candidates = getCandidates(media)
    .filter(
      (c) => OPEN_GRAPH_MIMES.includes(c.mime) && c.size <= OPEN_GRAPH_MAX_SIZE
    )
    .sort((a, b) => a.width - b.width);
  const best =
    candidates.find((c) => c.width >= OPEN_GRAPH_MIN_WIDTH) ??
    candidates.at(-1);
  if (!best) return undefined;

  const alt = getAlt(media);
  return {
    url: getStrapiMediaUrl(best.url),
    width: best.width,
    height: best.height,
    type: best.mime,
    alt: alt || undefined,
  };
};
