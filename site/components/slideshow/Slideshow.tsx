'use client';

import classNames from 'classnames';
import {useEffect, useState} from 'react';

type SlideshowProps = {
  slides: React.ReactNode[];
  className?: string;
};

/**
 * Diaporama manuel sur un tableau de composants donnés en props
 */

const Slideshow = ({slides, className}: SlideshowProps) => {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => setSlideIndex(0), [slides.length]);

  const handleChangeIndex = (increment: number) => {
    const index = slideIndex + increment;
    if (index < 0) setSlideIndex(slides.length - 1);
    else if (index >= slides.length) setSlideIndex(0);
    else setSlideIndex(index);
  };

  return (
    <div className={classNames('flex justify-between items-center', className)}>
      {slides.length > 1 && (
        <button
          className="fr-btn fr-icon-arrow-left-s-line rounded-md"
          title="previous"
          onClick={() => handleChangeIndex(-1)}
        />
      )}

      <div className="mx-auto">{slides[slideIndex]}</div>

      {slides.length > 1 && (
        <button
          className="fr-btn fr-icon-arrow-right-s-line rounded-md"
          title="next"
          onClick={() => handleChangeIndex(1)}
        />
      )}
    </div>
  );
};

export default Slideshow;
