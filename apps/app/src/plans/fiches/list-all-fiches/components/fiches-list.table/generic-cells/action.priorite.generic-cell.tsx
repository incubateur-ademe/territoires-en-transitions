import BadgePriorite from '@/app/app/pages/collectivite/PlansActions/components/BadgePriorite';
import PrioritesSelectDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesSelectDropdown';
import { TableCell } from '@tet/ui';
import { ActionGenericCellProps } from './types';

/** Generic cell for the priorite of a fiche */
export const ActionPrioriteGenericCell = ({
  action,
  canUpdate,
  updateAction,
}: ActionGenericCellProps) => (
  <TableCell
    className="py-0"
    canEdit={canUpdate}
    edit={{
      renderOnEdit: ({ openState }) => (
        <PrioritesSelectDropdown
          values={action.priorite}
          onChange={(priorite) => {
            updateAction({
              ficheId: action.id,
              ficheFields: {
                priorite: priorite || null,
              },
            });
          }}
          inlineEdit
          openState={openState}
          badgeSize="xs"
        />
      ),
    }}
  >
    {action.priorite ? (
      <BadgePriorite priorite={action.priorite} size="xs" />
    ) : (
      <span className="text-grey-6">{canUpdate ? 'Sélectionner' : ''}</span>
    )}
  </TableCell>
);
