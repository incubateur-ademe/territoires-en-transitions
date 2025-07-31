import { roundTo } from '@/domain/utils';
import { Tooltip } from '@/ui';
import ProgressBar, { ProgressBarType } from './progress-bar';

type ProgressBarTooltipContentProps = {
  score: { label: string; value: number; color: string }[];
  total: number;
  defaultScore: { label: string; color: string };
  percent?: boolean;
};

type ProgressBarTooltipElementProps = {
  label: string;
  value: number;
  color: string;
};

const ProgressBarWithTooltip = ({
  dataTest,
  score,
  total,
  defaultScore,
  valueToDisplay,
  valuePosition,
  percent = false,
  className,
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
      <div className={className}>
        <ProgressBar
          dataTest={dataTest}
          score={score}
          total={total}
          defaultScore={defaultScore}
          valueToDisplay={valueToDisplay}
          valuePosition={valuePosition}
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
      {score.map((s) =>
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
      <svg width={16} height={16}>
        <rect fill={color} stroke="white" width={16} height={16} />
      </svg>
      <div className="pl-2 whitespace-nowrap">{`${label} : ${value} %`}</div>
    </div>
  );
};

const formatAvancementScore = (
  avancementPoint: number,
  maxPoint: number
): number => (maxPoint ? roundTo((avancementPoint / maxPoint) * 100, 1) : 0);
