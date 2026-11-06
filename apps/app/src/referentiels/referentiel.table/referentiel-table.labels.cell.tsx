import { CellContext } from '@tanstack/react-table';
import { referentielLabelToShortName } from '@/app/app/labels';
import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { ReferentielTableFeatures } from './utils';

type Props = {
  info: CellContext<
    ReferentielTableFeatures,
    ActionListItem,
    ActionListItem['labels']
  >;
};

export const ReferentielTableLabelsCell = ({ info }: Props) => {
  const labels = info.getValue();
  const cellId = info.cell.id;

  return (
    <TableCell tabIndex={-1} data-cell-id={cellId}>
      {labels && labels.length > 0 && (
        <span className="text-grey-8">
          {labels.map((label) => referentielLabelToShortName[label]).join(', ')}
        </span>
      )}
    </TableCell>
  );
};
