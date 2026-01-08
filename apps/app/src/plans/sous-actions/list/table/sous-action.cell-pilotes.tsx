import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';

type Props = {
  fiche: FicheWithRelations;
};

export const SousActionCellPilotes = ({ fiche }: Props) => {
  const { mutate: updateFiche } = useUpdateFiche();

  return (
    <TableCell
      canEdit
      edit={{
        renderOnEdit: ({ openState }) => (
          <div className="w-80">
            <PersonnesDropdown
              values={fiche.pilotes?.map((p) => getPersonneStringId(p))}
              onChange={(pilotes) => {
                updateFiche({
                  ficheId: fiche.id,
                  ficheFields: { pilotes: pilotes.personnes },
                });
              }}
              openState={openState}
              displayOptionsWithoutFloater
            />
          </div>
        ),
      }}
    >
      {fiche.pilotes && fiche.pilotes.length > 0 ? (
        <ListWithTooltip
          title={fiche.pilotes[0].nom}
          list={fiche.pilotes.map((p) => p.nom)}
          className="text-grey-8"
          renderFirstItem={(item) => (
            <span className="max-w-48 line-clamp-1 text-primary-9">{item}</span>
          )}
        />
      ) : (
        <span className="text-grey-6">Sélectionner des pilotes</span>
      )}
    </TableCell>
  );
};
