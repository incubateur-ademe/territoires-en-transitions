import { Badge } from '@/ui';
import classNames from 'classnames';
import { useActionScore } from '../DEPRECATED_score-hooks';
import { useScore, useSnapshotFlagEnabled } from '../use-snapshot';

type Props = {
  actionId: string;
  className?: string;
};

export const ScoreRatioBadge = ({ actionId, className }: Props) => {
  const isSnapshotEnabled = useSnapshotFlagEnabled();
  const DEPRECATED_score = useActionScore(actionId, !isSnapshotEnabled);
  const NEW_score = useScore(actionId);

  if (
    (!isSnapshotEnabled && !DEPRECATED_score) ||
    (isSnapshotEnabled && !NEW_score)
  ) {
    return null;
  }

  const pointsFait = isSnapshotEnabled
    ? NEW_score!.pointFait
    : DEPRECATED_score!.point_fait;
  const pointsPotentiel = isSnapshotEnabled
    ? NEW_score!.pointPotentiel
    : DEPRECATED_score!.point_potentiel;

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

  const roundPointFait = troncateIfZero(pointsFait.toFixed(1));
  const roundPointPotentiel = troncateIfZero(pointsPotentiel.toFixed(1));

  return (
    <div className={classNames('flex', className)}>
      {pointsPotentiel === 0 ? (
        <Badge title="0 point" state="grey" uppercase={false} />
      ) : (
        <>
          <Badge
            title={`${calculatePercentage(pointsFait, pointsPotentiel)} %`}
            state="success"
            uppercase={false}
            className="!rounded-r-none border-2 border-r-0"
          />
          <Badge
            title={`${roundPointFait} / ${roundPointPotentiel} points`}
            state="success"
            light
            className="!rounded-l-none border-2"
            uppercase={false}
          />
        </>
      )}
    </div>
  );
};
