import {FicheAction} from '../../FicheAction/data/types';
import EmptyCard from '../EmptyCard';
import MoneyPicto from './MoneyPicto';

type BudgetTabProps = {
  fiche: FicheAction;
};

const BudgetTab = ({fiche}: BudgetTabProps) => {
  const {
    budget_previsionnel: budgetPrevisionnel,
    financeurs,
    financements,
  } = fiche;

  const isEmpty =
    budgetPrevisionnel === null &&
    (!financeurs || financeurs.length === 0) &&
    !financements;

  return isEmpty ? (
    <EmptyCard
      picto={className => <MoneyPicto className={className} />}
      title="Budget non renseigné !"
      subTitle="Renseignez le budget prévisionnel de l'action, ainsi que les détails de financements."
      action={{
        label: 'Renseigner un budget',
        onClick: () => {},
      }}
    />
  ) : (
    <div>Budget</div>
  );
};

export default BudgetTab;
