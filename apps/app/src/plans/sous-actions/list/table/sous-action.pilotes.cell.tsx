import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { appLabels } from '@/app/labels/catalog';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';
import { useCanEditSousAction } from '../../data/use-can-edit-sous-action';
import { useUpdateSousAction } from '../../data/use-update-sous-action';

type Props = {
  sousAction: FicheWithRelations;
};

export const SousActionPilotesCell = ({ sousAction }: Props) => {
  const canUpdate = useCanEditSousAction(sousAction);

  const { mutate: updateSousAction } = useUpdateSousAction();

  return (
    <TableCell
      canEdit={canUpdate}
      edit={{
        renderOnEdit: ({ openState }) => (
          <div className="w-80">
            <PersonneTagDropdown
              inlineEdit
              openState={openState}
              values={sousAction.pilotes?.map((p) => getPersonneStringId(p))}
              onChange={(pilotes) => {
                updateSousAction({
                  ficheId: sousAction.id,
                  ficheFields: { pilotes: pilotes.personnes },
                });
              }}
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
        <span className="text-grey-6">
          {canUpdate ? appLabels.selectionner : ''}
        </span>
      )}
    </TableCell>
  );
};
