'use client';

import {Button} from '@tet/ui';
import Section from '@components/sections/Section';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import Markdown from '@components/markdown/Markdown';
import './styles.css';

type TrajectoireProps = {
  titre: string;
  description: string;
  cta: string;
  image: StrapiItem | undefined;
};

const Trajectoire = ({titre, description, cta, image}: TrajectoireProps) => {
  return (
    <Section
      className="flex lg:!flex-row justify-between items-center !gap-12"
      containerClassName="bg-primary-0 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
    >
      <div>
        <h2 className="text-primary-8 max-lg:text-center">{titre}</h2>
        <Markdown
          texte={description}
          className="paragraphe-primary-10 paragraphe-18 markdown_style"
        />
        {/** TODO: ajouter l'url vers l'app */}
        <Button href="/trajectoire" className="mt-6 max-lg:mx-auto">
          {cta}
        </Button>
      </div>
      {!!image && (
        <StrapiImage
          data={image}
          containerClassName="w-fit shrink max-lg:order-first"
          className="h-64 sm:h-96 w-auto max-w-full sm:max-w-xl lg:max-2xl:max-w-md object-scale-down"
        />
      )}
    </Section>
  );
};

export default Trajectoire;
