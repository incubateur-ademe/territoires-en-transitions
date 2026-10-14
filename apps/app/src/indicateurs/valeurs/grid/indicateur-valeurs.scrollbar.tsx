import { appLabels } from '@/app/labels/catalog';
import type { CSSProperties } from 'react';

/** A native range keeps pointer and keyboard navigation visible on every OS. */
export const IndicateurValeursScrollbar = ({
  scrollLeft,
  viewportWidth,
  contentWidth,
  controls,
  onScroll,
}: {
  scrollLeft: number;
  viewportWidth: number;
  contentWidth: number;
  controls: string;
  onScroll: (left: number) => void;
}) => {
  const maxScrollLeft = contentWidth - viewportWidth;
  if (maxScrollLeft <= 1) return null;

  return (
    <input
      type="range"
      min={0}
      max={maxScrollLeft}
      step="any"
      value={scrollLeft}
      aria-label={appLabels.indicateurTableDefilement}
      aria-controls={controls}
      aria-valuetext={`${Math.round((scrollLeft / maxScrollLeft) * 100)} %`}
      data-test="indicateurs.valeurs.scrollbar"
      // Taking control interrupts any automatic scroll toward a new period.
      onFocus={() => onScroll(scrollLeft)}
      onChange={(event) => onScroll(event.currentTarget.valueAsNumber)}
      style={
        {
          '--scroll-thumb-width': `${Math.max(
            24,
            (viewportWidth * viewportWidth) / contentWidth
          )}px`,
        } as CSSProperties
      }
      className="block h-6 w-full cursor-pointer appearance-none rounded-full bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-7 [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-grey-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-[var(--scroll-thumb-width)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-grey-7 [&::-moz-range-track]:h-3 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-grey-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-[var(--scroll-thumb-width)] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-grey-7"
    />
  );
};
