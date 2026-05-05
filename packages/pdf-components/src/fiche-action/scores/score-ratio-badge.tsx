import { Badge } from '../../primitives/Badge';
import { Stack } from '../../primitives/Stack';
import { ActionScoreFinal } from '@tet/domain/referentiels';
import { roundTo } from '@tet/domain/utils';
import { BadgeSize } from '../../ui-compat';

type ScoreRatioBadgeProps = {
  score: ActionScoreFinal;
  size?: BadgeSize;
};

export const ScoreRatioBadge = ({
  score,
  size = 'sm',
}: ScoreRatioBadgeProps) => {
  if (!score) {
    return null;
  }

  const { pointFait, pointPotentiel } = score;

  const roundPointFait = roundTo(pointFait, 1);
  const roundPointPotentiel = roundTo(pointPotentiel, 1);

  return pointPotentiel === 0 ? (
    <Badge title="0 point" variant="grey" type="outlined" size={size} />
  ) : (
    <Stack direction="row" gap={0}>
      <Badge
        title={`${roundTo((pointFait / pointPotentiel) * 100, 1)} %`}
        variant="success"
        size={size}
        className="rounded-r-none border-[0.5px] border-success-3 border-r-0"
      />
      <Badge
        title={`${roundPointFait} / ${roundPointPotentiel} points`}
        variant="success"
        type="outlined"
        size={size}
        className="rounded-l-none border-[0.5px] border-success-3 border-l-0"
      />
    </Stack>
  );
};
