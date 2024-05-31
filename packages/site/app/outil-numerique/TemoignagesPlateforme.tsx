import Section from '@components/sections/Section';
import TestimonialSlideshow from '@components/slideshow/TestimonialSlideshow';
import {StrapiItem} from 'src/strapi/StrapiItem';

type TemoignagesPlateformeProps = {
  temoignages: {
    id: number;
    auteur: string;
    role: string;
    temoignage: string;
    portrait?: StrapiItem;
  }[];
};

const TemoignagesPlateforme = ({temoignages}: TemoignagesPlateformeProps) => {
  return (
    <Section
      containerClassName="bg-primary-7 max-md:!p-2"
      className="max-md:p-0"
    >
      <TestimonialSlideshow
        contenu={temoignages}
        className="rounded-[10px] max-md:border-x-[3px] max-md:border-orange-1 w-3/4 mx-auto"
        dotsColor="orange"
        displayButtons={false}
        autoSlideDelay={12000}
        autoSlide
      />
    </Section>
  );
};

export default TemoignagesPlateforme;
