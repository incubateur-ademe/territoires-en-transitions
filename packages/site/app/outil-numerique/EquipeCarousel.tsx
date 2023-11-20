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
  // Constantes à mettre à jour en cas de changement de format des cartes
  const cardWidth = 169;
  const gapWidth = 16;
  const initDelta = cardWidth / 2 - gapWidth;
  const cardWithGapWidth = cardWidth + gapWidth;
  // cardWidth / 2 = 84.5 = milieu d'une carte
  // cardWithGapWidth = 185 = largeur de la carte 169px + largeur du gap 16px

  const [maxPosition, setMaxPosition] = useState(
    -(width / 2) + initDelta + cardWithGapWidth * (liste.length - 1),
  );
  const [minPosition, setMinPosition] = useState(-(width / 2) + initDelta);
  const [position, setPosition] = useState(minPosition);

  useEffect(() => {
    setMaxPosition(
      -(width / 2) + initDelta + cardWithGapWidth * (liste.length - 1),
    );
    setMinPosition(-(width / 2) + initDelta);
    setPosition(-(width / 2) + initDelta);
  }, [width, liste.length, initDelta, cardWithGapWidth]);

  // Calcul de la nouvelle position dans le carousel
  const handleChangeCard = useCallback(
    (increment: 'next' | 'previous') => {
      const newPosition =
        position +
        (increment === 'next' ? cardWithGapWidth : -cardWithGapWidth);

      if (newPosition < minPosition) setPosition(maxPosition);
      else if (newPosition > maxPosition) setPosition(minPosition);
      else setPosition(newPosition);
    },
    [position, minPosition, maxPosition, cardWithGapWidth],
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
