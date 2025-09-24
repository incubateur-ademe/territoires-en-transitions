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
                        {getFormattedNumber(budget.eurosPrevisionnel)} €{' '}
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
                {budget.eurosReel && (
                  <Badge
                    title={
                      <span>
                        {getFormattedNumber(budget.eurosReel)} €{' '}
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
                        {getFormattedFloat(budget.etpPrevisionnel)} ETP
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
                    title={<span>{getFormattedFloat(budget.etpReel)} ETP</span>}
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
                      calculateTotal(formattedBudget, true, 'eurosPrevisionnel')
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
                      calculateTotal(formattedBudget, true, 'eurosReel')
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
                      calculateTotal(formattedBudget, false, 'etpPrevisionnel')
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
                      calculateTotal(formattedBudget, false, 'etpReel')
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

const calculateTotal = (
  formattedBudget: FormattedBudgetType,
  isEuros: boolean,
  fieldType: 'etpPrevisionnel' | 'etpReel' | 'eurosPrevisionnel' | 'eurosReel'
) => {
  const total = formattedBudget.reduce(
    (sum, currValue) => sum + (currValue[fieldType] ? currValue[fieldType] : 0),
    0
  );
  return isEuros ? total : Number(total.toFixed(2));
};

export default BudgetTable;
