'use client';

import ImageStrapi from '@/site/components/strapiImage/ImageStrapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { useEffect, useState } from 'react';

type ProgrammeHeroSectionProps = {
  couverture: StrapiItem;
  couvertureMobile?: StrapiItem | null;
};

const ProgrammeHeroSection = ({
  couverture,
  couvertureMobile,
}: ProgrammeHeroSectionProps) => {
  const mdBreakpoint = 768; // 768px = breakpoint sm dans tailwind
  const [windowWidth, setWindowWidth] = useState<number>(mdBreakpoint);

  useEffect(() => {
    const setWidth = () => setWindowWidth(window.innerWidth);

    // Initialisation de windowWith au chargement de la page
    setWidth();

    // Détecte le changement de taille de la fenêtre
    window.addEventListener('resize', setWidth);
    return () => window.removeEventListener('resize', setWidth);
  }, []);

  return windowWidth < mdBreakpoint && couvertureMobile != null ? (
    <ImageStrapi
      strapiImage={couvertureMobile}
      containerClassName="w-full"
      imgClassName="w-full h-auto"
      displayCaption={false}
    />
  ) : (
    <ImageStrapi
      strapiImage={couverture}
      containerClassName="xl:max-w-[1460px] mx-auto"
      imgClassName="w-full h-auto"
      displayCaption={false}
    />
  );
};

export default ProgrammeHeroSection;
