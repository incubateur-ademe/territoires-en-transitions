import { StatusBadge } from '@/app/plans/fiches/show-fiche/components/status.badge';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { isStatut, Statut } from '@tet/domain/plans';
import { InlineEditWrapper, Select } from '@tet/ui';
import { JSX } from 'react';
import { forceOpenSelect } from '../../utils';

export const Status = ({ status }: { status: Statut | null }): JSX.Element => {
  const { fiche, isReadonly, isUpdating, update } = useFicheContext();

  return (
    <InlineEditWrapper
      disabled={isReadonly}
      renderOnEdit={() => (
        <div className="min-w-[240px]">
          <Select
            openState={forceOpenSelect}
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
            disabled={isUpdating}
          />
        </div>
      )}
    >
      {(props) => (
        <button type="button" {...props}>
          <StatusBadge status={status} />
        </button>
      )}
    </InlineEditWrapper>
  );
};
