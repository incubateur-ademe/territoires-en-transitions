import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {Content} from './programme/types';
import Card from '@components/cards/Card';

type ObjectifsProps = {
  titre: string;
  contenu: Content[] | null;
};

const Objectifs = ({titre, contenu}: ObjectifsProps) => {
  return contenu && contenu.length ? (
    <CardsSection
      title={titre}
      textClassname="text-center"
      containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      cardsList={
        <CardsWrapper cols={5} className="max-md:gap-4 gap-8 mt-3">
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
