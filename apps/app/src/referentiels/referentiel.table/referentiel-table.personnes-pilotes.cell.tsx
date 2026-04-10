import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { CellContext } from '@tanstack/react-table';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { useUpsertMesurePilotes } from '../actions/use-mesure-pilotes';
import { getTableMeta } from './utils';

type Props = {
  info: CellContext<ActionListItem, unknown>;
  canEdit: boolean;
  updateActionPilotes: ReturnType<typeof useUpsertMesurePilotes>['mutate'];
};

export const ReferentielTablePersonnesPilotesCell = ({
  info,
  canEdit,
  updateActionPilotes,
}: Props) => {
  const { actionId, actionType, pilotes } = info.row.original;
  const { collectiviteId } = getTableMeta(info.table);
  const cellId = info.cell.id;

  if (actionType !== ActionTypeEnum.ACTION) {
    return <TableCell tabIndex={-1} data-cell-id={cellId} />;
  }

  return (
    <TableCell
      tabIndex={-1}
      data-cell-id={cellId}
      canEdit={canEdit}
      edit={{
        renderOnEdit: ({ openState }) => (
          <PersonnesDropdown
            displayOptionsWithoutFloater
            openState={openState}
            values={pilotes.map((p) => getPersonneStringId(p))}
            onChange={(pilotes) =>
              updateActionPilotes({
                collectiviteId,
                mesureId: actionId,
                pilotes: pilotes.personnes,
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
