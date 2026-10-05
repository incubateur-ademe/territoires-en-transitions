import Section from '@/site/components/sections/Section';
import TestimonialSlideshow from '@/site/components/slideshow/TestimonialSlideshow';
import { getStrapiData } from './utils';

const TemoignagesPlateforme = async () => {
  // Même requête que generateMetadata : Next la dédoublonne pendant le rendu.
  const temoignages = (await getStrapiData())?.temoignages ?? [];
  if (temoignages.length === 0) return null;

  return (
    <Section
      containerClassName="bg-primary-7 max-md:!p-2"
      className="max-md:p-0"
    >
      <TestimonialSlideshow
        contenu={temoignages}
        className="rounded-[10px] max-md:border-x-[3px] max-md:border-orange-1 md:w-3/4 max-w-full mx-auto"
        dotsColor="orange"
        displayButtons={false}
        autoSlideDelay={12000}
        autoSlide
      />
    </Section>
  );
};

export default TemoignagesPlateforme;
