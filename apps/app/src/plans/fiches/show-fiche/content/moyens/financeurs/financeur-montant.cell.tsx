import { getFormattedNumber } from '@/app/utils/formatUtils';
import { Input, TableCell } from '@tet/ui';
import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useFinanceurFormContext } from './financeur-form.context';

export const FinanceurMontantCell = () => {
  const { form, isReadonly, onSubmit } = useFinanceurFormContext();
  const { control, watch } = form;

  const currentMontantTtc = watch('montantTtc');

  const displayValue = useMemo(() => {
    if (currentMontantTtc !== null && currentMontantTtc !== undefined) {
      return `${getFormattedNumber(currentMontantTtc)} €`;
    }
    return null;
  }, [currentMontantTtc]);

  if (isReadonly) {
    return (
      <TableCell className="font-bold text-primary-9 text-sm">
        {displayValue ?? (
          <span className="italic text-grey-6">Ajouter un montant</span>
        )}
      </TableCell>
    );
  }

  return (
    <TableCell
      className="font-bold text-primary-9 text-sm"
      canEdit={!isReadonly}
      edit={{
        onClose: onSubmit,
        renderOnEdit: ({ openState }) => (
          <Controller
            control={control}
            name="montantTtc"
            render={({ field: { onChange, value, name, ref } }) => (
              <Input
                type="number"
                decimalScale={0}
                icon={{ text: '€' }}
                placeholder="Ajouter un montant"
                value={value?.toString() ?? ''}
                onValueChange={async ({ floatValue, value: raw }) => {
                  const newValue =
                    raw === '' ? undefined : floatValue ?? undefined;
                  onChange(newValue);
                }}
                name={name}
                ref={ref}
                autoFocus
                onBlur={() => {
                  openState.setIsOpen(false);
                }}
                onKeyDown={(evt) => {
                  if (evt.key === 'Enter' || evt.key === 'Escape') {
                    openState.setIsOpen(false);
                  }
                }}
              />
            )}
          />
        ),
      }}
    >
      {displayValue ?? (
        <span className="italic text-grey-6">Ajouter un montant</span>
      )}
    </TableCell>
  );
};
