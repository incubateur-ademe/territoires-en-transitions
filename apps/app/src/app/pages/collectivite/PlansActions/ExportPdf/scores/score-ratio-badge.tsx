import { Badge } from '@/app/ui/export-pdf/components/Badge';
import { Stack } from '@/app/ui/export-pdf/components/Stack';
import { ScoreFinal } from '@/domain/referentiels';
import { roundTo } from '@/domain/utils';

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

  const roundPointFait = roundTo(pointFait, 1);
  const roundPointPotentiel = roundTo(pointPotentiel, 1);

  return pointPotentiel === 0 ? (
    <Badge title="0 point" state="grey" light size={size} />
  ) : (
    <Stack direction="row" gap={0}>
      <Badge
        title={`${roundTo((pointFait / pointPotentiel) * 100, 1)} %`}
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
