import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/StrapiItem';

type AccompagnementProps = {
  titre: string;
  description?: string;
  contenu: {
    titre: string;
    description: string;
    image: StrapiItem;
    button: {titre: string; href: string};
  }[];
};

const Accompagnement = ({titre, description, contenu}: AccompagnementProps) => {
  return (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={2}>
          {contenu.map((c, index) => (
            <Card
              key={index}
              title={c.titre}
              description={c.description}
              button={{title: c.button.titre, href: c.button.href}}
              image={
                <picture className="w-full h-full flex justify-center items-start">
                  <StrapiImage data={c.image} className="max-h-[200px]" />
                </picture>
              }
            />
          ))}
        </CardsWrapper>
      }
    />
  );
};

export default Accompagnement;
