import { ActionImpactFourchetteBudgetaire } from '@tet/api';
import { Icon } from '@tet/ui';
import classNames from 'classnames';

type NiveauBudgetProps = {
  budget: ActionImpactFourchetteBudgetaire;
};

const NiveauBudget = ({ budget }: NiveauBudgetProps) => {
  // Mise en forme du label à partir du nom stocké en base
  // ex : "De 40 000€ à 100 000€" => "40k à 100k"
  // attention en cas de mise à jour des budgets
  const label = budget.nom
    .split('000')
    .join('')
    .replaceAll(' €', 'k')
    .replace('De ', '');

  return (
    <div className="flex shrink-0 items-center justify-center px-1 py-0.5 border-[0.5px] rounded border-grey-3 bg-grey-1 gap-x-1">
      <Icon
        icon="money-euro-circle-fill"
        size="sm"
        className={classNames({
          'text-secondary-1': budget.niveau > 1,
          'text-grey-4': budget.niveau === 1,
        })}
      />
      <Icon
        icon="money-euro-circle-fill"
        size="sm"
        className={classNames({
          'text-secondary-1': budget.niveau > 2,
          'text-grey-4': budget.niveau <= 2,
        })}
      />
      <Icon
        icon="money-euro-circle-fill"
        size="sm"
        className={classNames({
          'text-secondary-1': budget.niveau > 3,
          'text-grey-4': budget.niveau <= 3,
        })}
      />
      <span className="leading-3 pt-0.5 text-grey-6 text-sm font-bold">
        {label}
      </span>
    </div>
  );
};

export default NiveauBudget;
