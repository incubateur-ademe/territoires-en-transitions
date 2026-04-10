import { CellContext } from '@tanstack/react-table';
import { StatutAvancement } from '@tet/domain/referentiels';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ActionListItem } from '../actions/use-list-actions';
import { ReferentielTableProgressionCell } from './referentiel-table.progression.cell';
import {
  actionTypesWithStatut,
  ReferentielTableStatutCell,
} from './referentiel-table.statut.cell';

type Props = {
  info: CellContext<ActionListItem, StatutAvancement | null | undefined>;
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
};

export const ReferentielTableStatutOrProgressionCell = ({
  info,
  updateActionStatut,
}: Props) => {
  const data = info.row.original;

  if (actionTypesWithStatut.has(data.actionType)) {
    return ReferentielTableStatutCell({ info, updateActionStatut });
  }

  return ReferentielTableProgressionCell({
    row: data,
    cell: info.cell,
  });
};
