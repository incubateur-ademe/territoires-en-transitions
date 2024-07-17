import {Financeur} from '../../FicheAction/data/types';

type BudgetTabProps = {
  budgetPrevisionnel: number | null;
  financeurs: Financeur[];
  financements: string | null;
};

const BudgetTab = ({
  budgetPrevisionnel,
  financeurs,
  financements,
}: BudgetTabProps) => {
  const isEmpty =
    budgetPrevisionnel === null &&
    (!financeurs || financeurs.length === 0) &&
    !financements;

  return isEmpty ? <div>Budget non renseigné !</div> : <div>Budget</div>;
};

export default BudgetTab;
