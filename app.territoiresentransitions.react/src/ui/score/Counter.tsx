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

  const calculatePercentage = (
    pointFait: number,
    pointPotentiel: number
  ): string => {
    const ratio = pointFait / pointPotentiel;
    if (Number.isNaN(ratio)) {
      return '-';
    }
    return Number(ratio * 100).toFixed(1);
  };

  const percentage = calculatePercentage(
    score.point_fait,
    score.point_potentiel
  );

  return (
    <div className={classNames('flex', className)}>
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
        title={`${score.point_fait} / ${score.point_potentiel} points`}
        state="success"
        light
        className="!rounded-l-none border-2"
        uppercase={false}
      />
    </div>
  );
};
