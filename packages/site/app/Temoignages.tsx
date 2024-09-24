import Section from '@components/sections/Section';
import TestimonialSlideshow from '@components/slideshow/TestimonialSlideshow';
import {StrapiItem} from 'src/strapi/StrapiItem';

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

const Temoignages = ({titre, contenu}: TemoignagesProps) => {
  return contenu.length > 1 ? (
    <Section>
      {/* <h2 className="text-center max-md:mb-2">{titre}</h2> */}
      <TestimonialSlideshow
        contenu={contenu}
        className="rounded-md md:w-3/4 mx-auto md:border border-primary-3"
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
