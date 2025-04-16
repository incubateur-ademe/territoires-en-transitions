import { Badge } from '@/app/ui/export-pdf/components/Badge';
import { Stack } from '@/app/ui/export-pdf/components/Stack';
import { ScoreFinal } from '@/domain/referentiels';

type ScoreRatioBadgeProps = {
  score: ScoreFinal;
};

export const ScoreRatioBadge = ({ score }: ScoreRatioBadgeProps) => {
  if (!score) {
    return null;
  }

  const { pointFait, pointPotentiel } = score;

  const troncateIfZero = (value: string) => {
    return value.endsWith('.0') ? value.slice(0, -2) : value;
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

  return (
    <Stack direction="row" gap={0} className="pt-2 pb-1">
      {pointPotentiel === 0 ? (
        <Badge title="0 point" state="grey" uppercase={false} />
      ) : (
        <>
          <Badge
            title={`${calculatePercentage(pointFait, pointPotentiel)} %`}
            state="success"
            uppercase={false}
            className="rounded-r-none border-2 border-r-0"
          />
          <Badge
            title={`${roundPointFait} / ${roundPointPotentiel} points`}
            state="success"
            light
            uppercase={false}
            className="rounded-l-none border-2"
          />
        </>
      )}
    </Stack>
  );
};
