import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { isFicheEditableByCollectiviteUser } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';
import { useUpdateSousAction } from '../../data/use-update-sous-action';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionStatutCell = ({ sousAction }: Props) => {
  const collectivite = useCurrentCollectivite();

  const { id: userId } = useUser();

  const canUpdate = isFicheEditableByCollectiviteUser(
    sousAction,
    collectivite,
    userId
  );

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
        <span className="text-grey-6">{canUpdate ? 'Sélectionner' : ''}</span>
      )}
    </TableCell>
  );
};
