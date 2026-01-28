import { getFormattedFloat, getFormattedNumber } from '@/app/utils/formatUtils';
import { FicheWithRelations } from '@tet/domain/plans';
import { SelectOption, TableCell, TableRow, VisibleWhen } from '@tet/ui';
import { BudgetPerYear } from '../../../../context/types';
import { useBudgetPerYearForm } from '../use-budget-form';
import {
  BudgetPerYearInputField,
  BudgetPerYearYearSelect,
} from './budget-per-year.form-fields';
import { DeleteBudgetButton } from './delete-budget.button';

type BudgetPerYearRowProps = {
  availableYearOptions: SelectOption[];
  budget: BudgetPerYear;
  fiche: FicheWithRelations;
  isReadonly: boolean;
  onUpsertBudget: (budget: BudgetPerYear) => Promise<void>;
  onDeleteBudget: (year: number) => Promise<void>;
  onCreationComplete?: () => void;
};

export const BudgetPerYearRow = ({
  availableYearOptions,
  budget,
  fiche,
  isReadonly,
  onUpsertBudget,
  onDeleteBudget,
}: BudgetPerYearRowProps) => {
  const form = useBudgetPerYearForm(budget ?? {});

  const { control, handleSubmit, watch } = form;
  const currentRowValue = watch();
  const onSubmit = handleSubmit(onUpsertBudget);

  return (
    <TableRow className="border-b border-gray-200 hover:bg-gray-50 group">
      <TableCell
        className="font-bold text-primary-9 text-sm border-b border-gray-5"
        canEdit={!isReadonly}
        edit={{
          onClose: onSubmit,
          renderOnEdit: ({ openState }) => (
            <BudgetPerYearYearSelect
              control={control}
              availableYearOptions={availableYearOptions}
              openState={openState}
            />
          ),
        }}
      >
        {currentRowValue.year ?? (
          <span className="italic text-grey-6">Sélectionner une année</span>
        )}
      </TableCell>
      <TableCell
        className="font-bold text-primary-9 text-sm border-b border-gray-5"
        canEdit={!isReadonly}
        edit={{
          onClose: onSubmit,
          renderOnEdit: () => (
            <BudgetPerYearInputField
              control={control}
              name="montant"
              decimalScale={0}
              iconText="€"
              placeholder="Ajouter un montant"
            />
          ),
        }}
      >
        {currentRowValue.montant ? (
          <span>{getFormattedNumber(currentRowValue.montant)} € </span>
        ) : (
          <span className="italic text-grey-6">Ajouter un montant</span>
        )}
      </TableCell>
      <TableCell
        className="font-bold text-primary-9 text-sm border-b border-gray-5"
        canEdit={!isReadonly}
        edit={{
          onClose: onSubmit,
          renderOnEdit: () => (
            <BudgetPerYearInputField
              control={control}
              name="depense"
              decimalScale={0}
              iconText="€"
              placeholder="Ajouter un montant"
            />
          ),
        }}
      >
        {currentRowValue.depense ? (
          <span>{getFormattedNumber(currentRowValue.depense)} € </span>
        ) : (
          <span className="italic text-grey-6">Ajouter un montant</span>
        )}
      </TableCell>
      <TableCell
        className="font-bold text-primary-9 text-sm border-b border-gray-5"
        canEdit={!isReadonly}
        edit={{
          onClose: onSubmit,
          renderOnEdit: () => (
            <BudgetPerYearInputField
              control={control}
              name="etpPrevisionnel"
              decimalScale={2}
              iconText="ETP"
              placeholder="Ajouter une valeur"
            />
          ),
        }}
      >
        {currentRowValue.etpPrevisionnel ? (
          <span>{getFormattedFloat(currentRowValue.etpPrevisionnel)} ETP</span>
        ) : (
          <span className="italic text-grey-6">Ajouter une valeur</span>
        )}
      </TableCell>
      <TableCell
        className="font-bold text-primary-9 text-sm border-b border-gray-5"
        canEdit={!isReadonly}
        edit={{
          onClose: onSubmit,
          renderOnEdit: () => (
            <BudgetPerYearInputField
              control={control}
              name="etpReel"
              decimalScale={2}
              iconText="ETP"
              placeholder="Ajouter une valeur"
            />
          ),
        }}
      >
        {currentRowValue.etpReel ? (
          <span>{getFormattedFloat(currentRowValue.etpReel)} ETP</span>
        ) : (
          <span className="italic text-grey-6">Ajouter une valeur</span>
        )}
      </TableCell>
      <VisibleWhen condition={!isReadonly}>
        <TableCell className="text-right border-b border-gray-5 w-[100px]">
          <DeleteBudgetButton
            year={currentRowValue.year}
            onDelete={() => {
              if (currentRowValue.year) {
                onDeleteBudget(currentRowValue.year);
              }
            }}
            fiche={fiche}
          />
        </TableCell>
      </VisibleWhen>
    </TableRow>
  );
};
