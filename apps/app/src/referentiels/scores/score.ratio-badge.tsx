import { roundTo } from '@tet/domain/utils';
import { Badge, BadgeDouble, BadgeSize } from '@tet/ui';
import classNames from 'classnames';
import { useGetActionScore } from '../use-get-action-score';

type Props = {
  actionId: string;
  size?: BadgeSize;
  className?: string;
  externalCollectiviteId?: number;
};

export const ScoreRatioBadge = ({
  actionId,
  size,
  className,
  externalCollectiviteId,
}: Props) => {
  const score = useGetActionScore({ actionId, externalCollectiviteId });

  if (!score) {
    return null;
  }

  const { pointFait, pointPotentiel } = score;

  const roundPointFait = roundTo(pointFait, 1);
  const roundPointPotentiel = roundTo(pointPotentiel, 1);

  return (
    <div
      data-test={`scoreRatio-${actionId}`}
      className={classNames('flex', className)}
    >
      {pointPotentiel === 0 ? (
        <Badge
          title="0 point"
          variant="grey"
          type="outlined"
          uppercase={false}
          size={size}
        />
      ) : (
        <BadgeDouble
          variant="success"
          type="solid"
          size={size}
          badgeLeft={{
            title: `${roundTo((pointFait / pointPotentiel) * 100, 1)} %`,
            uppercase: false,
            trim: false,
          }}
          badgeRight={{
            title: `${roundPointFait} / ${roundPointPotentiel} points`,
            uppercase: false,
            trim: false,
          }}
        />
      )}
    </div>
  );
};
