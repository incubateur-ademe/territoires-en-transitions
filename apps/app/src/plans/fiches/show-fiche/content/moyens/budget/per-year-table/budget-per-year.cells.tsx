import { getFormattedFloat, getFormattedNumber } from '@/app/utils/formatUtils';
import { FicheWithRelations } from '@tet/domain/plans';
import { SelectOption, TableCell, VisibleWhen } from '@tet/ui';
import { isNil } from 'es-toolkit';
import { useMemo } from 'react';
import { useBudgetPerYearFormContext } from './budget-per-year-form.context';
import {
  BudgetPerYearInputField,
  BudgetPerYearYearSelect,
} from './budget-per-year.form-fields';
import { DeleteBudgetButton } from './delete-budget.button';

const Placeholder = ({ label }: { label: string }) => (
  <span className="font-normal italic text-grey-6">{label}</span>
);

export const BudgetPerYearYearCell = ({
  availableYearOptions,
}: {
  availableYearOptions: SelectOption[];
}) => {
  const { form, isReadonly, onSubmit } = useBudgetPerYearFormContext();
  const { control, watch } = form;
  const currentYear = watch('year');

  return (
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
      {currentYear ?? <Placeholder label="Sélectionner une année" />}
    </TableCell>
  );
};

const BudgetPerYearNumberCell = ({
  name,
  decimalScale,
  iconText,
  emptyLabel,
}: {
  name: 'montant' | 'depense' | 'etpPrevisionnel' | 'etpReel';
  decimalScale: number;
  iconText: string;
  emptyLabel: string;
}) => {
  const { form, isReadonly, onSubmit } = useBudgetPerYearFormContext();
  const { control, watch } = form;
  const currentValue = watch(name);
  const displayValue = useMemo(() => {
    if (isNil(currentValue)) {
      return null;
    }
    if (name === 'montant' || name === 'depense') {
      return `${getFormattedNumber(currentValue)} €`;
    }
    return `${getFormattedFloat(currentValue)} ETP`;
  }, [currentValue, name]);

  return (
    <TableCell
      className="font-bold text-primary-9 text-sm border-b border-gray-5 py-2"
      canEdit={!isReadonly}
      edit={{
        floatingMatchReferenceHeight: false,
        onClose: onSubmit,
        renderOnEdit: ({ openState }) => (
          <BudgetPerYearInputField
            control={control}
            name={name}
            decimalScale={decimalScale}
            iconText={iconText}
            placeholder={emptyLabel}
            onKeyDown={(evt) => {
              if (evt.key === 'Enter' || evt.key === 'Escape') {
                openState.setIsOpen(false);
              }
            }}
          />
        ),
      }}
    >
      {displayValue ?? <Placeholder label={emptyLabel} />}
    </TableCell>
  );
};

export const BudgetPerYearMontantCell = () => (
  <BudgetPerYearNumberCell
    name="montant"
    decimalScale={0}
    iconText="€"
    emptyLabel="Ajouter un montant"
  />
);

export const BudgetPerYearDepenseCell = () => (
  <BudgetPerYearNumberCell
    name="depense"
    decimalScale={0}
    iconText="€"
    emptyLabel="Ajouter un montant"
  />
);

export const BudgetPerYearEtpPrevisionnelCell = () => (
  <BudgetPerYearNumberCell
    name="etpPrevisionnel"
    decimalScale={2}
    iconText="ETP"
    emptyLabel="Ajouter une valeur"
  />
);

export const BudgetPerYearEtpReelCell = () => (
  <BudgetPerYearNumberCell
    name="etpReel"
    decimalScale={2}
    iconText="ETP"
    emptyLabel="Ajouter une valeur"
  />
);

export const BudgetPerYearActionsCell = ({
  fiche,
  onDeleteBudget,
}: {
  fiche: FicheWithRelations;
  onDeleteBudget: (year: number) => Promise<void>;
}) => {
  const { form, isReadonly } = useBudgetPerYearFormContext();

  return (
    <VisibleWhen condition={!isReadonly}>
      <TableCell className="w-full flex justify-center">
        <DeleteBudgetButton
          year={form.getValues().year}
          onDelete={async () => {
            const { year } = form.getValues();
            if (year) {
              await onDeleteBudget(year);
            }
          }}
          fiche={fiche}
        />
      </TableCell>
    </VisibleWhen>
  );
};
