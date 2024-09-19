'use client';

import { Button } from '@tet/ui';
import CardsSection from '../components/sections/CardsSection';
import CardsWrapper from '../components/cards/CardsWrapper';
import PictoWithBackground from '../public/pictogrammes/PictoWithBackground';
import InformationPicto from '../public/pictogrammes/InformationPicto';
import CommunityPicto from '../public/pictogrammes/CommunityPicto';
import CalendarPicto from '../public/pictogrammes/CalendarPicto';

type InformationsProps = {
  titre: string;
  description?: string;
  className?: string;
};

const Informations = ({ titre, description, className }: InformationsProps) => {
  return (
    <CardsSection
      title={titre}
      description={description}
      containerClassName={className}
      cardsList={
        <CardsWrapper cols={3} className="!gap-14">
          <div className="flex flex-col items-center gap-8">
            <PictoWithBackground pictogram={<InformationPicto />} />
            <Button
              href="/faq"
              variant="outlined"
              className="w-full justify-center"
            >
              Lire les questions fréquentes
            </Button>
          </div>
          <div className="flex flex-col items-center gap-8">
            <PictoWithBackground pictogram={<CommunityPicto />} />
            <Button
              href="/contact"
              variant="outlined"
              className="w-full justify-center"
            >
              {"Contacter l'équipe"}
            </Button>
          </div>
          <div className="flex flex-col items-center gap-8">
            <PictoWithBackground pictogram={<CalendarPicto />} />
            <Button
              href="https://calendly.com/territoiresentransitions"
              className="w-full justify-center"
              external
            >
              Participer à une démo
            </Button>
          </div>
        </CardsWrapper>
      }
    />
  );
};

export default Informations;
