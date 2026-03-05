import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { CellContext } from '@tanstack/react-table';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { cn, TableCell } from '@tet/ui';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  info: CellContext<ReferentielTableRow, PersonneTagOrUser[] | undefined>;
};

export const ReferentielTablePersonnesPilotesCell = ({ info }: Props) => {
  const data = info.row.original;

  return (
    <TableCell className={cn(actionTypeToClassName[data.type])}>
      {data.personnesPilotes && data.personnesPilotes.length > 0 ? (
        <ListWithTooltip
          title={data.personnesPilotes[0].nom}
          list={data.personnesPilotes.map((p) => p.nom)}
          className="text-grey-8"
          renderFirstItem={(item) => (
            <span className="max-w-48 line-clamp-1 text-primary-9">{item}</span>
          )}
        />
      ) : null}
    </TableCell>
  );
};
