import { getFormattedNumber } from '@/app/utils/formatUtils';
import { Badge } from '@tet/ui';

type BudgetBadgeProps = {
  budgetPrevisionnel: number;
};

const BudgetBadge = ({ budgetPrevisionnel }: BudgetBadgeProps) => {
  return (
    <Badge
      title={
        <div className="flex items-start gap-1">
          <div>{getFormattedNumber(budgetPrevisionnel)} € </div>
          <div className="text-[0.5rem] leading-[0.6rem]">TTC</div>
        </div>
      }
      state="standard"
      uppercase={false}
      light
    />
  );
};

export default BudgetBadge;
