'use client';

/* eslint-disable react/no-unescaped-entities */
import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Section from '@components/sections/Section';
import CarteAvecFiltres from '@components/carte/CarteAvecFiltres';

const Carte = () => {
  return (
    <Section id="carte" className="flex-col">
      <h3>De nombreuses collectivités ont déjà franchi le cap !</h3>

      <CarteAvecFiltres />

      {/* <div className="flex flex-col lg:flex-row justify-around items-center gap-y-8 mt-16">
        <div className="flex flex-col items-center bg-[#f5f5fe] p-x-6 py-8 min-w-[300px] w-fit rounded-lg">
          <span className="font-bold text-2xl">500</span> collectivités engagées
        </div>
        <div className="flex flex-col items-center bg-[#f5f5fe] p-x-6 py-8 min-w-[300px] w-fit rounded-lg">
          <span className="font-bold text-2xl">20</span> millions d'habitants
          concernés
        </div>
        <div className="flex flex-col items-center bg-[#f5f5fe] p-x-6 py-8 min-w-[300px] w-fit rounded-lg">
          <span className="font-bold text-2xl">50 %</span> de la population
          française
        </div>
      </div> */}

      <ButtonWithLink href="/faq" secondary rounded className="mt-16 mx-auto">
        Lire les questions fréquentes
      </ButtonWithLink>
    </Section>
  );
};

export default Carte;
