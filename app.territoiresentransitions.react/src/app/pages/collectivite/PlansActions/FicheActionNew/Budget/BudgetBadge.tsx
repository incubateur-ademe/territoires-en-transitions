import {Badge} from '@tet/ui';
import {getFormattedNumber} from './BudgetTab';

type BudgetBadgeProps = {
  budgetPrevisionnel: number | null;
};

const BudgetBadge = ({budgetPrevisionnel}: BudgetBadgeProps) => {
  return (
    <Badge
      title={
        budgetPrevisionnel !== null ? (
          <div className="flex items-start gap-1">
            <div>{getFormattedNumber(budgetPrevisionnel)} € </div>
            <div className="text-[0.5rem] leading-[0.6rem]">TTC</div>
          </div>
        ) : (
          'Non renseigné'
        )
      }
      state="standard"
      uppercase={false}
      light
    />
  );
};

export default BudgetBadge;
