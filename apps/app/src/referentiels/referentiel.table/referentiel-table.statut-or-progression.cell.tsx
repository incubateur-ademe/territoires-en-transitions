import { CellContext } from '@tanstack/react-table';
import { StatutAvancement } from '@tet/domain/referentiels';
import { ActionListItem } from '../actions/use-list-actions';
import { ReferentielTableProgressionCell } from './referentiel-table.progression.cell';
import {
  actionTypesWithStatut,
  ReferentielTableStatutCell,
} from './referentiel-table.statut.cell';

type Props = {
  info: CellContext<ActionListItem, StatutAvancement | null | undefined>;
};

export const ReferentielTableStatutOrProgressionCell = ({ info }: Props) => {
  const data = info.row.original;

  if (actionTypesWithStatut.has(data.actionType)) {
    return ReferentielTableStatutCell({ info });
  }

  return ReferentielTableProgressionCell({
    row: data,
    cell: info.cell,
  });
};
