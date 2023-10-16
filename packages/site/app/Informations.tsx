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
  className?: string;
};

const Informations = ({titre, description, className}: InformationsProps) => {
  return (
    <CardsSection
      title={titre}
      description={description}
      containerClassName={className}
      cardsList={
        <CardsWrapper cols={3} className="!gap-14">
          <div className="flex flex-col items-center gap-8">
            <PictoWithBackground pictogram={<InformationPicto />} />
            <ButtonWithLink href="/faq" tertiary fullWidth>
              Lire les questions fréquentes
            </ButtonWithLink>
          </div>
          <div className="flex flex-col items-center gap-8">
            <PictoWithBackground pictogram={<CommunityPicto />} />
            <ButtonWithLink href="/contact" tertiary fullWidth>
              Contacter l'équipe
            </ButtonWithLink>
          </div>
          <div className="flex flex-col items-center gap-8">
            <PictoWithBackground pictogram={<CalendarPicto />} />
            <ButtonWithLink
              href="https://calendly.com/territoiresentransitions"
              fullWidth
              external
            >
              Participer à une démo
            </ButtonWithLink>
          </div>
        </CardsWrapper>
      }
    />
  );
};

export default Informations;
