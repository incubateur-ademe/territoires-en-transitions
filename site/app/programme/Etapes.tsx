import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {Content} from './utils';

type EtapesProps = {
  titre: string;
  description?: string;
  contenu: Content[];
};

const Etapes = ({titre, description, contenu}: EtapesProps) => {
  return contenu.length ? (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={4}>
          {contenu.map((c, index) => (
            <Card
              key={c.id}
              step={index + 1}
              title={c.titre ?? ''}
              description={c.description}
              className="border border-black"
            />
          ))}
        </CardsWrapper>
      }
    >
      <ButtonWithLink href="/contact" className="mt-6">
        Contactez-nous
      </ButtonWithLink>
    </CardsSection>
  ) : null;
};

export default Etapes;
