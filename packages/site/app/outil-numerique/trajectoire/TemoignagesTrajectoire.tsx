import Section from '@components/sections/Section';
import TestimonialSlideshow from '@components/slideshow/TestimonialSlideshow';
import {StrapiItem} from 'src/strapi/StrapiItem';

type TemoignagesTrajectoireProps = {
  temoignages: {
    id: number;
    auteur: string;
    role: string;
    temoignage: string;
    portrait?: StrapiItem;
  }[];
};

const TemoignagesTrajectoire = ({temoignages}: TemoignagesTrajectoireProps) => {
  return (
    <Section containerClassName="bg-primary-7 max-md:!py-6 md:max-lg:!py-12 lg:!py-20">
      <TestimonialSlideshow
        contenu={temoignages}
        className="rounded-[10px] md:w-3/4 mx-auto"
        dotsColor="orange"
        title="Témoignages de collectivités"
        displayButtons={false}
        autoSlideDelay={12000}
        autoSlide
      />
    </Section>
  );
};

export default TemoignagesTrajectoire;
