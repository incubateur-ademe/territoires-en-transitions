'use client';

import CarteAvecFiltres from '@/site/components/carte/CarteAvecFiltres';
import Section from '@/site/components/sections/Section';

const Carte = () => {
  return (
    <Section containerClassName="max-lg:bg-gradient-to-b max-lg:from-[#F4F5FD] max-lg:to-[#FFFFFF]">
      <div>
        <h2 className="text-center text-primary-8 mb-4">
          De nombreuses collectivités ont déjà franchi le cap !
        </h2>

        <p className="text-center text-grey-8 text-2xl mb-2">
          Parcourez notre carte interactive et découvrez les collectivités
        </p>

        <p className="text-center text-info-1 italic text-sm mb-0">
          Cliquez sur les collectivités labellisées pour découvrir leur page
          personnalisée
        </p>
      </div>

      <CarteAvecFiltres />
    </Section>
  );
};

export default Carte;
