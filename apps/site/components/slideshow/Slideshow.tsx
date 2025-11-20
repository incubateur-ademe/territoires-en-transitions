'use client';

import { Button, ButtonVariant } from '@tet/ui';
import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

type SlideshowProps = {
  slides: React.ReactNode[];
  autoSlide?: boolean;
  autoSlideDelay?: number;
  dotsColor?: 'default' | 'orange';
  displayButtons?: boolean;
  buttonsVariant?: ButtonVariant;
  className?: string;
};

/**
 * Diaporama manuel sur un tableau de composants donnés en props
 */

const Slideshow = ({
  slides,
  autoSlide = false,
  autoSlideDelay = 5000,
  dotsColor = 'default',
  displayButtons = true,
  buttonsVariant = 'grey',
  className,
}: SlideshowProps) => {
  const [slideIndex, setSlideIndex] = useState(0);

  // Changement forcé du slide affiché
  const handleChangeIndex = useCallback(
    (increment: 'next' | 'previous') => {
      const index = slideIndex + (increment === 'next' ? 1 : -1);
      if (index < 0) setSlideIndex(slides.length - 1);
      else if (index >= slides.length) setSlideIndex(0);
      else setSlideIndex(index);
    },
    [slideIndex, slides.length]
  );

  // Changement automatique du slide affiché
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (autoSlide) {
      interval = setInterval(() => {
        handleChangeIndex('next');
      }, autoSlideDelay);
    }

    return () => clearInterval(interval);
  }, [slideIndex, autoSlide, autoSlideDelay, handleChangeIndex]);

  // Permet le swipe
  const handlers = useSwipeable({
    onSwipedLeft: () => handleChangeIndex('next'),
    onSwipedRight: () => handleChangeIndex('previous'),
    swipeDuration: 500,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <div
      {...handlers}
      className={classNames('flex flex-col gap-12', className)}
    >
      <div className="overflow-hidden">
        <div
          className="whitespace-nowrap h-full"
          style={{
            transition: 'ease 1000ms',
            transform: `translate3d(${-slideIndex * 100}%, 0, 0)`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="inline-block whitespace-normal w-full h-full mt-0"
            >
              <div className="flex">{slide}</div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="flex justify-between items-center">
          {displayButtons && (
            <Button
              variant={buttonsVariant}
              icon="arrow-left-s-line"
              size="sm"
              title="previous"
              onClick={() => handleChangeIndex('previous')}
            />
          )}
          <div className="flex gap-3 mx-auto">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={classNames(
                  'rounded-full w-[11px] h-[11px] hover:cursor-pointer',
                  {
                    'bg-primary-7':
                      index === slideIndex && dotsColor === 'default',
                    'bg-orange-1':
                      index === slideIndex && dotsColor === 'orange',
                    'bg-[#D9D9D9] hover:bg-grey-5': index !== slideIndex,
                  }
                )}
                onClick={() => setSlideIndex(index)}
              />
            ))}
          </div>
          {displayButtons && (
            <Button
              variant={buttonsVariant}
              icon="arrow-right-s-line"
              size="sm"
              title="next"
              onClick={() => handleChangeIndex('next')}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Slideshow;
