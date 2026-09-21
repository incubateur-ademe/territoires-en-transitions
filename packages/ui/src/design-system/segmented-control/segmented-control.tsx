import { JSX, useId } from 'react';

import { cn } from '../../utils/cn';
import { Icon } from '../Icon';

type SegmentedControlOption<V extends string> = {
  value: V;
  label: string;
};

type SegmentedControlSize = 'xs' | 'sm';

type SegmentedControlProps<V extends string> = {
  legend: string;
  isLegendVisible?: boolean;
  options: readonly SegmentedControlOption<V>[];
  value?: NoInfer<V>;
  onChange: (value: NoInfer<V>) => void;
  size?: SegmentedControlSize;
};

type SegmentProps = {
  name: string;
  value: string;
  label: string;
  isChecked: boolean;
  size: SegmentedControlSize;
  onSelect: () => void;
};

const Segment = ({
  name,
  value,
  label,
  isChecked,
  size,
  onSelect,
}: SegmentProps): JSX.Element => (
  <label className="group relative flex flex-1 -ml-px first:ml-0">
    <input
      type="radio"
      name={name}
      value={value}
      checked={isChecked}
      onChange={onSelect}
      className="sr-only peer"
    />
    <span
      className={cn(
        'flex flex-1 items-center justify-center gap-1 min-h-6 text-center cursor-pointer',
        'border border-primary-9 bg-white text-primary-9 font-bold hover:bg-primary-1',
        'group-first:rounded-l-lg group-last:rounded-r-lg',
        'peer-checked:bg-primary-9 peer-checked:text-white',
        'peer-focus-visible:z-10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-9',
        'forced-colors:border-[CanvasText] forced-colors:peer-checked:bg-[Highlight] forced-colors:peer-checked:text-[HighlightText] forced-colors:peer-checked:border-[Highlight] forced-colors:peer-focus-visible:outline-[Highlight]',
        size === 'xs' && 'text-xs py-2 px-3',
        size === 'sm' && 'text-sm py-2.5 px-3.5'
      )}
    >
      {isChecked && <Icon icon="check-line" size={size} aria-hidden />}
      {label}
    </span>
  </label>
);

const SegmentedControl = <V extends string>({
  legend,
  isLegendVisible = false,
  options,
  value,
  onChange,
  size = 'sm',
}: SegmentedControlProps<V>): JSX.Element => {
  const groupId = useId();
  const legendId = `${groupId}-legend`;

  return (
    <fieldset
      role="radiogroup"
      aria-labelledby={legendId}
      className="m-0 p-0 border-0 min-w-0"
    >
      <legend
        id={legendId}
        className={cn(
          'p-0 mb-2 text-sm font-medium text-primary-9',
          !isLegendVisible && 'sr-only'
        )}
      >
        {legend}
      </legend>
      <div className="flex">
        {options.map((option) => (
          <Segment
            key={option.value}
            name={groupId}
            value={option.value}
            label={option.label}
            isChecked={option.value === value}
            size={size}
            onSelect={() => onChange(option.value)}
          />
        ))}
      </div>
    </fieldset>
  );
};

export { SegmentedControl };
export type {
  SegmentedControlOption,
  SegmentedControlProps,
  SegmentedControlSize,
};
