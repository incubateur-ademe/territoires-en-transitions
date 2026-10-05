import ThreePicsMosaic from '@/site/components/galleries/ThreePicsMosaic';
import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { StrapiImage } from '@/site/components/strapiImage/strapi-image';
import { StrapiMedia } from '@/site/src/strapi/types';
import classNames from 'classnames';
import { JSX } from 'react';
import { ParagrapheData } from './types';

const IMAGE_WIDTH = 452;
const IMAGE_HEIGHT = 419;

/** Hauteur affichée de l'image de titre (h-6, h-20, h-52). */
const IMAGE_TITRE_HEIGHT = { sm: 24, md: 80, lg: 208 };

const getRatio = (media: StrapiMedia) =>
  media.width && media.height ? media.width / media.height : undefined;

/** En `object-cover` sur une hauteur fixe, une image paysage déborde en largeur. */
const getImageSizes = (media: StrapiMedia) =>
  `${Math.ceil(
    Math.max(IMAGE_WIDTH, IMAGE_HEIGHT * (getRatio(media) ?? 1))
  )}px`;

/** Largeur libre (w-auto) : elle découle de la hauteur choisie et du ratio. */
const getImageTitreSizes = (
  media: StrapiMedia,
  taille: ParagrapheData['tailleImageTitre']
) => {
  const ratio = getRatio(media);
  return ratio
    ? `${Math.ceil(IMAGE_TITRE_HEIGHT[taille ?? 'sm'] * ratio)}px`
    : '100vw';
};

const ParagrapheService = ({
  tailleParagraphe,
  titre,
  titreCentre = false,
  imageTitre,
  tailleImageTitre,
  sousTitre,
  texte,
  images,
  alignementImageDroite,
}: ParagrapheData) => {
  const Titre = (
    tailleParagraphe === 'md' ? 'h2' : 'h1'
  ) as keyof JSX.IntrinsicElements;

  return (
    <Section
      className={classNames('lg:flex-row !gap-14 items-center', {
        'lg:flex-row-reverse': alignementImageDroite,
        'max-lg:flex-col-reverse ':
          alignementImageDroite && tailleParagraphe === 'md',
      })}
    >
      {!!images &&
        images.length > 0 &&
        (tailleParagraphe === 'md' ? (
          <ThreePicsMosaic images={images} />
        ) : (
          <StrapiImage
            media={images[0]}
            sizes={getImageSizes(images[0])}
            containerClassName="w-[452px] max-w-full h-[419px] flex-none"
            className="rounded-3xl border-8 border-primary-3 h-full w-full object-cover"
          />
        ))}

      <div className="w-full">
        <Titre
          className={classNames({
            'text-center': titreCentre,
            'mb-3': !!imageTitre || !!sousTitre,
            'mb-0': !imageTitre && !sousTitre && !texte,
          })}
        >
          {titre}
        </Titre>

        <h3
          className={classNames('text-primary-7', {
            'text-center': titreCentre,
            'mb-3': !!imageTitre,
            'mb-0': !imageTitre && !texte,
          })}
        >
          {sousTitre}
        </h3>

        {!!imageTitre && (
          <StrapiImage
            media={imageTitre}
            sizes={getImageTitreSizes(imageTitre, tailleImageTitre)}
            className={classNames('mb-6 w-auto', {
              'mx-auto': titreCentre,
              'mb-0': !texte,
              'h-6': tailleImageTitre === 'sm' || !tailleImageTitre,
              'h-20': tailleImageTitre === 'md',
              'h-52': tailleImageTitre === 'lg',
            })}
          />
        )}

        {!!texte && (
          <Markdown
            texte={texte}
            className={classNames('-mb-6', {
              'max-md:paragraphe-18 md:paragraphe-22':
                tailleParagraphe === 'lg' || !tailleParagraphe,
              'paragraphe-18': tailleParagraphe === 'md',
            })}
          />
        )}
      </div>
    </Section>
  );
};

export default ParagrapheService;
