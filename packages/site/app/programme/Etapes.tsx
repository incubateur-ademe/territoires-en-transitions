'use client';

import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {Content} from './types';
import {Button} from '@tet/ui';

type EtapesProps = {
  titre: string;
  contenu: Content[] | null;
  cta: {
    label: string;
    url: string;
  };
};

const Etapes = ({titre, contenu, cta}: EtapesProps) => {
  return contenu && contenu.length ? (
    <CardsSection
      containerClassName="bg-primary-1"
      title={titre}
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
      <Button
        href={cta.url}
        external={!cta.url.startsWith('/')}
        className="mt-6"
      >
        {cta.label}
      </Button>
    </CardsSection>
  ) : null;
};

export default Etapes;
