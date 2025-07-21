import { roundTo } from '@/domain/utils';
import { Badge } from '@/ui';
import classNames from 'classnames';

export type ProgressBarType = {
  dataTest?: string;
  score: { label: string; value: number; color: string }[];
  total: number;
  defaultScore: { label: string; color: string };
  valueToDisplay?: string;
  valuePosition?: 'left' | 'right';
  percent?: boolean;
  className?: string;
};

const ProgressBar = ({
  dataTest,
  score,
  total,
  defaultScore,
  valueToDisplay,
  valuePosition = 'left',
  percent = false,
  className,
}: ProgressBarType): JSX.Element => {
  const barClasses = 'transition-width duration-500 ease-in-out rounded-[4px]';

  const percentageAgainstTotal = (x: number): number => (100 * x) / total;

  const localData: { label: string; value: number; color: string }[] = [];

  score
    .filter((s) => s.value > 0)
    .forEach((s, idx) => {
      const value = percent ? s.value * 100 : percentageAgainstTotal(s.value);

      localData.push({
        ...s,
        value: value + (idx >= 1 ? localData[idx - 1].value : 0),
      });
    });

  const displayedValue = valueToDisplay
    ? localData.find((d) => d.label === valueToDisplay)?.value
    : undefined;

  return (
    <div
      data-test={dataTest}
      className={classNames('flex gap-3 items-center w-full', className)}
    >
      {/* Légende à gauche de la barre de progression */}
      {!!displayedValue && (
        <Badge
          title={`${roundTo(displayedValue, 1)} %`}
          state="success"
          size="sm"
          trim={false}
          className={classNames('shrink-0', {
            'order-first': valuePosition === 'left',
            'order-last': valuePosition === 'right',
          })}
        />
      )}
      {/* Barre de progression */}
      <div
        style={{ backgroundColor: defaultScore.color }}
        className={classNames(
          'relative flex pt-1 min-w-[100px] min-h-[10px] w-full',
          barClasses
        )}
      >
        {localData
          .sort((a, b) => b.value - a.value) // Permet d'afficher les plus grandes barres en premières afin d'avoir un effet de stacking et ne pas utiliser de z-index
          .map((d) => (
            <div
              key={d.label}
              style={{
                minWidth: `${d.value}%`,
                backgroundColor: d.color,
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
