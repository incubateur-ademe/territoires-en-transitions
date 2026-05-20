import FichePrioriteBadge from '@/app/plans/fiches/show-fiche/components/fiche-priorite.badge';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import { ficheActionNiveauPrioriteOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { isPriorite, Priorite } from '@tet/domain/plans';
import { InlineEditWrapper, Select } from '@tet/ui';
import { JSX } from 'react';

export const Priority = ({
  priority,
}: {
  priority: Priorite | null;
}): JSX.Element => {
  const { fiche, isReadonly, isUpdating, update } = useFicheContext();
  return (
    <InlineEditWrapper
      disabled={isReadonly}
      renderOnEdit={({ openState }) => (
        <div className="min-w-[240px]">
          <Select
            options={ficheActionNiveauPrioriteOptions}
            values={priority ?? undefined}
            onChange={(value) => {
              update({
                ficheId: fiche.id,
                ficheFields: {
                  priorite: isPriorite(value) ? value : null,
                },
              });
            }}
            custom={{
              renderOptionItem: (item) => (
                <FichePrioriteBadge
                  priorite={isPriorite(item.value) ? item.value : null}
                />
              ),
            }}
            inlineEdit
            openState={openState}
            disabled={isUpdating}
          />
        </div>
      )}
    >
      {(props) => (
        <button type="button" {...props}>
          <FichePrioriteBadge priorite={priority} size="xs" />
        </button>
      )}
    </InlineEditWrapper>
  );
};
