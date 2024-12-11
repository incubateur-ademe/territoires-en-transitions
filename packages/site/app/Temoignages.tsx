import Section from '@/site/components/sections/Section';
import TestimonialSlideshow from '@/site/components/slideshow/TestimonialSlideshow';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

type TemoignagesProps = {
  titre: string;
  contenu: {
    id: number;
    auteur: string;
    role: string;
    temoignage: string;
    portrait?: StrapiItem;
  }[];
};

const Temoignages = ({ titre, contenu }: TemoignagesProps) => {
  return contenu.length > 1 ? (
    <Section containerClassName="max-md:!py-6 md:max-lg:!py-12 lg:!py-18">
      {!!titre.trim() && <h2 className="text-center max-md:mb-2">{titre}</h2>}
      <TestimonialSlideshow
        contenu={contenu}
        className="rounded-md max-md:p-2 md:w-3/4 max-w-full mx-auto md:border border-primary-3"
        dotsColor="orange"
        backgroundColor="bg-white md:bg-primary-0"
        displayButtons={false}
        autoSlideDelay={12000}
        autoSlide
      />
    </Section>
  ) : null;
};

export default Temoignages;
