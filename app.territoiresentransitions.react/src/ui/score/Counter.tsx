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

  const percentage = Number(
    (score.point_fait / score.point_potentiel) * 100
  ).toFixed(1);

  return (
    <div className={classNames('flex', className)}>
      <Badge
        title={`${percentage} %`}
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
