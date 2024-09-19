import Card from '@tet/site/components/cards/Card';
import CardsWrapper from '@tet/site/components/cards/CardsWrapper';
import CardsSection from '@tet/site/components/sections/CardsSection';
import { Content } from './types';

type BeneficesProps = {
  titre: string;
  description?: string;
  contenu: Content[] | null;
};

const Benefices = ({ titre, description, contenu }: BeneficesProps) => {
  return contenu && contenu.length ? (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={2}>
          {contenu.map((c) => (
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
