import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';

type Props = {
  fiche: FicheWithRelations;
};

export const SousActionCellStatut = ({ fiche }: Props) => {
  const { mutate: updateFiche } = useUpdateFiche();

  return (
    <TableCell
      canEdit
      edit={{
        renderOnEdit: ({ openState }) => (
          <StatutsSelectDropdown
            values={fiche.statut}
            onChange={(statut) => {
              updateFiche({
                ficheId: fiche.id,
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
      {fiche.statut ? (
        <BadgeStatut statut={fiche.statut} size="sm" />
      ) : (
        <span className="text-grey-6">Sélectionner un statut</span>
      )}
    </TableCell>
  );
};
