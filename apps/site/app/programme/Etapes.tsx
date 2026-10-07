'use client';

import posthog from 'posthog-js';

import Card from '@/site/components/cards/Card';
import CardsWrapper from '@/site/components/cards/CardsWrapper';
import CardsSection from '@/site/components/sections/CardsSection';
import { StrapiImage } from '@/site/components/strapiImage/strapi-image';
import { VignetteAvecMarkdown } from '@/site/src/strapi/types';
import { Button } from '@tet/ui';

type EtapesProps = {
  titre: string;
  contenu: VignetteAvecMarkdown[] | null;
  cta: string;
};

const Etapes = ({ titre, contenu, cta }: EtapesProps) => {
  return contenu && contenu.length ? (
    <CardsSection
      containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      title={titre}
      cardsList={
        <CardsWrapper cols={4}>
          {contenu.map((c, index) => (
            <Card
              key={c.id}
              step={index + 1}
              subtitle={c.titre ?? ''}
              description={c.legende ?? ''}
              image={
                c.image ? (
                  <StrapiImage
                    media={c.image}
                    sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
                    className="w-full h-[200px] object-cover"
                  />
                ) : undefined
              }
            />
          ))}
        </CardsWrapper>
      }
    >
      <Button
        href="/contact?objet=programme"
        onClick={() => posthog.capture('demarrer_programme')}
        className="mt-3 lg:mt-6 mx-auto"
      >
        {cta}
      </Button>
    </CardsSection>
  ) : null;
};

export default Etapes;
