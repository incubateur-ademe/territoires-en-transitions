import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { Box } from '@/app/ui/export-pdf/components';
import { Stack } from '@/app/ui/export-pdf/components/Stack';
import { ActionScoreFinal } from '@/domain/referentiels';
import classNames from 'classnames';

type ScoreProgressBarProps = {
  score?: ActionScoreFinal;
  className?: string;
};

export const ScoreProgressBar = ({
  score,
  className,
}: ScoreProgressBarProps) => {
  if (!score) return null;

  const scoreData = [
    {
      label: avancementToLabel.fait,
      value: score.pointFait,
      color: actionAvancementColors.fait,
    },
    {
      label: avancementToLabel.programme,
      value: score.pointProgramme,
      color: actionAvancementColors.programme,
    },
    {
      label: avancementToLabel.pas_fait,
      value: score.pointPasFait,
      color: actionAvancementColors.pas_fait,
    },
  ];

  const percentageAgainstTotal = (x: number): number =>
    (100 * x) / (score.pointPotentiel || 1);

  const localData: { label: string; value: number; color: string }[] = [];
  scoreData.forEach((s, idx) => {
    if (s.value === 0) {
      return localData.push({ ...s, value: 0 });
    }

    const value = s.value ? percentageAgainstTotal(s.value) : 0;

    localData.push({
      ...s,
      value: value + (idx >= 1 ? localData[idx - 1].value : 0),
    });
  });
  return (
    <Stack
      className={classNames(
        'min-w-[100px] h-[5px] w-full bg-gray-200 rounded-[4px]',
        className
      )}
    >
      {localData
        .sort((a, b) => b.value - a.value) // Permet d'afficher les plus grandes barres en premières afin d'avoir un effet de stacking et ne pas utiliser de z-index
        .map((d) => (
          <Box
            key={d.label}
            className={classNames(
              'absolute min-h-full top-0 left-0 rounded-[4px]',
              `min-w-[${d.value}%]`,
              `bg-[${d.color}]`
            )}
          />
        ))}
    </Stack>
  );
};
