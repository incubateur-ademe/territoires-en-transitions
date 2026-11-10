import { appLabels } from '@/app/labels/catalog';
import { JAUGE_MAX, JAUGE_MIN } from '@tet/domain/plans';
import { JSX } from 'react';
import { getJaugeColors } from './get-jauge-colors';
import { JaugeBadge } from './jauge.badge';

type JaugeBarProps = {
  value: number;
  isDisabled?: boolean;
  hideBadge?: boolean;
  isBadgeLarge?: boolean;
  label?: string;
};

export const JaugeBar = ({
  value,
  isDisabled = false,
  hideBadge = false,
  isBadgeLarge = false,
  label = appLabels.ficheJauge,
}: JaugeBarProps): JSX.Element => {
  const colors = getJaugeColors({ jauge: value, isDisabled });

  return (
    <div className="flex w-full items-center gap-3">
      {!hideBadge && (
        <JaugeBadge
          value={value}
          isDisabled={isDisabled}
          isLarge={isBadgeLarge}
        />
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={JAUGE_MIN}
        aria-valuemax={JAUGE_MAX}
        className="h-2 w-full rounded-full"
        style={{ backgroundColor: colors.track }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: colors.fill }}
        />
      </div>
    </div>
  );
};
