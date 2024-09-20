import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {Content} from './types';

type BeneficesProps = {
  titre: string;
  description?: string;
  contenu: Content[] | null;
};

const Benefices = ({titre, description, contenu}: BeneficesProps) => {
  return contenu && contenu.length ? (
    <CardsSection
      containerClassName="bg-primary-0 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={2}>
          {contenu.map(c => (
            <Card
              key={c.id}
              title={c.titre ?? ''}
              description={c.description}
            />
          ))}
        </CardsWrapper>
      }
    />
  ) : null;
};

export default Benefices;
