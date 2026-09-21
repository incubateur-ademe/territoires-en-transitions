import { CellContext } from '@tanstack/react-table';
import { ReferentielLabelEnum } from '@tet/domain/referentiels';
import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';

const labelDisplayNames: Record<string, string> = {
  [ReferentielLabelEnum.TE_CAE]: 'CAE',
  [ReferentielLabelEnum.TE_ECI]: 'ECi',
};

type Props = {
  info: CellContext<ActionListItem, ActionListItem['labels']>;
};

export const ReferentielTableLabelsCell = ({ info }: Props) => {
  const labels = info.getValue();
  const cellId = info.cell.id;

  return (
    <TableCell tabIndex={-1} data-cell-id={cellId}>
      {labels && labels.length > 0 && (
        <span className="text-grey-8">
          {labels.map((label) => labelDisplayNames[label]).join(', ')}
        </span>
      )}
    </TableCell>
  );
};
