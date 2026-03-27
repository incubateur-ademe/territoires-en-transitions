import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { CellContext } from '@tanstack/react-table';
import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { useUpsertMesureServicesPilotes } from '../actions/use-mesure-services-pilotes';
import { useReferentielTableCellFocus } from './referentiel-table.keyboard';
import { getTableMeta } from './utils';

type Props = {
  info: CellContext<ActionListItem, unknown>;
  canEdit: boolean;
  updateActionServices: ReturnType<
    typeof useUpsertMesureServicesPilotes
  >['mutate'];
};

export const ReferentielTableServicesPilotesCell = ({
  info,
  canEdit,
  updateActionServices,
}: Props) => {
  const { referentielCellProps } = useReferentielTableCellFocus(info.cell);
  const { actionId, services } = info.row.original;
  const { collectiviteId } = getTableMeta(info.table);

  return (
    <TableCell
      {...referentielCellProps}
      canEdit={canEdit}
      edit={{
        renderOnEdit: ({ openState }) => (
          <ServicesPilotesDropdown
            displayOptionsWithoutFloater
            openState={openState}
            values={services.map((s) => s.id)}
            onChange={(services) =>
              updateActionServices({
                collectiviteId,
                mesureId: actionId,
                services: services.services.map((s) => ({
                  serviceTagId: s.id,
                })),
              })
            }
          />
        ),
      }}
    >
      {services.length > 0 && (
        <ListWithTooltip
          title={services[0].nom}
          list={services.map((s) => s.nom)}
          className="text-grey-8"
          renderFirstItem={(item) => (
            <span className="max-w-48 line-clamp-1 text-primary-9">{item}</span>
          )}
        />
      )}
    </TableCell>
  );
};
