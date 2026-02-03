import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import FinanceursDropdown from '@/app/ui/dropdownLists/FinanceursDropdown/FinanceursDropdown';
import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';
import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useFicheFinanceurs } from '../../../context/hooks/use-fiche-financeurs';
import { useFinanceurFormContext } from './financeur-form.context';

type FinanceurNameCellProps = {
  fiche: FicheWithRelations;
  availableFinanceurIds: number[];
};

export const FinanceurNameCell = ({
  fiche,
  availableFinanceurIds,
}: FinanceurNameCellProps) => {
  const { form, isReadonly, onSubmit } = useFinanceurFormContext();
  const { control, watch } = form;
  const collectiviteIds = getFicheAllEditorCollectiviteIds(fiche);
  const { getFinanceurName } = useFicheFinanceurs(fiche);

  const financeurTagId = watch('financeurTagId');

  const availableIdsForThisRow = useMemo(() => {
    if (!financeurTagId) {
      return availableFinanceurIds;
    }
    return availableFinanceurIds.filter((id) => id !== financeurTagId);
  }, [availableFinanceurIds, financeurTagId]);

  const displayValue = useMemo(() => {
    return getFinanceurName(financeurTagId) ?? null;
  }, [getFinanceurName, financeurTagId]);

  if (isReadonly) {
    return (
      <TableCell className="font-bold text-primary-9 text-sm">
        {displayValue ?? (
          <span className="italic text-grey-6">Sélectionner un financeur</span>
        )}
      </TableCell>
    );
  }

  return (
    <TableCell
      className="text-primary-9 text-sm"
      canEdit={!isReadonly}
      edit={{
        onClose: onSubmit,
        renderOnEdit: ({ openState }) => (
          <Controller
            control={control}
            name="financeurTagId"
            render={({ field: { onChange, value } }) => (
              <FinanceursDropdown
                collectiviteIds={collectiviteIds}
                values={value ? [value] : undefined}
                disabledOptionsIds={availableIdsForThisRow}
                onChange={async ({ selectedFinanceur }) => {
                  if (selectedFinanceur) {
                    onChange(selectedFinanceur.id);
                    openState.setIsOpen(false);
                  }
                }}
                placeholder="Sélectionner ou créer un financeur"
                openState={openState}
                displayOptionsWithoutFloater
              />
            )}
          />
        ),
      }}
    >
      {displayValue ?? (
        <span className="font-normal italic text-grey-6">
          Sélectionner un financeur
        </span>
      )}
    </TableCell>
  );
};
