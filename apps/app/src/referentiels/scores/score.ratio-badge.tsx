import { roundTo } from '@tet/domain/utils';
import { Badge, BadgeSize } from '@tet/ui';
import classNames from 'classnames';
import { useScore } from '../use-snapshot';

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
  const score = useScore(actionId, externalCollectiviteId);

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
          state="grey"
          light
          uppercase={false}
          size={size}
        />
      ) : (
        <>
          <Badge
            title={`${roundTo((pointFait / pointPotentiel) * 100, 1)} %`}
            state="success"
            uppercase={false}
            className="!rounded-r-none border-[0.5px] !border-success-3 border-r-0 shrink-0"
            size={size}
            trim={false}
          />
          <Badge
            title={`${roundPointFait} / ${roundPointPotentiel} points`}
            state="success"
            light
            className="!rounded-l-none border-[0.5px] !border-success-3 border-l-0 shrink-0"
            uppercase={false}
            size={size}
            trim={false}
          />
        </>
      )}
    </div>
  );
};
