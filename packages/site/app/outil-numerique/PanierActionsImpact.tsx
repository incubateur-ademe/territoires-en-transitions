'use client';

import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { Button } from '@/ui';
import posthog from 'posthog-js';

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
    <Section
      className="flex lg:!flex-row justify-between items-center !gap-12"
      containerClassName="border-y border-primary-4 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
    >
      {!!image && (
        <DEPRECATED_StrapiImage
          data={image}
          containerClassName="w-fit shrink"
          className="h-64 sm:h-96 w-auto max-w-full sm:max-w-xl lg:max-2xl:max-w-md object-scale-down"
        />
      )}
      <div>
        <h2 className="text-primary-8 max-lg:text-center">{titre}</h2>
        <Markdown
          texte={description}
          className="paragraphe-primary-10 paragraphe-18 markdown_style colored_marker"
        />
        <Button
          href={`${process.env.NEXT_PUBLIC_PANIER_URL}/landing`}
          onClick={() => posthog.capture('decouvrir_pai')}
          className="mt-6 max-lg:mx-auto"
        >
          {cta}
        </Button>
      </div>
    </Section>
  );
};

export default PanierActionsImpact;
