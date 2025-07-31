'use client';

import posthog from 'posthog-js';

import { Vignette } from '@/site/app/types';
import Card from '@/site/components/cards/Card';
import CardsWrapper from '@/site/components/cards/CardsWrapper';
import CardsSection from '@/site/components/sections/CardsSection';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { Button } from '@/ui';

type EtapesProps = {
  titre: string;
  contenu: Vignette[] | null;
  cta: string;
};

const Etapes = ({ titre, contenu, cta }: EtapesProps) => {
  return contenu && contenu.length ? (
    <CardsSection
      containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      subtitle={titre}
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
                  <DEPRECATED_StrapiImage
                    data={c.image}
                    displayCaption={false}
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
