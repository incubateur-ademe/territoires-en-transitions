import { Button, SelectOption, TableCell, TableRow } from '@tet/ui';
import { BudgetPerYear } from '../../../../context/types';
import { useBudgetPerYearForm } from '../use-budget-form';
import {
  BudgetPerYearNewRowInputField,
  BudgetPerYearYearSelect,
} from './budget-per-year.form-fields';

type BudgetTableNewRowProps = {
  availableYearOptions: SelectOption[];
  onUpsertBudget: (budget: BudgetPerYear) => Promise<void>;
  onCancel: () => void;
};

export const BudgetPerYearTableNewRow = ({
  onUpsertBudget,
  availableYearOptions,
  onCancel,
}: BudgetTableNewRowProps) => {
  const form = useBudgetPerYearForm();

  const { control, handleSubmit, reset } = form;

  const onSubmit = handleSubmit(async (data) => {
    await onUpsertBudget(data);
    reset();
  });

  return (
    <TableRow className="hover:bg-gray-50 group">
      <TableCell className="font-bold text-primary-9 text-sm">
        <BudgetPerYearYearSelect
          control={control}
          availableYearOptions={availableYearOptions}
        />
      </TableCell>
      <TableCell className="text-primary-9 border-b border-gray-5 text-center">
        <BudgetPerYearNewRowInputField
          control={control}
          name="montant"
          decimalScale={0}
          iconText="€"
          placeholder="Ajouter un montant"
        />
      </TableCell>
      <TableCell className="text-primary-9 border-b border-gray-5 text-center">
        <BudgetPerYearNewRowInputField
          control={control}
          name="depense"
          decimalScale={0}
          iconText="€"
          placeholder="Ajouter un montant"
        />
      </TableCell>
      <TableCell className="text-primary-9 border-b border-gray-5 text-center">
        <BudgetPerYearNewRowInputField
          control={control}
          name="etpPrevisionnel"
          decimalScale={2}
          iconText="ETP"
          placeholder="Ajouter une valeur"
        />
      </TableCell>
      <TableCell className="text-primary-9 border-b border-gray-5 text-center">
        <BudgetPerYearNewRowInputField
          control={control}
          name="etpReel"
          decimalScale={2}
          iconText="ETP"
          placeholder="Ajouter une valeur"
        />
      </TableCell>
      <TableCell className="text-right border-b border-gray-5 w-[100px]">
        <div className="flex gap-2">
          <Button
            size="xs"
            variant="primary"
            type="submit"
            onClick={onSubmit}
            icon="save-line"
          />
          <Button
            size="xs"
            variant="grey"
            icon="close-line"
            onClick={() => {
              reset();
              onCancel?.();
            }}
          />
        </div>
      </TableCell>
    </TableRow>
  );
};
