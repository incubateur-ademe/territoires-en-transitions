import {Icon} from '@design-system/Icon';
import {Tooltip} from '@design-system/Tooltip';
import classNames from 'classnames';

type NiveauBudgetProps = {
  budget: 0 | 1 | 2 | 3;
};

export const NiveauBudget = ({budget}: NiveauBudgetProps) => {
  const nomBudget = {
    1: 'De 0 à 40 000 €',
    2: 'De 40 000 € à 100 000 €',
    3: 'Plus de 100 000 €',
  };

  const tooltipText = (
    <div className="flex flex-col gap-2 text-primary-10">
      <div className="font-bold">{nomBudget[budget]}</div>
      <div>
        Estimation budgétaire HT (investissement et fonctionnement, hors
        subvention).
      </div>
      <div>
        Une évaluation précise du budget sera réalisée lors du dimensionnement
        exacte de l’action.
      </div>
    </div>
  );

  return (
    <Tooltip
      label={
        <div className="w-52 !font-normal">
          {budget === 0
            ? 'Ordre de grandeur budgétaire non estimé.'
            : tooltipText}
        </div>
      }
    >
      <div>
        <Icon
          icon="money-euro-circle-fill"
          className={classNames({
            'text-secondary-1': budget >= 1,
            'text-grey-4': budget < 1,
          })}
        />
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
    </Tooltip>
  );
};
