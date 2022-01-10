import React from 'react';

/**
 * A chevron that can be either pointing left or down and animates
 * between transitions.
 */
export const Chevron = (props: {direction: 'left' | 'down'}) => {
  return (
    <div
      className={
        '' +
        'transition-transform duration-300 transform ' +
        'origin-right text-2xl scale-100' +
        (props.direction === 'down'
          ? ' rotate-90 translate-y-4 translate-x-0'
          : ' rotate-0 translate-y-0 translate-x-0')
      }
      aria-hidden={true}
    >
      <span className="fr-fi-arrow-right-s-line" aria-hidden={true} />
    </div>
  );
};
