'use client';

/* eslint-disable react/no-unescaped-entities */
import Section from '@tet/site/components/sections/Section';
import CarteAvecFiltres from '@tet/site/components/carte/CarteAvecFiltres';
import { useEffect, useRef, useState } from 'react';

const Carte = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState('');

  useEffect(() => {
    const url = window.location.href;
    const anchor = url.split('#')[1];
    setAnchor(anchor);
  }, []);

  useEffect(() => {
    if (anchor && anchor === 'carte' && ref && ref.current) {
      setTimeout(() => {
        ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 50);
    }
  }, [ref, anchor]);

  return (
    <div ref={ref}>
      <Section>
        <h2>De nombreuses collectivités ont déjà franchi le cap !</h2>

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
      </Section>
    </div>
  );
};

export default Carte;
