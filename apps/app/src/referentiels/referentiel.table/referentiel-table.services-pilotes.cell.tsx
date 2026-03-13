import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { CellContext } from '@tanstack/react-table';
import { TagWithCollectiviteId } from '@tet/domain/collectivites';
import { cn, TableCell } from '@tet/ui';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  info: CellContext<ReferentielTableRow, TagWithCollectiviteId[] | undefined>;
};

export const ReferentielTableServicesPilotesCell = ({ info }: Props) => {
  const data = info.row.original;

  return (
    <TableCell className={cn(actionTypeToClassName[data.type])}>
      {data.servicesPilotes && data.servicesPilotes.length > 0 ? (
        <ListWithTooltip
          title={data.servicesPilotes[0].nom}
          list={data.servicesPilotes.map((s) => s.nom)}
          className="text-grey-8"
          renderFirstItem={(item) => (
            <span className="max-w-48 line-clamp-1 text-primary-9">{item}</span>
          )}
        />
      ) : null}
    </TableCell>
  );
};
