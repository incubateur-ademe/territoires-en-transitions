import {
  FormattedBudgetType,
  getBudgetForTable,
} from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/content/utils';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { getFormattedNumber } from '@/app/utils/formatUtils';
import { Badge, TBody, TCell, THead, THeadCell, TRow, Table } from '@/ui';
import classNames from 'classnames';

type BudgetTableProps = {
  budgets: BudgetType[];
};

const BudgetTable = ({ budgets }: BudgetTableProps) => {
  const formattedBudget: FormattedBudgetType = getBudgetForTable(budgets);

  const headCellClassname =
    'text-left !text-grey-9 font-normal uppercase w-1/5';

  const bodyCellClassname = (idx: number) =>
    classNames('!py-3', { 'bg-primary-0': idx % 2 !== 0 });

  return (
    <Table className="rounded-none">
      <THead className="bg-white">
        <TRow>
          <THeadCell className={headCellClassname}>Année</THeadCell>
          <THeadCell className={headCellClassname}>
            Montant prévisionnel
          </THeadCell>
          <THeadCell className={headCellClassname}>Montant dépensé</THeadCell>
          <THeadCell className={headCellClassname}>ETP prévisionnel</THeadCell>
          <THeadCell className={headCellClassname}>ETP réel</THeadCell>
        </TRow>
      </THead>
      <TBody>
        {formattedBudget.map((budget, idx) => {
          return (
            <TRow key={budget.annee}>
              <TCell variant="title" className={bodyCellClassname(idx)}>
                {budget.annee}
              </TCell>
              <TCell className={bodyCellClassname(idx)}>
                {budget.eurosPrevisionnel && (
                  <Badge
                    title={
                      <span>
                        {getFormattedNumber(parseInt(budget.eurosPrevisionnel))}{' '}
                        € <sup>HT</sup>
                      </span>
                    }
                    state="standard"
                    light
                    className="mx-auto"
                  />
                )}
              </TCell>
              <TCell className={bodyCellClassname(idx)}>
                {budget.eurosReel && (
                  <Badge
                    title={
                      <span>
                        {getFormattedNumber(parseInt(budget.eurosReel))} €{' '}
                        <sup>HT</sup>
                      </span>
                    }
                    state="standard"
                    light
                    className="mx-auto"
                  />
                )}
              </TCell>
              <TCell className={bodyCellClassname(idx)}>
                {budget.etpPrevisionnel && (
                  <Badge
                    title={
                      <span>
                        {getFormattedNumber(parseInt(budget.etpPrevisionnel))}{' '}
                        ETP
                      </span>
                    }
                    state="standard"
                    light
                    className="mx-auto"
                  />
                )}
              </TCell>
              <TCell className={bodyCellClassname(idx)}>
                {budget.etpReel && (
                  <Badge
                    title={
                      <span>
                        {getFormattedNumber(parseInt(budget.etpReel))} ETP
                      </span>
                    }
                    state="standard"
                    light
                    className="mx-auto"
                  />
                )}
              </TCell>
            </TRow>
          );
        })}
      </TBody>
    </Table>
  );
};

export default BudgetTable;
