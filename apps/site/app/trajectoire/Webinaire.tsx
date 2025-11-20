'use client';

import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { Button } from '@tet/ui';

type WebinaireProps = {
  titre: string;
  description: string;
  cta: string;
  url: string;
};

const Webinaire = ({ titre, description, cta, url }: WebinaireProps) => {
  if (url === null) return null;

  return (
    <Section
      containerClassName="bg-primary-7 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      className="gap-6"
    >
      <h2 className="text-center text-grey-1 mb-0">{titre}</h2>
      <Markdown
        texte={description}
        className="text-center paragraphe-22 markdown_style text-white"
      />
      <Button href={url} variant="white" className="mx-auto">
        {cta}
      </Button>
    </Section>
  );
};

export default Webinaire;
