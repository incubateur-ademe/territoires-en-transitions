import {Icon} from '@design-system/Icon';
import classNames from 'classnames';

export const NiveauBudget = ({budget}: {budget: 1 | 2 | 3}) => {
  return (
    <div>
      <Icon icon="money-euro-circle-fill" className="text-secondary-1" />
      <Icon
        icon="money-euro-circle-fill"
        className={classNames({
          'text-secondary-1': budget >= 2,
          'text-grey-4': budget < 2,
        })}
      />
      <Icon
        icon="money-euro-circle-fill"
        className={classNames({
          'text-secondary-1': budget === 3,
          'text-grey-4': budget < 3,
        })}
      />
    </div>
  );
};
