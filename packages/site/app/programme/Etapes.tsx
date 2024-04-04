'use client';

import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {Content} from './types';
import {Button} from '@tet/ui';

type EtapesProps = {
  titre: string;
  description?: string;
  contenu: Content[] | null;
};

const Etapes = ({titre, description, contenu}: EtapesProps) => {
  return contenu && contenu.length ? (
    <CardsSection
      containerClassName="bg-primary-1"
      title={titre}
      description={description}
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
      <Button href="/contact" className="mt-6">
        Contactez-nous
      </Button>
    </CardsSection>
  ) : null;
};

export default Etapes;
