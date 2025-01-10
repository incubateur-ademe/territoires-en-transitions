import { Badge } from '@/ui';
import classNames from 'classnames';
import { useActionScore } from '../../core-logic/hooks/scoreHooks';

type CounterProps = {
  actionId: string;
  className?: string;
};

export const Counter = ({ actionId, className }: CounterProps) => {
  const score = useActionScore(actionId);

  if (!score) return null;

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

  const roundPointFait = troncateIfZero(score.point_fait.toFixed(1));
  const roundPointPotentiel = troncateIfZero(score.point_potentiel.toFixed(1));

  return (
    <div className={classNames('flex', className)}>
      {score.point_potentiel === 0 ? (
        <Badge title="0 point" state="grey" uppercase={false} />
      ) : (
        <>
          <Badge
            title={`${calculatePercentage(
              score.point_fait,
              score.point_potentiel
            )} %`}
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
