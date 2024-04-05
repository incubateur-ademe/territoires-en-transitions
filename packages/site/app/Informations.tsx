'use client';

/* eslint-disable react/no-unescaped-entities */
import {Button} from '@tet/ui';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import PictoWithBackground from 'public/pictogrammes/PictoWithBackground';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {StrapiImage} from '@components/strapiImage/StrapiImage';

type InformationsProps = {
  titre: string;
  cta: {
    label: string;
    url: string;
    image: StrapiItem;
  }[];
  className?: string;
  pictobackgroundFill?: string;
};

const Informations = ({
  titre,
  cta,
  className,
  pictobackgroundFill,
}: InformationsProps) => {
  return (
    <CardsSection
      title={titre}
      containerClassName={className}
      cardsList={
        <CardsWrapper cols={3} className="!gap-14">
          {cta.map((card, index) => (
            <div key={card.label} className="flex flex-col items-center gap-8">
              <PictoWithBackground
                fill={pictobackgroundFill}
                pictogram={
                  <StrapiImage
                    data={card.image}
                    containerClassName="min-w-[70px] w-[70px]"
                  />
                }
              />
              <Button
                href={card.url}
                className="w-full justify-center"
                external={!card.url.startsWith('/')}
              >
                {card.label}
              </Button>
            </div>
          ))}
        </CardsWrapper>
      }
    />
  );
};

export default Informations;
