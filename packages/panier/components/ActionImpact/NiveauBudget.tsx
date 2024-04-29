import {ActionImpactFourchetteBudgetaire} from '@tet/api';
import {Icon, Tooltip} from '@tet/ui';
import classNames from 'classnames';

type NiveauBudgetProps = {
  budget: ActionImpactFourchetteBudgetaire;
};

const NiveauBudget = ({budget}: NiveauBudgetProps) => {
  const tooltipText = (
    <div className="flex flex-col gap-2 text-primary-10">
      <div className="font-bold">{budget.nom}</div>
      <div>
        Estimation budgétaire HT (investissement et fonctionnement, hors
        subvention).
      </div>
      <div>
        Une évaluation précise du budget sera à réaliser lors du dimensionnement
        exacte de l’action.
      </div>
    </div>
  );

  return (
    <Tooltip
      label={
        <div className="w-52 !font-normal">
          {budget.niveau === 1
            ? 'Ordre de grandeur budgétaire non estimé.'
            : tooltipText}
        </div>
      }
    >
      <div className="flex items-center justify-center px-1.5 py-1 border rounded border-grey-3 bg-grey-1">
        <Icon
          icon="money-euro-circle-fill"
          className={classNames({
            'text-secondary-1': budget.niveau > 1,
            'text-grey-4': budget.niveau === 1,
          })}
        />
        <Icon
          icon="money-euro-circle-fill"
          className={classNames({
            'text-secondary-1': budget.niveau > 2,
            'text-grey-4': budget.niveau <= 2,
          })}
        />
        <Icon
          icon="money-euro-circle-fill"
          className={classNames({
            'text-secondary-1': budget.niveau > 3,
            'text-grey-4': budget.niveau <= 3,
          })}
        />
      </div>
    </Tooltip>
  );
};

export default NiveauBudget;
