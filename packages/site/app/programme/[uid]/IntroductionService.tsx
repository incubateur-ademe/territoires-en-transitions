import Markdown from '@components/markdown/Markdown';
import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import classNames from 'classnames';
import {StrapiItem} from 'src/strapi/StrapiItem';

type IntroductionServiceProps = {
  titre: string;
  imageTitre?: StrapiItem;
  imageTitreTaille?: string;
  texte: string;
  image: StrapiItem;
};

const IntroductionService = ({
  titre,
  imageTitre,
  imageTitreTaille,
  texte,
  image,
}: IntroductionServiceProps) => {
  return (
    <Section className="lg:flex-row !gap-14 items-center">
      <div className="lg:min-w-[35%] lg:max-w-[35%]">
        <StrapiImage data={image} className="rounded-3xl" />
      </div>
      <div>
        <h1 className={classNames({'mb-3': !!imageTitre})}>{titre}</h1>
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
        <Markdown texte={texte} className="paragraphe-22" />
      </div>
    </Section>
  );
};

export default IntroductionService;
