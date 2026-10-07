import { round } from 'es-toolkit';
import { SizeVariant } from '@tet/design-tokens';
import { ActionScoreFinal } from '@tet/domain/referentiels';
import { Badge } from '../../primitives/Badge';
import { Stack } from '../../primitives/Stack';

type ScoreRatioBadgeProps = {
  score: ActionScoreFinal;
  size?: SizeVariant;
};

export const ScoreRatioBadge = ({
  score,
  size = 'md',
}: ScoreRatioBadgeProps) => {
  if (!score) {
    return null;
  }

  const { pointFait, pointPotentiel } = score;

  const roundPointFait = round(pointFait, 1);
  const roundPointPotentiel = round(pointPotentiel, 1);

  return pointPotentiel === 0 ? (
    <Badge title="0 point" variant="grey" type="outlined" size={size} />
  ) : (
    <Stack direction="row" gap={0}>
      <Badge
        title={`${round((pointFait / pointPotentiel) * 100, 1)} %`}
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
