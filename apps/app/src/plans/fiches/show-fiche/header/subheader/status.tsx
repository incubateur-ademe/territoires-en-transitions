import { StatusBadge } from '@/app/plans/fiches/show-fiche/components/status.badge';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Statut } from '@tet/domain/plans';
import { InlineEditWrapper, Select } from '@tet/ui';

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
            onChange={async (value) => {
              await update({
                ficheId: fiche.id,
                ficheFields: {
                  statut: value === 'null' ? null : (value as Statut),
                },
              });
              openState.setIsOpen(false);
            }}
            customItem={(item) => (
              <StatusBadge
                status={item.value === 'null' ? null : (item.value as Statut)}
              />
            )}
            buttonClassName="border-0 border-b"
            displayOptionsWithoutFloater
            openState={openState}
            disabled={isUpdating}
          />
        </div>
      )}
    >
      <button type="button">
        <StatusBadge status={status} />
      </button>
    </InlineEditWrapper>
  );
};
