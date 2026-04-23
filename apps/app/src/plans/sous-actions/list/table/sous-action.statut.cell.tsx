import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';
import { useCanEditSousAction } from '../../data/use-can-edit-sous-action';
import { useUpdateSousAction } from '../../data/use-update-sous-action';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionStatutCell = ({ sousAction }: Props) => {
  const canUpdate = useCanEditSousAction(sousAction);

  const { mutate: updateSousAction } = useUpdateSousAction();

  return (
    <TableCell
      className="py-0"
      canEdit={canUpdate}
      edit={{
        renderOnEdit: ({ openState }) => (
          <StatutsSelectDropdown
            values={sousAction.statut}
            onChange={(statut) => {
              updateSousAction({
                ficheId: sousAction.id,
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
      {sousAction.statut ? (
        <BadgeStatut statut={sousAction.statut} size="xs" />
      ) : (
        <span className="text-grey-6">{canUpdate ? 'Sélectionner' : ''}</span>
      )}
    </TableCell>
  );
};
