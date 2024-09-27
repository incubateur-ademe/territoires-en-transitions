'use client';

import Section from '@tet/site/components/sections/Section';
import CarteAvecFiltres from '@tet/site/components/carte/CarteAvecFiltres';

const Carte = () => {
  return (
    <div>
      <Section>
        <div>
          <h2 className="text-center text-primary-8 mb-4">
            De nombreuses collectivités ont déjà franchi le cap !
          </h2>

          <p className="text-center text-grey-8 text-2xl mb-2">
            Parcourez notre carte interactive et découvrez les collectivités.
          </p>

          <p className="text-center text-info-1 italic text-sm mb-0">
            Seules les collectivités labellisées disposent d’une page
            personnalisée.
          </p>
        </div>

        <CarteAvecFiltres />
      </Section>
    </div>
  );
};

export default Carte;
