'use client';

import classNames from 'classnames';
import {useEffect, useState} from 'react';

type SlideshowProps = {
  slides: React.ReactNode[];
  autoSlide?: boolean;
  autoSlideDelay?: number;
  className?: string;
};

/**
 * Diaporama manuel sur un tableau de composants donnés en props
 */

const Slideshow = ({
  slides,
  className,
  autoSlide = false,
  autoSlideDelay = 5000,
}: SlideshowProps) => {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (autoSlide) {
      interval = setInterval(() => {
        handleChangeIndex('next');
      }, autoSlideDelay);
    }

    return () => clearInterval(interval);
  }, [slideIndex]);

  const handleChangeIndex = (increment: 'next' | 'previous') => {
    const index = slideIndex + (increment === 'next' ? 1 : -1);
    if (index < 0) setSlideIndex(slides.length - 1);
    else if (index >= slides.length) setSlideIndex(0);
    else setSlideIndex(index);
  };

  return (
    <div
      className={classNames(
        'flex justify-between items-center min-h-[250px]',
        className,
      )}
    >
      {slides.length > 1 && (
        <button
          className="fr-btn fr-icon-arrow-left-s-line rounded-md min-w-[40px]"
          title="previous"
          onClick={() => handleChangeIndex('previous')}
        />
      )}

      <div className="overflow-hidden">
        <div
          className="whitespace-nowrap"
          style={{
            transition: 'ease 1000ms',
            transform: `translate3d(${-slideIndex * 100}%, 0, 0)`,
          }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="inline-block whitespace-normal w-full">
              <div className="flex justify-center">{slide}</div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <button
          className="fr-btn fr-icon-arrow-right-s-line rounded-md min-w-[40px]"
          title="next"
          onClick={() => handleChangeIndex('next')}
        />
      )}
    </div>
  );
};

export default Slideshow;
