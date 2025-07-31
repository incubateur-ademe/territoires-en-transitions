import ThreePicsMosaic from '@/site/components/galleries/ThreePicsMosaic';
import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import classNames from 'classnames';
import { ParagrapheData } from './types';

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
          <DEPRECATED_StrapiImage
            data={images[0]}
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
          <DEPRECATED_StrapiImage
            data={imageTitre}
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
