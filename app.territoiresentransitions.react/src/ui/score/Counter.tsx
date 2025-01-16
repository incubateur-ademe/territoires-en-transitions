import { Badge } from '@/ui';
import classNames from 'classnames';

type CounterProps = {
  value: number;
  total: number;
  className?: string;
};

export const Counter = ({ value, total, className }: CounterProps) => {
  const percentage = (value / total) * 100;

  return (
    <div className={classNames('flex', className)}>
      <Badge
        title={`${percentage} %`}
        state="success"
        uppercase={false}
        className="!rounded-r-none border-[0.5px] border-r-0 !border-grey-7"
      />
      <Badge
        title={value && total ? `${value} / ${total} points` : 'Non renseigné'}
        state="success"
        light
        className="!rounded-l-none border-[0.5px] !border-grey-7"
        uppercase={false}
      />
    </div>
  );
};
