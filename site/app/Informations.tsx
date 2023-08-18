/* eslint-disable react/no-unescaped-entities */
import ButtonWithLink from '@components/buttons/ButtonWithLink';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import CalendarPicto from 'public/pictogrammes/CalendarPicto';
import CommunityPicto from 'public/pictogrammes/CommunityPicto';
import InformationPicto from 'public/pictogrammes/InformationPicto';
import PictoWithBackground from 'public/pictogrammes/PictoWithBackground';

type InformationsProps = {
  titre: string;
  description?: string;
};

const Informations = ({titre, description}: InformationsProps) => {
  return (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={3} className="!gap-14">
          <div className="flex flex-col items-center gap-8">
            <PictoWithBackground pictogram={<InformationPicto />} />
            <ButtonWithLink href="/faq" secondary fullWidth>
              Lire les questions fréquentes
            </ButtonWithLink>
          </div>
          <div className="flex flex-col items-center gap-8">
            <PictoWithBackground pictogram={<CommunityPicto />} />
            <ButtonWithLink href="/contact" secondary fullWidth>
              Contacter l'équipe
            </ButtonWithLink>
          </div>
          <div className="flex flex-col items-center gap-8">
            <PictoWithBackground pictogram={<CalendarPicto />} />
            <ButtonWithLink href="/" fullWidth>
              Participer à une démo
            </ButtonWithLink>
          </div>
        </CardsWrapper>
      }
    />
  );
};

export default Informations;
