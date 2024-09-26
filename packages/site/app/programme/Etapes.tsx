'use client';

import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {Content} from './types';
import {Button} from '@tet/ui';

type EtapesProps = {
  titre: string;
  contenu: Content[] | null;
  cta: string;
};

const Etapes = ({titre, contenu, cta}: EtapesProps) => {
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
              description={c.description}
            />
          ))}
        </CardsWrapper>
      }
    >
      <Button href="/contact?objet=programme" className="mt-3 lg:mt-6 mx-auto">
        {cta}
      </Button>
    </CardsSection>
  ) : null;
};

export default Etapes;
