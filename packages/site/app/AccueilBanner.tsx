'use client';

import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {useEffect, useState} from 'react';

type AccueilBannerProps = {
  couverture: StrapiItem;
  couvertureMobile: StrapiItem;
};

const AccueilBanner = ({couverture, couvertureMobile}: AccueilBannerProps) => {
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

  return windowWidth < mdBreakpoint ? (
    <StrapiImage
      data={couvertureMobile}
      className="w-full"
      containerClassName="w-full"
      displayCaption={false}
    />
  ) : (
    <StrapiImage
      data={couverture}
      className="w-full max-h-[700px] object-scale-down"
      containerClassName="w-full xl:max-w-[1460px] mx-auto"
      displayCaption={false}
    />
  );
};

export default AccueilBanner;
