import {
  FormattedBudgetType,
  getBudgetForTable,
} from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/content/utils';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { Paragraph, TCell, TRow, Table } from '@/app/ui/export-pdf/components';
import { getFormattedNumber } from '@/app/utils/formatUtils';

type BudgetTableProps = {
  budgets: BudgetType[];
};

const BudgetTable = ({ budgets }: BudgetTableProps) => {
  const formattedBudget: FormattedBudgetType = getBudgetForTable(budgets);

  return (
    <Table>
      {/* En-tête */}
      <TRow>
        <TCell colsNumber={5} variant="head" className="py-2">
          Année
        </TCell>
        <TCell colsNumber={5} variant="head" className="py-2">
          Montant prévisionnel
        </TCell>
        <TCell colsNumber={5} variant="head" className="py-2">
          Montant dépensé
        </TCell>
        <TCell colsNumber={5} variant="head" className="py-2">
          ETP prévisionnel
        </TCell>
        <TCell colsNumber={5} variant="head" className="py-2">
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
                {budget.eurosPrevisionnel} €{' '}
                <Paragraph className="text-[0.5rem] leading-[0.6rem] font-bold text-primary-7">
                  HT
                </Paragraph>
              </>
            )}
          </TCell>
          <TCell colsNumber={5}>
            {budget.eurosReel && (
              <>
                {budget.eurosReel} €{' '}
                <Paragraph className="text-[0.5rem] leading-[0.6rem] font-bold text-primary-7">
                  HT
                </Paragraph>
              </>
            )}
          </TCell>
          <TCell colsNumber={5}>
            {budget.etpPrevisionnel && `${budget.etpPrevisionnel} ETP`}
          </TCell>
          <TCell colsNumber={5}>
            {budget.etpReel && `${budget.etpReel} ETP`}
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
                (currVal.eurosPrevisionnel
                  ? parseInt(currVal.eurosPrevisionnel)
                  : 0),
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
                sum + (currVal.eurosReel ? parseInt(currVal.eurosReel) : 0),
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
                sum +
                (currVal.etpPrevisionnel
                  ? parseInt(currVal.etpPrevisionnel)
                  : 0),
              0
            )
          )}{' '}
          ETP
        </TCell>
        <TCell colsNumber={5} contentClassName="text-primary-8">
          {getFormattedNumber(
            formattedBudget.reduce(
              (sum, currVal) =>
                sum + (currVal.etpReel ? parseInt(currVal.etpReel) : 0),
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
