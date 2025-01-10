import { TweenText } from '@/app/ui/shared/TweenText';
import { toFixed } from '@/app/utils/toFixed';
import classNames from 'classnames';

export type ProgressBarStyleOptions = {
  fullWidth?: boolean;
};

export type ProgressBarType = {
  score: { label: string; value: number; color: string }[];
  total: number;
  defaultScore: { label: string; color: string };
  valueToDisplay?: string;
  percent?: boolean;
  progressBarStyleOptions?: ProgressBarStyleOptions;
};

const ProgressBar = ({
  score,
  total,
  defaultScore,
  valueToDisplay,
  percent = false,
  progressBarStyleOptions = { fullWidth: false },
}: ProgressBarType): JSX.Element => {
  const { fullWidth } = progressBarStyleOptions;
  const barClasses = 'transition-width duration-500 ease-in-out rounded-[4px]';

  const percentageAgainstTotal = (x: number): number => (100 * x) / total;

  const localData: { label: string; value: number; color: string }[] = [];
  score.forEach((s, idx) => {
    localData.push({
      ...s,
      value:
        (percent ? s.value * 100 : percentageAgainstTotal(s.value)) +
        (idx >= 1 ? localData[idx - 1].value : 0),
    });
  });

  const displayedValue =
    valueToDisplay !== undefined
      ? localData.find((d) => d.label === valueToDisplay)?.value
      : null;

  return (
    <div className="flex gap-3 items-center">
      {/* Légende à gauche de la barre de progression */}
      {displayedValue !== undefined && displayedValue !== null && (
        <div className="text-sm font-bold">
          <TweenText text={`${toFixed(displayedValue)} %`} align-right />
        </div>
      )}
      {/* Barre de progression */}
      <div
        style={{ backgroundColor: defaultScore.color }}
        className={classNames(
          'relative flex pt-1 min-w-[100px] min-h-[10px]',
          barClasses,
          fullWidth && 'w-full'
        )}
      >
        {localData.map((d, idx) => (
          <div
            key={d.label}
            style={{
              minWidth: `${d.value}%`,
              backgroundColor: d.color,
              zIndex: 100 - idx,
            }}
            className={classNames(
              'absolute min-h-full top-0 left-0',
              barClasses
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
