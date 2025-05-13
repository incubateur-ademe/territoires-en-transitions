import { Vignette } from '@/site/app/types';
import Card from '@/site/components/cards/Card';
import CardsWrapper from '@/site/components/cards/CardsWrapper';
import CardsSection from '@/site/components/sections/CardsSection';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';

type BeneficesProps = {
  titre: string;
  contenu: Vignette[] | null;
};

const Benefices = ({ titre, contenu }: BeneficesProps) => {
  return contenu && contenu.length ? (
    <CardsSection
      containerClassName="bg-primary-0 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      title={titre}
      cardsList={
        <CardsWrapper cols={2}>
          {contenu.map((c) => (
            <Card
              key={c.id}
              title={c.titre ?? ''}
              description={c.legende ?? ''}
              image={
                c.image ? (
                  <DEPRECATED_StrapiImage
                    data={c.image}
                    displayCaption={false}
                    className="w-full h-[200px] object-cover"
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

export default Benefices;
