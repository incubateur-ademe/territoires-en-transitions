import { appLabels } from '@/app/labels/catalog';
import { JAUGE_MAX, JAUGE_MIN } from '@tet/domain/plans';
import { Badge } from '@tet/ui';
import { JSX } from 'react';
import { getJaugeColors } from './get-jauge-colors';

type JaugeBarProps = {
  value: number;
  isDisabled?: boolean;
  hideBadge?: boolean;
};

export const JaugeBar = ({
  value,
  isDisabled = false,
  hideBadge = false,
}: JaugeBarProps): JSX.Element => {
  const colors = getJaugeColors({ jauge: value, isDisabled });

  return (
    <div className="flex w-full items-center gap-3">
      {!hideBadge && (
        <Badge
          title={`${value} %`}
          size="sm"
          variant={colors.badgeVariant}
          type="outlined"
          trim={false}
          className="shrink-0"
        />
      )}
      <div
        role="progressbar"
        aria-label={appLabels.ficheJauge}
        aria-valuenow={value}
        aria-valuemin={JAUGE_MIN}
        aria-valuemax={JAUGE_MAX}
        className="h-1.5 w-full rounded-full"
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
