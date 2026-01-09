import { StatusBadge } from '@/app/plans/fiches/show-fiche/components/status.badge';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { isStatut, Statut } from '@tet/domain/plans';
import { InlineEditWrapper, Select } from '@tet/ui';
import { JSX } from 'react';

export const Status = ({ status }: { status: Statut | null }): JSX.Element => {
  const { fiche, isReadonly, isUpdating, update } = useFicheContext();

  return (
    <InlineEditWrapper
      disabled={isReadonly}
      renderOnEdit={({ openState }) => (
        <div className="min-w-[240px]">
          <Select
            options={ficheActionStatutOptions}
            values={status ?? undefined}
            onChange={(value) => {
              update({
                ficheId: fiche.id,
                ficheFields: {
                  statut: isStatut(value) ? value : null,
                },
              });
            }}
            customItem={(item) => (
              <StatusBadge status={isStatut(item.value) ? item.value : null} />
            )}
            buttonClassName="border-0 border-b"
            displayOptionsWithoutFloater
            openState={openState}
            disabled={isUpdating}
          />
        </div>
      )}
    >
      <StatusBadge status={status} />
    </InlineEditWrapper>
  );
};
