import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionCellPilotes = ({ sousAction }: Props) => {
  const { isReadOnly } = useCurrentCollectivite();

  const { mutate: updateFiche } = useUpdateFiche();

  return (
    <TableCell
      canEdit={!isReadOnly}
      edit={{
        renderOnEdit: ({ openState }) => (
          <div className="w-80">
            <PersonnesDropdown
              values={sousAction.pilotes?.map((p) => getPersonneStringId(p))}
              onChange={(pilotes) => {
                updateFiche({
                  ficheId: sousAction.id,
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
      {sousAction.pilotes && sousAction.pilotes.length > 0 ? (
        <ListWithTooltip
          title={sousAction.pilotes[0].nom}
          list={sousAction.pilotes.map((p) => p.nom)}
          className="text-grey-8"
          renderFirstItem={(item) => (
            <span className="max-w-48 line-clamp-1 text-primary-9">{item}</span>
          )}
        />
      ) : (
        <span className="text-grey-6">{isReadOnly ? '' : 'Sélectionner'}</span>
      )}
    </TableCell>
  );
};
