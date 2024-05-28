import Section from '@components/sections/Section';
import PAIButton from './PAIButton';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import Markdown from '@components/markdown/Markdown';
import './styles.css';

type PanierActionsImpactProps = {
  titre: string;
  description: string;
  cta: string;
  image: StrapiItem | undefined;
};

const PanierActionsImpact = ({
  titre,
  description,
  cta,
  image,
}: PanierActionsImpactProps) => {
  return (
    <Section className="flex lg:!flex-row justify-between items-center !gap-12">
      {!!image && (
        <StrapiImage
          data={image}
          containerClassName="max-w-xl lg:max-2xl:max-w-md shrink"
        />
      )}
      <div>
        <h2 className="text-primary-8 max-lg:text-center">{titre}</h2>
        <Markdown
          texte={description}
          className="paragraphe-primary-10 paragraphe-18 panier"
        />
        <PAIButton label={cta} />
      </div>
    </Section>
  );
};

export default PanierActionsImpact;
