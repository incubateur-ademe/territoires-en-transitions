import BlogCard from '@/site/components/cards/BlogCard';
import CardsWrapper from '@/site/components/cards/CardsWrapper';
import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import { StrapiMedia } from '@/site/src/strapi/types';

type ServicesProps = {
  titre: string;
  contenu:
    | {
        documentId: string;
        uid: string;
        titre: string;
        description: string;
        image?: StrapiMedia;
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
      <TitreSection>{titre}</TitreSection>
      <CardsWrapper cols={3}>
        {contenu.length > 0 &&
          contenu.map((c) => (
            <BlogCard
              key={c.documentId}
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
