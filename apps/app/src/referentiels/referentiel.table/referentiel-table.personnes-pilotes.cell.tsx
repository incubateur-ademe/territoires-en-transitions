import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { CellContext } from '@tanstack/react-table';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { getTableMeta } from './utils';

type Props = {
  info: CellContext<ActionListItem, unknown>;
};

export const ReferentielTablePersonnesPilotesCell = ({ info }: Props) => {
  const { actionId, actionType, pilotes } = info.row.original;
  const cellId = info.cell.id;
  const {
    collectiviteId,
    permissions: { canMutateReferentiel },
    updateActionPilotes,
  } = getTableMeta(info.table);

  if (actionType !== ActionTypeEnum.ACTION) {
    return <TableCell tabIndex={-1} data-cell-id={cellId} />;
  }

  return (
    <TableCell
      tabIndex={-1}
      data-cell-id={cellId}
      canEdit={canMutateReferentiel}
      placeholder="Ajouter un pilote"
      edit={{
        renderOnEdit: ({ openState }) => (
          <PersonneTagDropdown
            inlineEdit={true}
            // buttonClassName="border-none outline-none"
            openState={openState}
            values={pilotes.map((p) => getPersonneStringId(p))}
            onChange={({ personnes }) =>
              updateActionPilotes({
                collectiviteId,
                mesureId: actionId,
                pilotes: personnes,
              })
            }
          />
        ),
      }}
    >
      {pilotes.length > 0 && (
        <ListWithTooltip
          title={pilotes[0].nom}
          list={pilotes.map((p) => p.nom)}
          className="text-grey-8"
          renderFirstItem={(item) => (
            <span className="max-w-48 line-clamp-1 text-primary-9">{item}</span>
          )}
        />
      )}
    </TableCell>
  );
};
