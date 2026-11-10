import { JAUGE_MAX, JAUGE_MIN, JAUGE_STEP } from '@tet/domain/plans';
import { cn, Slider } from '@tet/ui';
import { getJaugeColors } from './get-jauge-colors';

export const JaugeSlider = ({
  value,
  isDisabled,
  ariaLabel,
  className,
  dataTest,
  onValueChange,
  onValueCommit,
}: {
  value: number;
  isDisabled: boolean;
  ariaLabel: string;
  className?: string;
  dataTest?: string;
  onValueChange: (value: number) => void;
  onValueCommit: (value: number) => void;
}) => {
  const colors = getJaugeColors({ jauge: value, isDisabled });
  return (
    <Slider
      aria-label={ariaLabel}
      min={JAUGE_MIN}
      max={JAUGE_MAX}
      step={JAUGE_STEP}
      value={[value]}
      disabled={isDisabled}
      rangeColors={[colors.fill, colors.track]}
      className={cn(
        '[&>span:first-child]:h-2 [&_[role=slider]]:border-2',
        isDisabled
          ? 'cursor-not-allowed [&_[role=slider]]:cursor-not-allowed [&_[role=slider]]:border-grey-5 [&_[role=slider]]:bg-grey-3'
          : cn(
              '[&_[role=slider]]:ring-4 [&_[role=slider]]:shadow-md',
              value === JAUGE_MAX
                ? '[&_[role=slider]]:border-success-1 [&_[role=slider]]:ring-success-1/15'
                : '[&_[role=slider]]:border-primary-9 [&_[role=slider]]:ring-primary-9/15'
            ),
        className
      )}
      onValueChange={([newValue]) => onValueChange(newValue)}
      onValueCommit={([newValue]) => onValueCommit(newValue)}
      data-test={dataTest}
    />
  );
};
