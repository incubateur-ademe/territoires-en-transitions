import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { appLabels } from '@/app/labels/catalog';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { TableCell } from '@tet/ui';
import { ActionGenericCellProps } from './types';

/** Generic cell for the pilotes of a fiche */
export const ActionPilotesGenericCell = ({
  action,
  canUpdate,
  updateAction,
}: ActionGenericCellProps) => (
  <TableCell
    canEdit={canUpdate}
    edit={{
      renderOnEdit: ({ openState }) => (
        <div className="w-80">
          <PersonneTagDropdown
            inlineEdit
            openState={openState}
            values={action.pilotes?.map((p) => getPersonneStringId(p))}
            onChange={(pilotes) => {
              updateAction({
                ficheId: action.id,
                ficheFields: { pilotes: pilotes.personnes },
              });
            }}
          />
        </div>
      ),
    }}
  >
    {action.pilotes && action.pilotes.length > 0 ? (
      <ListWithTooltip
        title={action.pilotes[0].nom}
        list={action.pilotes.map((p) => p.nom)}
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
