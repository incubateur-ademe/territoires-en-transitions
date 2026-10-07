import { CellContext } from '@tanstack/react-table';
import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { ReferentielTableFeatures } from './utils';

type Props = {
  info: CellContext<
    ReferentielTableFeatures,
    ActionListItem,
    ActionListItem['thematiques']
  >;
};

export const ReferentielTableThematiquesCell = ({ info }: Props) => {
  const thematiques = info.getValue();
  const cellId = info.cell.id;

  return (
    <TableCell tabIndex={-1} data-cell-id={cellId}>
      {thematiques && thematiques.length > 0 && (
        <span className="text-grey-8">
          {thematiques.map(({ nom }) => nom).join(', ')}
        </span>
      )}
    </TableCell>
  );
};
