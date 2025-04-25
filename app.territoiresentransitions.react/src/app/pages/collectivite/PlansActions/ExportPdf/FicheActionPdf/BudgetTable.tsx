import {
  FormattedBudgetType,
  getBudgetForTable,
} from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/content/utils';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { Paragraph, TCell, TRow, Table } from '@/app/ui/export-pdf/components';

type BudgetTableProps = {
  budgets: BudgetType[];
};

const BudgetTable = ({ budgets }: BudgetTableProps) => {
  const formattedBudget: FormattedBudgetType = getBudgetForTable(budgets);

  return (
    <Table>
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

      {formattedBudget.map((budget, index) => (
        <TRow index={index} key={index}>
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
    </Table>
  );
};

export default BudgetTable;
