import {toFixed} from 'utils/toFixed';
import ProgressBar, {ProgressBarType} from './ProgressBar';
import {Tooltip} from '@tet/ui';

type ProgressBarTooltipContentProps = {
  score: {label: string; value: number; color: string}[];
  total: number;
  defaultScore: {label: string; color: string};
  percent?: boolean;
};

type ProgressBarTooltipElementProps = {
  label: string;
  value: number;
  color: string;
};

const ProgressBarWithTooltip = ({
  score,
  total,
  defaultScore,
  valueToDisplay,
  percent = false,
}: ProgressBarType): JSX.Element => {
  return (
    <Tooltip
      label={
        <ProgressBarTooltipContent
          score={score}
          total={total}
          defaultScore={defaultScore}
          percent={percent}
        />
      }
    >
      <div>
        <ProgressBar
          score={score}
          total={total}
          defaultScore={defaultScore}
          valueToDisplay={valueToDisplay}
          percent={percent}
        />
      </div>
    </Tooltip>
  );
};

export default ProgressBarWithTooltip;

const ProgressBarTooltipContent = ({
  score,
  total,
  defaultScore,
  percent,
}: ProgressBarTooltipContentProps): JSX.Element => {
  const defaultValue =
    (percent ? 1 : total) -
    score.reduce((sum, currVal) => sum + currVal.value, 0);

  return (
    <div className="flex flex-col gap-1">
      {/* Liste des éléments dans score */}
      {score.map(s =>
        s.value > 1e-3 ? (
          <ProgressBarTooltipElement
            key={s.label}
            label={s.label}
            value={
              percent ? s.value * 100 : formatAvancementScore(s.value, total)
            }
            color={s.color}
          />
        ) : null
      )}

      {/* Score restant */}
      {defaultValue > 1e-3 && (
        <ProgressBarTooltipElement
          key={defaultScore.label}
          label={defaultScore.label}
          value={
            percent ? defaultValue : formatAvancementScore(defaultValue, total)
          }
          color={defaultScore.color}
        />
      )}
    </div>
  );
};

const ProgressBarTooltipElement = ({
  label,
  value,
  color,
}: ProgressBarTooltipElementProps): JSX.Element => {
  return (
    <div key={label} className="flex flex-row items-center">
      <Square size={16} color={color} />
      <div className="pl-2 whitespace-nowrap">{`${label} : ${value} %`}</div>
    </div>
  );
};

const Square = ({size, color}: {size: number; color: string}): JSX.Element => (
  <svg width={size} height={size}>
    <rect fill={color} stroke="white" width={size} height={size} />
  </svg>
);

const formatAvancementScore = (
  avancementPoint: number,
  maxPoint: number
): number => (maxPoint ? toFixed((avancementPoint / maxPoint) * 100) : 0);
