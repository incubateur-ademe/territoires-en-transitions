import { Badge, BadgeSize } from '@/ui';
import classNames from 'classnames';
import { useScore } from '../use-snapshot';

type Props = {
  actionId: string;
  size?: BadgeSize;
  className?: string;
};

export const ScoreRatioBadge = ({ actionId, size, className }: Props) => {
  const score = useScore(actionId);

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

  const roundPointFait = troncateIfZero(pointFait.toFixed(1));
  const roundPointPotentiel = troncateIfZero(pointPotentiel.toFixed(1));

  return (
    <div className={classNames('flex', className)}>
      {pointPotentiel === 0 ? (
        <Badge title="0 point" state="grey" uppercase={false} size={size} />
      ) : (
        <>
          <Badge
            title={`${calculatePercentage(pointFait, pointPotentiel)} %`}
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
