import {
  FormattedBudgetType,
  getBudgetForTable,
} from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/content/utils';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { Paragraph, TCell, TRow, Table } from '@/app/ui/export-pdf/components';
import { getFormattedFloat, getFormattedNumber } from '@/app/utils/formatUtils';

type BudgetTableProps = {
  budgets: BudgetType[];
};

const BudgetTable = ({ budgets }: BudgetTableProps) => {
  const formattedBudget: FormattedBudgetType = getBudgetForTable(budgets);

  return (
    <Table wrap={false}>
      {/* En-tête */}
      <TRow>
        <TCell colsNumber={5} variant="head">
          Année
        </TCell>
        <TCell colsNumber={5} variant="head">
          Montant prévisionnel
        </TCell>
        <TCell colsNumber={5} variant="head">
          Montant dépensé
        </TCell>
        <TCell colsNumber={5} variant="head">
          ETP prévisionnel
        </TCell>
        <TCell colsNumber={5} variant="head">
          ETP réel
        </TCell>
      </TRow>

      {/* Data */}
      {formattedBudget.map((budget, index) => (
        <TRow index={index} key={budget.annee}>
          <TCell colsNumber={5} variant="title">
            {budget.annee}
          </TCell>
          <TCell colsNumber={5}>
            {budget.eurosPrevisionnel && (
              <>
                {getFormattedNumber(budget.eurosPrevisionnel)} €{' '}
                <Paragraph className="text-[0.5rem] leading-[0.6rem] font-bold text-primary-7">
                  HT
                </Paragraph>
              </>
            )}
          </TCell>
          <TCell colsNumber={5}>
            {budget.eurosReel && (
              <>
                {getFormattedNumber(budget.eurosReel)} €{' '}
                <Paragraph className="text-[0.5rem] leading-[0.6rem] font-bold text-primary-7">
                  HT
                </Paragraph>
              </>
            )}
          </TCell>
          <TCell colsNumber={5}>
            {budget.etpPrevisionnel &&
              `${getFormattedFloat(budget.etpPrevisionnel)} ETP`}
          </TCell>
          <TCell colsNumber={5}>
            {budget.etpReel && `${getFormattedFloat(budget.etpReel)} ETP`}
          </TCell>
        </TRow>
      ))}

      {/* Total */}
      <TRow index={formattedBudget.length}>
        <TCell
          colsNumber={5}
          variant="title"
          contentClassName="text-primary-10"
        >
          Total
        </TCell>
        <TCell colsNumber={5} contentClassName="text-primary-8">
          {getFormattedNumber(
            formattedBudget.reduce(
              (sum, currVal) =>
                sum +
                (currVal.eurosPrevisionnel ? currVal.eurosPrevisionnel : 0),
              0
            )
          )}{' '}
          €{' '}
          <Paragraph className="text-[0.5rem] leading-[0.6rem] font-bold text-primary-8">
            HT
          </Paragraph>
        </TCell>
        <TCell colsNumber={5} contentClassName="text-primary-8">
          {getFormattedNumber(
            formattedBudget.reduce(
              (sum, currVal) =>
                sum + (currVal.eurosReel ? currVal.eurosReel : 0),
              0
            )
          )}{' '}
          €{' '}
          <Paragraph className="text-[0.5rem] leading-[0.6rem] font-bold text-primary-8">
            HT
          </Paragraph>
        </TCell>
        <TCell colsNumber={5} contentClassName="text-primary-8">
          {getFormattedFloat(
            formattedBudget.reduce(
              (sum, currVal) =>
                sum + (currVal.etpPrevisionnel ? currVal.etpPrevisionnel : 0),
              0
            )
          )}{' '}
          ETP
        </TCell>
        <TCell colsNumber={5} contentClassName="text-primary-8">
          {getFormattedFloat(
            formattedBudget.reduce(
              (sum, currVal) => sum + (currVal.etpReel ? currVal.etpReel : 0),
              0
            )
          )}{' '}
          ETP
        </TCell>
      </TRow>
    </Table>
  );
};

export default BudgetTable;
