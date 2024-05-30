'use client';

import Section from '@components/sections/Section';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {useEffect, useRef, useState} from 'react';
import {Button} from '@tet/ui';

type EquipePlateformeProps = {
  titre: string;
  citation?: string;
  description?: string;
  liste: {
    id: number;
    titre: string;
    legende: string;
    image: StrapiItem;
  }[];
  cta_contact: string;
};

const EquipePlateforme = ({
  titre,
  citation,
  description,
  liste,
}: EquipePlateformeProps) => {
  const [carouselWidth, setCarouselWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialisation de carouselWidth au chargement de la page
    if (ref && ref.current) {
      const element = ref.current;
      setCarouselWidth(element.clientWidth);

      // Détecte le changement de taille de la fenêtre
      window.addEventListener('resize', () =>
        setCarouselWidth(element.clientWidth),
      );
      return () =>
        window.removeEventListener('resize', () =>
          setCarouselWidth(element.clientWidth),
        );
    }
  }, []);

  return (
    <Section>
      <h2 className="text-primary-8 md:text-center mb-1">{titre}</h2>
      {!!citation && (
        <h4 className="text-primary-7 md:text-center text-[24px] leading-[32px] mb-1">
          {citation}
        </h4>
      )}
      {!!description && (
        <p className="text-primary-10 md:text-center md:text-[18px] leading-[30px] mb-0">
          {description}
        </p>
      )}
    </Section>
  );
};

export default EquipePlateforme;
