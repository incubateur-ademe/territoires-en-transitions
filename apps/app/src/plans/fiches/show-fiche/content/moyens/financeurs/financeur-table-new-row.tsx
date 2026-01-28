import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import FinanceursDropdown from '@/app/ui/dropdownLists/FinanceursDropdown/FinanceursDropdown';
import { useFinanceursListe } from '@/app/ui/dropdownLists/FinanceursDropdown/useFinanceursListe';
import { TagWithCollectiviteId } from '@tet/domain/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { Button, Input, TableCell, TableRow } from '@tet/ui';
import React from 'react';
import { Controller } from 'react-hook-form';
import { FinanceurRowFormValues, useFinanceurForm } from './use-financeur-form';

type FinanceurTableNewRowProps = {
  fiche: FicheWithRelations;
  availableFinanceurIds: number[];
  onUpsertFinanceur: (financeur: {
    financeurTagId: number;
    montantTtc: number;
    financeurTag: TagWithCollectiviteId;
  }) => Promise<void>;
  onCancel: () => void;
};

export const FinanceurTableNewRow = ({
  fiche,
  availableFinanceurIds,
  onUpsertFinanceur,
  onCancel,
}: FinanceurTableNewRowProps) => {
  const form = useFinanceurForm();
  const { control, handleSubmit, reset } = form;
  const collectiviteIds = getFicheAllEditorCollectiviteIds(fiche);
  const { data: financeursList } = useFinanceursListe(collectiviteIds);

  const onSubmit = React.useCallback(
    async (data: FinanceurRowFormValues) => {
      const selectedFinanceurTag = financeursList?.find(
        (f) => f.id === data.financeurTagId
      );

      if (!selectedFinanceurTag) return;

      await onUpsertFinanceur({
        financeurTagId: data.financeurTagId,
        montantTtc: data.montantTtc,
        financeurTag: selectedFinanceurTag,
      });
      reset();
    },
    [onUpsertFinanceur, financeursList, reset]
  );

  return (
    <TableRow className="border-b border-gray-200 hover:bg-gray-50 group">
      <TableCell className="text-primary-9 border-b border-gray-5">
        <Controller
          control={control}
          name="financeurTagId"
          render={({ field: { onChange, value } }) => (
            <div className="w-[200px]">
              <FinanceursDropdown
                collectiviteIds={collectiviteIds}
                values={value ? [value] : undefined}
                disabledOptionsIds={availableFinanceurIds}
                onChange={({ selectedFinanceur }) => {
                  if (selectedFinanceur) {
                    onChange(selectedFinanceur.id);
                  }
                }}
                placeholder="Sélectionner un financeur"
                multiple={false}
              />
            </div>
          )}
        />
      </TableCell>
      <TableCell className="text-primary-9 border-b border-gray-5 text-center">
        <Controller
          control={control}
          name="montantTtc"
          render={({ field: { onChange, value, name, ref } }) => (
            <Input
              className="w-[200px]"
              type="number"
              decimalScale={0}
              icon={{ text: '€' }}
              placeholder="Ajouter un montant"
              value={value?.toString() ?? ''}
              onValueChange={({ floatValue, value: raw }) =>
                onChange(raw === '' ? undefined : floatValue ?? undefined)
              }
              name={name}
              ref={ref}
            />
          )}
        />
      </TableCell>
      <TableCell className="text-right border-b border-gray-5 w-[100px]">
        <div className="flex gap-2">
          <Button
            size="xs"
            variant="primary"
            type="submit"
            onClick={handleSubmit(onSubmit)}
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
