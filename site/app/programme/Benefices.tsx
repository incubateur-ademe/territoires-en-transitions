import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {Content} from './utils';

type BeneficesProps = {
  titre: string;
  description?: string;
  contenu: Content[] | null;
};

const Benefices = ({titre, description, contenu}: BeneficesProps) => {
  return contenu && contenu.length ? (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={2}>
          {contenu.map(c => (
            <Card
              key={c.id}
              title={c.titre ?? ''}
              description={c.description}
              className="border border-[#ddd]"
            />
          ))}
        </CardsWrapper>
      }
    />
  ) : null;
};

export default Benefices;
