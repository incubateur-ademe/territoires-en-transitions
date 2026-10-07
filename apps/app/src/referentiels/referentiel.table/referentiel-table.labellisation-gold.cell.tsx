import { appLabels } from '@/app/labels/catalog';
import { CellContext } from '@tanstack/react-table';
import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import {
  LabellisationGold,
  LabellisationGoldEnum,
} from './referentiel-table.filters.utils';
import { ReferentielTableFeatures } from './utils';

export const labellisationGoldToLabel: Record<LabellisationGold, string> = {
  [LabellisationGoldEnum.AVEC]: appLabels.referentielTableLabellisationGoldAvec,
  [LabellisationGoldEnum.SANS]: appLabels.referentielTableLabellisationGoldSans,
};

type Props = {
  info: CellContext<
    ReferentielTableFeatures,
    ActionListItem,
    LabellisationGold | null
  >;
};

export const ReferentielTableLabellisationGoldCell = ({ info }: Props) => {
  const value = info.getValue();
  const cellId = info.cell.id;

  return (
    <TableCell tabIndex={-1} data-cell-id={cellId}>
      {value && (
        <span className="text-grey-8">{labellisationGoldToLabel[value]}</span>
      )}
    </TableCell>
  );
};
