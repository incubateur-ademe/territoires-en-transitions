import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';
import { useUpdateSousAction } from '../../data/use-update-sous-action';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionCellStatut = ({ sousAction }: Props) => {
  const { isReadOnly } = useCurrentCollectivite();
  const { mutate: updateSousAction } = useUpdateSousAction();

  return (
    <TableCell
      className="py-0"
      canEdit={!isReadOnly}
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
            displayOptionsWithoutFloater
            openState={openState}
            size="sm"
          />
        ),
      }}
    >
      {sousAction.statut ? (
        <BadgeStatut statut={sousAction.statut} size="sm" />
      ) : (
        <span className="text-grey-6">{isReadOnly ? '' : 'Sélectionner'}</span>
      )}
    </TableCell>
  );
};
