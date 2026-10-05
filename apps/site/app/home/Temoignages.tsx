import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import TestimonialSlideshow from '@/site/components/slideshow/TestimonialSlideshow';
import { StrapiMedia } from '@/site/src/strapi/types';

type TemoignagesProps = {
  contenu: {
    id: number;
    auteur: string;
    role: string;
    temoignage: string;
    portrait?: StrapiMedia | null;
  }[];
};

const Temoignages = ({ contenu }: TemoignagesProps) => {
  return contenu.length > 1 ? (
    <Section className="py-8 gap-8" containerClassName="bg-primary-1">
      <TitreSection>Ce que disent les collectivités</TitreSection>
      <TestimonialSlideshow
        contenu={contenu}
        className="rounded-md max-md:p-2 md:w-3/4 max-w-full mx-auto md:border border-primary-3"
        dotsColor="orange"
        backgroundColor="bg-white md:bg-primary-0"
        displayButtons={false}
        autoSlideDelay={12_000}
        autoSlide
      />
    </Section>
  ) : null;
};

export default Temoignages;
