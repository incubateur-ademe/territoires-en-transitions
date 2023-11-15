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
      containerClassName="md:bg-primary-7 max-md:!p-0"
      className="max-md:p-0"
    >
      <TestimonialSlideshow
        contenu={temoignages}
        className="rounded-[10px] max-md:border-x-[3px] max-md:border-orange-1 md:w-3/4 mx-auto"
        dotsColor="orange"
        displayButtons={false}
        autoSlide
      />
    </Section>
  );
};

export default TemoignagesPlateforme;
