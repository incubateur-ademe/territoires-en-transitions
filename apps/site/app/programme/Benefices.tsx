import Card from '@/site/components/cards/Card';
import CardsWrapper from '@/site/components/cards/CardsWrapper';
import CardsSection from '@/site/components/sections/CardsSection';
import { StrapiImage } from '@/site/components/strapiImage/strapi-image';
import { VignetteAvecMarkdown } from '@/site/src/strapi/types';

type BeneficesProps = {
  titre: string;
  contenu: VignetteAvecMarkdown[] | null;
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
                  <StrapiImage
                    media={c.image}
                    sizes="(min-width: 1440px) 610px, (min-width: 768px) 50vw, 100vw"
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
