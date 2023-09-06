import BlogCard from '@components/cards/BlogCard';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {Content} from './types';

type ServicesProps = {
  titre: string;
  description?: string;
  contenu: Content[] | null;
};

const Services = ({titre, description, contenu}: ServicesProps) => {
  return contenu && contenu.length ? (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={3}>
          {contenu.length > 0 &&
            contenu.map(c => (
              <BlogCard
                key={c.id}
                title={c.titre ?? ''}
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
                href={c.href}
              />
            ))}
        </CardsWrapper>
      }
    />
  ) : null;
};

export default Services;
