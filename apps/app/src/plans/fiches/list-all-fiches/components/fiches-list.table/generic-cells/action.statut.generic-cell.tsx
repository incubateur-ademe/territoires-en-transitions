import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { appLabels } from '@/app/labels/catalog';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { TableCell } from '@tet/ui';
import { ActionGenericCellProps } from './types';

/** Generic cell for the statut of a fiche */
export const ActionStatutGenericCell = ({
  action,
  canUpdate,
  updateAction,
}: ActionGenericCellProps) => (
  <TableCell
    className="py-0"
    canEdit={canUpdate}
    edit={{
      renderOnEdit: ({ openState }) => (
        <StatutsSelectDropdown
          values={action.statut}
          onChange={(statut) => {
            updateAction({
              ficheId: action.id,
              ficheFields: {
                statut: statut || null,
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
    {action.statut ? (
      <BadgeStatut statut={action.statut} size="xs" />
    ) : (
      <span className="text-grey-6">
        {canUpdate ? appLabels.selectionner : ''}
      </span>
    )}
  </TableCell>
);
