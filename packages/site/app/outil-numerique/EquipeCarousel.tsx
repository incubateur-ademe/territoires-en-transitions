'use client';

import {StrapiItem} from 'src/strapi/StrapiItem';
import EquipeListe from './EquipeListe';
import {useCallback, useEffect, useState} from 'react';
import {useSwipeable} from 'react-swipeable';

type EquipeCarouselProps = {
  liste: {
    id: number;
    titre: string;
    legende: string;
    image: StrapiItem;
  }[];
  width: number;
};

const EquipeCarousel = ({liste, width}: EquipeCarouselProps) => {
  const [maxPosition, setMaxPosition] = useState(
    -(width / 2) + 84.5 - 16 + 185 * (liste.length - 1),
  );
  const [minPosition, setMinPosition] = useState(-(width / 2) + 84.5 - 16);
  const [position, setPosition] = useState(minPosition);

  useEffect(() => {
    setMaxPosition(-(width / 2) + 84.5 - 16 + 185 * (liste.length - 1));
    setMinPosition(-(width / 2) + 84.5 - 16);
    setPosition(-(width / 2) + 84.5 - 16);
    // 185 = largeur de la carte 169px + largeur du gap 16px
    // 84.5 = milieu d'une carte
  }, [width, liste.length]);

  // Calcul de la nouvelle position dans le carousel
  const handleChangeCard = useCallback(
    (increment: 'next' | 'previous') => {
      const newPosition = position + (increment === 'next' ? 185 : -185);

      if (newPosition < minPosition) setPosition(maxPosition);
      else if (newPosition > maxPosition) setPosition(minPosition);
      else setPosition(newPosition);
    },
    [position, minPosition, maxPosition],
  );

  // Changement automatique de la position dans le carousel
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    interval = setInterval(() => {
      handleChangeCard('next');
    }, 5000);

    return () => clearInterval(interval);
  }, [position, handleChangeCard]);

  // Swipe dans le carousel
  const handlers = useSwipeable({
    onSwipedLeft: () => handleChangeCard('next'),
    onSwipedRight: () => handleChangeCard('previous'),
    swipeDuration: 500,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <div className="overflow-hidden w-fit my-12 -ml-4 flex items-center">
      <div
        {...handlers}
        className="flex gap-4"
        style={{
          transition: 'ease 1000ms',
          transform: `translate3d(${-position}px, 0, 0)`,
        }}
      >
        <EquipeListe liste={liste} />
      </div>
    </div>
  );
};

export default EquipeCarousel;
