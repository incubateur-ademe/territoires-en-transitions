import ThreePicsMosaic from '@components/galleries/ThreePicsMosaic';
import Markdown from '@components/markdown/Markdown';
import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import classNames from 'classnames';
import {StrapiItem} from 'src/strapi/StrapiItem';

type ParagrapheServiceProps = {
  titre?: string;
  imageTitre?: StrapiItem;
  imageTitreTaille?: string;
  texte: string;
  images?: StrapiItem[];
  alignementImageDroite?: boolean;
};

const ParagrapheService = ({
  titre,
  imageTitre,
  imageTitreTaille,
  texte,
  images,
  alignementImageDroite,
}: ParagrapheServiceProps) => {
  return (
    <Section
      className={classNames('lg:flex-row !gap-14 items-center', {
        'max-lg:flex-col-reverse lg:flex-row-reverse': alignementImageDroite,
      })}
    >
      {!!images && images.length > 0 && <ThreePicsMosaic images={images} />}

      <div>
        <h2 className={classNames({'mb-3': !!imageTitre})}>{titre}</h2>
        {!!imageTitre && (
          <StrapiImage
            data={imageTitre}
            className={classNames('mb-6', {
              'h-6': imageTitreTaille === 'sm' || !imageTitreTaille,
              'h-20': imageTitreTaille === 'md',
              'h-52': imageTitreTaille === 'lg',
            })}
          />
        )}
        <Markdown texte={texte} className="paragraphe-18" />
      </div>
    </Section>
  );
};

export default ParagrapheService;
