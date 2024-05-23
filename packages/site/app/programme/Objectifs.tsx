import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {Content} from './types';
import Card from '@components/cards/Card';

type ObjectifsProps = {
  titre: string;
  description?: string;
  contenu: Content[] | null;
};

const Objectifs = ({titre, description, contenu}: ObjectifsProps) => {
  return contenu && contenu.length ? (
    <CardsSection
      title={titre}
      textClassname="text-center"
      className="px-0"
      description={description}
      cardsList={
        <CardsWrapper cols={5} className="gap-8">
          {contenu.map((c, index) => (
            <Card
              key={index}
              className="!border-primary-3 !gap-4 xl:!gap-5 !p-4 xl:!p-5"
              description={c.description}
              textClassName="text-center small-text"
              image={
                c.image ? (
                  <StrapiImage
                    data={c.image}
                    displayCaption={false}
                    containerClassName="bg-[#FEF4F2] rounded-lg h-[116px] flex justify-center items-center"
                    className="max-w-[70%] max-h-[70%]"
                  />
                ) : undefined
              }
            />
          ))}
        </CardsWrapper>
      }
    />
  ) : null;
};

export default Objectifs;
