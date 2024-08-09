import Card from '@tet/site/components/cards/Card';
import CardsWrapper from '@tet/site/components/cards/CardsWrapper';
import CardsSection from '@tet/site/components/sections/CardsSection';
import { StrapiImage } from '@tet/site/components/strapiImage/StrapiImage';
import { AccompagnementContent } from './types';

type AccompagnementProps = {
  titre: string;
  description?: string;
  contenu: AccompagnementContent[];
};

const Accompagnement = ({
  titre,
  description,
  contenu,
}: AccompagnementProps) => {
  return (
    <CardsSection
      title={titre}
      description={description}
      containerClassName="bg-primary-1"
      cardsList={
        <CardsWrapper cols={2}>
          {contenu.map((c, index) => (
            <Card
              key={index}
              className="border-none"
              title={c.titre}
              description={c.description}
              button={{ title: c.button.titre, href: c.button.href }}
              image={
                <StrapiImage
                  data={c.image}
                  className="max-h-[200px]"
                  containerClassName="w-full h-full flex justify-center items-start"
                  displayCaption={false}
                />
              }
              imagePosition="left"
            />
          ))}
        </CardsWrapper>
      }
    />
  );
};

export default Accompagnement;
