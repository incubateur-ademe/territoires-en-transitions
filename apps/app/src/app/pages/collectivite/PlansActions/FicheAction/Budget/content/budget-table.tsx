import {
  FormattedBudgetType,
  getBudgetForTable,
} from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/content/utils';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { getFormattedFloat, getFormattedNumber } from '@/app/utils/formatUtils';
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
    <div className="w-full overflow-x-auto">
      <Table className="rounded-none">
        {/* En-tête */}
        <THead className="bg-white">
          <TRow>
            <THeadCell className={headCellClassname}>Année</THeadCell>
            <THeadCell className={headCellClassname}>
              Montant prévisionnel
            </THeadCell>
            <THeadCell className={headCellClassname}>Montant dépensé</THeadCell>
            <THeadCell className={headCellClassname}>
              ETP prévisionnel
            </THeadCell>
            <THeadCell className={headCellClassname}>ETP réel</THeadCell>
          </TRow>
        </THead>

        {/* Data */}
        <TBody>
          {formattedBudget.map((budget, idx) => (
            <TRow key={budget.annee}>
              <TCell
                variant="title"
                className={classNames(bodyCellClassname(idx), 'text-primary-9')}
              >
                {budget.annee}
              </TCell>
              <TCell className={bodyCellClassname(idx)}>
                {budget.eurosPrevisionnel && (
                  <Badge
                    title={
                      <span>
                        {getFormattedNumber(parseInt(budget.eurosPrevisionnel))}{' '}
                        € <sup className="-top-[0.4em]">HT</sup>
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
                        <sup className="-top-[0.4em]">HT</sup>
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
                        {getFormattedFloat(parseFloat(budget.etpPrevisionnel))}{' '}
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
                        {getFormattedFloat(parseFloat(budget.etpReel))} ETP
                      </span>
                    }
                    state="standard"
                    light
                    className="mx-auto"
                  />
                )}
              </TCell>
            </TRow>
          ))}

          {/* Total */}
          <TRow>
            <TCell
              variant="title"
              className={bodyCellClassname(formattedBudget.length)}
            >
              Total
            </TCell>
            <TCell className={bodyCellClassname(formattedBudget.length)}>
              <Badge
                title={
                  <span>
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
                    € <sup className="-top-[0.4em]">HT</sup>
                  </span>
                }
                state="standard"
                className="mx-auto"
              />
            </TCell>
            <TCell className={bodyCellClassname(formattedBudget.length)}>
              <Badge
                title={
                  <span>
                    {getFormattedNumber(
                      formattedBudget.reduce(
                        (sum, currVal) =>
                          sum +
                          (currVal.eurosReel ? parseInt(currVal.eurosReel) : 0),
                        0
                      )
                    )}{' '}
                    € <sup className="-top-[0.4em]">HT</sup>
                  </span>
                }
                state="standard"
                className="mx-auto"
              />
            </TCell>
            <TCell className={bodyCellClassname(formattedBudget.length)}>
              <Badge
                title={
                  <span>
                    {getFormattedFloat(
                      formattedBudget.reduce(
                        (sum, currVal) =>
                          sum +
                          (currVal.etpPrevisionnel
                            ? parseFloat(currVal.etpPrevisionnel)
                            : 0),
                        0
                      )
                    )}{' '}
                    ETP
                  </span>
                }
                state="standard"
                className="mx-auto"
              />
            </TCell>
            <TCell className={bodyCellClassname(formattedBudget.length)}>
              <Badge
                title={
                  <span>
                    {getFormattedFloat(
                      formattedBudget.reduce(
                        (sum, currVal) =>
                          sum +
                          (currVal.etpReel ? parseFloat(currVal.etpReel) : 0),
                        0
                      )
                    )}{' '}
                    ETP
                  </span>
                }
                state="standard"
                className="mx-auto"
              />
            </TCell>
          </TRow>
        </TBody>
      </Table>
    </div>
  );
};

export default BudgetTable;
