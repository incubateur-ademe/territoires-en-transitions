import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionCellStatut = ({ sousAction }: Props) => {
  const { isReadOnly } = useCurrentCollectivite();
  const { mutate: updateFiche } = useUpdateFiche();

  return (
    <TableCell
      canEdit={!isReadOnly}
      edit={{
        renderOnEdit: ({ openState }) => (
          <StatutsSelectDropdown
            values={sousAction.statut}
            onChange={(statut) => {
              updateFiche({
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
        <span className="text-grey-6">
          {isReadOnly ? '' : 'Sélectionner un statut'}
        </span>
      )}
    </TableCell>
  );
};
