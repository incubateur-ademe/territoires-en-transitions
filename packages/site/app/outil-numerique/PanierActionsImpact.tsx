'use client';

import {Button} from '@tet/ui';
import Section from '@components/sections/Section';
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
          containerClassName="w-fit shrink"
          className="h-64 sm:h-96 w-auto max-w-full sm:max-w-xl lg:max-2xl:max-w-md object-scale-down"
        />
      )}
      <div>
        <h2 className="text-primary-8 max-lg:text-center">{titre}</h2>
        <Markdown
          texte={description}
          className="paragraphe-primary-10 paragraphe-18 panier"
        />
        <Button href="/contact?panier=true" className="mt-6 max-lg:mx-auto">
          {cta}
        </Button>
      </div>
    </Section>
  );
};

export default PanierActionsImpact;
