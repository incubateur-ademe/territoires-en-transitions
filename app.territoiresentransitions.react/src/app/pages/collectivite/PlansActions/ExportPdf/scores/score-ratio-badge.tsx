import { Badge } from '@/app/ui/export-pdf/components/Badge';
import { Stack } from '@/app/ui/export-pdf/components/Stack';
import { toLocaleFixed } from '@/app/utils/toFixed';
import { ScoreFinal } from '@/domain/referentiels';

type ScoreRatioBadgeProps = {
  score: ScoreFinal;
  size?: 'sm' | 'md';
};

export const ScoreRatioBadge = ({
  score,
  size = 'md',
}: ScoreRatioBadgeProps) => {
  if (!score) {
    return null;
  }

  const { pointFait, pointPotentiel } = score;

  const troncateIfZero = (value: string) => {
    return value.endsWith('.0')
      ? value.slice(0, -2)
      : toLocaleFixed(parseFloat(value), 2);
  };

  const calculatePercentage = (
    pointFait: number,
    pointPotentiel: number
  ): string => {
    const percentage = ((pointFait / pointPotentiel) * 100).toFixed(1);
    return troncateIfZero(percentage);
  };

  const roundPointFait = troncateIfZero(pointFait?.toFixed(1));
  const roundPointPotentiel = troncateIfZero(pointPotentiel?.toFixed(1));

  return pointPotentiel === 0 ? (
    <Badge title="0 point" state="grey" light size={size} />
  ) : (
    <Stack direction="row" gap={0}>
      <Badge
        title={`${calculatePercentage(pointFait, pointPotentiel)} %`}
        state="success"
        size={size}
        className="rounded-r-none border-[0.5px] border-success-3 border-r-0"
      />
      <Badge
        title={`${roundPointFait} / ${roundPointPotentiel} points`}
        state="success"
        light
        size={size}
        className="rounded-l-none border-[0.5px] border-success-3 border-l-0"
      />
    </Stack>
  );
};
