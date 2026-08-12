import { Paragraph, TCell, TRow, Table } from '../primitives';
import { FicheBudget } from '@tet/domain/plans';
import { getFormattedNumber } from '@tet/domain/utils';
import { groupBy } from 'es-toolkit';
import { BudgetRow, computeBudgetTotals } from './compute-budget-totals';

type FicheBudgetWithYear = FicheBudget & {
  annee: number;
};

type FormattedBudgetType = (BudgetRow & { annee: number })[];

const getBudgetForTable = (
  budgets: Array<FicheBudget>
): FormattedBudgetType => {
  const budgetsWithYear = budgets.filter(
    (b): b is FicheBudgetWithYear => !!b.annee
  );

  const groupedBudgets = groupBy(budgetsWithYear, (b) => b.annee);

  return Object.values(groupedBudgets)
    .map((budgetsByYear) => {
      const euroBudget = budgetsByYear.find((b) => b.unite === 'HT');
      const etpBudget = budgetsByYear.find((b) => b.unite === 'ETP');
      const eurosPrevisionnel = euroBudget?.budgetPrevisionnel;
      const eurosReel = euroBudget?.budgetReel;
      const etpPrevisionnel = etpBudget?.budgetPrevisionnel;
      const etpReel = etpBudget?.budgetReel;

      return {
        annee: budgetsByYear[0].annee,
        eurosPrevisionnel,
        eurosReel,
        etpPrevisionnel,
        etpReel,
      };
    })
    .sort((a, b) => a.annee - b.annee);
};

const BudgetTable = ({ budgets }: { budgets: FicheBudget[] }) => {
  const formattedBudget = getBudgetForTable(budgets);
  const totals = computeBudgetTotals(formattedBudget);
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
              `${getFormattedNumber(budget.etpPrevisionnel)} ETP`}
          </TCell>
          <TCell colsNumber={5}>
            {budget.etpReel && `${getFormattedNumber(budget.etpReel)} ETP`}
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
          {getFormattedNumber(totals.eurosPrevisionnel)} €{' '}
          <Paragraph className="text-[0.5rem] leading-[0.6rem] font-bold text-primary-8">
            HT
          </Paragraph>
        </TCell>
        <TCell colsNumber={5} contentClassName="text-primary-8">
          {getFormattedNumber(totals.eurosReel)} €{' '}
          <Paragraph className="text-[0.5rem] leading-[0.6rem] font-bold text-primary-8">
            HT
          </Paragraph>
        </TCell>
        <TCell colsNumber={5} contentClassName="text-primary-8">
          {`${getFormattedNumber(totals.etpPrevisionnel)} ETP`}
        </TCell>
        <TCell colsNumber={5} contentClassName="text-primary-8">
          {`${getFormattedNumber(totals.etpReel)} ETP`}
        </TCell>
      </TRow>
    </Table>
  );
};

export default BudgetTable;
