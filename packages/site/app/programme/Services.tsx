import BlogCard from '@/site/components/cards/BlogCard';
import CardsWrapper from '@/site/components/cards/CardsWrapper';
import Section from '@/site/components/sections/Section';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

type ServicesProps = {
  titre: string;
  contenu:
    | {
        id: number;
        uid: string;
        titre: string;
        description: string;
        image: StrapiItem;
        sousPage: boolean;
      }[]
    | null;
};

const Services = ({ titre, contenu }: ServicesProps) => {
  return contenu && contenu.length ? (
    <Section
      className="items-center"
      containerClassName="max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
    >
      <h3 className="text-center mb-4">{titre}</h3>
      <CardsWrapper cols={3}>
        {contenu.length > 0 &&
          contenu.map((c) => (
            <BlogCard
              key={c.id}
              title={c.titre}
              description={c.description}
              image={c.image}
              href={c.sousPage && c.uid ? `/programme/${c.uid}` : undefined}
              background="light"
              fullHeight
            />
          ))}
      </CardsWrapper>
    </Section>
  ) : null;
};

export default Services;
