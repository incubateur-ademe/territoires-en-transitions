import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import FinanceursDropdown from '@/app/ui/dropdownLists/FinanceursDropdown/FinanceursDropdown';
import { useFinanceursListe } from '@/app/ui/dropdownLists/FinanceursDropdown/useFinanceursListe';
import { getFormattedNumber } from '@/app/utils/formatUtils';
import { TagWithCollectiviteId } from '@tet/domain/collectivites';
import { FicheWithRelations, Financeur } from '@tet/domain/plans';
import { Input, TableCell, TableRow, VisibleWhen } from '@tet/ui';
import React, { useCallback } from 'react';
import { Controller } from 'react-hook-form';
import { DeleteFinanceurButton } from './delete-financeur.button';
import { FinanceurRowFormValues, useFinanceurForm } from './use-financeur-form';

type EditableFinanceurRowProps = {
  financeur: Financeur;
  fiche: FicheWithRelations;
  isReadonly: boolean;
  availableFinanceurIds: number[];
  onUpsertFinanceur: (financeur: {
    financeurTagId: number;
    montantTtc: number;
    financeurTag: TagWithCollectiviteId;
  }) => Promise<void>;
  onDeleteFinanceur: (financeurTagId: number) => Promise<void>;
};

export const FinanceurTableRow = ({
  financeur,
  fiche,
  isReadonly,
  availableFinanceurIds,
  onUpsertFinanceur,
  onDeleteFinanceur,
}: EditableFinanceurRowProps) => {
  const form = useFinanceurForm(financeur);
  const { control, handleSubmit, watch } = form;
  const currentRowValue = watch();
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
    },
    [onUpsertFinanceur, financeursList]
  );

  const onSubmitCallback = useCallback(
    () => handleSubmit(onSubmit)(),
    [handleSubmit, onSubmit]
  );

  return (
    <TableRow className="hover:bg-gray-50 group">
      <TableCell
        className="font-bold text-primary-9 text-sm"
        canEdit={!isReadonly}
        edit={{
          onClose: onSubmitCallback,
          renderOnEdit: ({ openState }) => (
            <Controller
              control={control}
              name="financeurTagId"
              render={({ field: { onChange, value } }) => (
                <FinanceursDropdown
                  collectiviteIds={collectiviteIds}
                  values={value ? [value] : undefined}
                  disabledOptionsIds={availableFinanceurIds.filter(
                    (id) => id !== value
                  )}
                  onChange={({ selectedFinanceur }) => {
                    if (selectedFinanceur) {
                      onChange(selectedFinanceur.id);
                      openState.setIsOpen(false);
                    }
                  }}
                  placeholder="Sélectionner un financeur"
                  openState={openState}
                  displayOptionsWithoutFloater
                />
              )}
            />
          ),
        }}
      >
        {financeur?.financeurTag.nom ?? (
          <span className="italic text-grey-6">Sélectionner un financeur</span>
        )}
      </TableCell>
      <TableCell
        className="font-bold text-primary-9 text-sm"
        canEdit={!isReadonly}
        edit={{
          onClose: onSubmitCallback,
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
                  onValueChange={({ floatValue, value: raw }) =>
                    onChange(raw === '' ? undefined : floatValue ?? undefined)
                  }
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
        {currentRowValue.montantTtc !== null &&
        currentRowValue.montantTtc !== undefined ? (
          <span>{getFormattedNumber(currentRowValue.montantTtc)} € </span>
        ) : (
          <span className="italic text-grey-6">Ajouter un montant</span>
        )}
      </TableCell>
      <VisibleWhen condition={!isReadonly}>
        <TableCell className="text-right w-[100px]">
          <DeleteFinanceurButton
            financeur={financeur}
            onDelete={() => onDeleteFinanceur(financeur.financeurTagId)}
            fiche={fiche}
          />
        </TableCell>
      </VisibleWhen>
    </TableRow>
  );
};
