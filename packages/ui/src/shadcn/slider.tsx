'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import { forwardRef, LegacyRef } from 'react';

import { preset } from '@/ui';
import classNames from 'classnames';
import { cn } from '../utils/cn';

type Props = SliderPrimitive.SliderProps & {
  /**
   * Allow custom colors for different ranges.
   * Array of colors with the length as the number of thumbs minus 1.
   * If set, the default color will be overridden.
   */
  rangeColors?: string[];
};

const Slider = forwardRef(
  (
    { className, rangeColors, ...props }: Props,
    ref: LegacyRef<HTMLSpanElement> | undefined
  ) => {
    const thumbs = props.value || props.defaultValue;

    // To manage multiple ranges,
    // we use gradient on the Track element and hide the Range element.
    // Unfortunately, Radix Slider doesn't support multiple ranges.
    // See github issue: https://github.com/radix-ui/primitives/issues/3332
    const rangeColorGradientValues = rangeColors
      ?.map((color, i) => {
        // first range
        if (i === 0) return `${color} ${props.value?.[i]}%`;
        // last range
        if (i === rangeColors.length - 1)
          return `${color} ${props.value?.[i - 1]}%`;
        // middle ranges
        return `${rangeColors[i]} ${props.value?.[i - 1]}% ${
          props.value?.[i]
        }%`;
      })
      .join(', ');

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track
          className="relative h-1.5 w-full grow rounded-full"
          style={{
            background: rangeColors
              ? `linear-gradient(to right, ${rangeColorGradientValues})`
              : preset.theme.extend.colors.primary[3],
          }}
        >
          <SliderPrimitive.Range
            className={classNames('absolute h-full', {
              'bg-primary': !rangeColors,
            })}
          />
        </SliderPrimitive.Track>
        {thumbs?.map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className="block h-5 w-5 rounded-full border border-grey-4 bg-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
