/* eslint-disable react/no-unescaped-entities */
import BlogCard from '@tet/site/components/cards/BlogCard';
import CardsWrapper from '@tet/site/components/cards/CardsWrapper';
import Section from '@tet/site/components/sections/Section';
import CodingPicto from '@tet/site/public/pictogrammes/CodingPicto';
import { StrapiImage } from '@tet/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@tet/site/src/strapi/StrapiItem';

type ServicesProps = {
  titre: string;
  description?: string;
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

const Services = ({ titre, description, contenu }: ServicesProps) => {
  return contenu && contenu.length ? (
    <Section containerClassName="bg-primary-1" className="items-center">
      <CodingPicto className="mt-6" size={148} />
      {/* <h2 className="text-primary-9 text-center">{titre}</h2> */}
      <h2 className="text-primary-9 text-center">
        Une offre socle qui comprend deux référentiels d'action{' '}
        <span className="text-orange-1">
          Climat-Air-Énergie et Économie Circulaire
        </span>
        , hébergés sur notre plateforme numérique
      </h2>
      <h3 className="text-primary-9 text-center mb-16">{description}</h3>
      <CardsWrapper cols={3}>
        {contenu.length > 0 &&
          contenu.map((c) => (
            <BlogCard
              key={c.id}
              title={c.titre}
              description={c.description}
              image={
                c.image ? (
                  <StrapiImage
                    data={c.image}
                    className="w-full"
                    displayCaption={false}
                  />
                ) : undefined
              }
              href={c.sousPage && c.uid ? `/programme/${c.uid}` : undefined}
              externalPage
            />
          ))}
      </CardsWrapper>
    </Section>
  ) : null;
};

export default Services;
