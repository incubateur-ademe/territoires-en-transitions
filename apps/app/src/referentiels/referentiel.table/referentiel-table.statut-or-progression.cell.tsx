import { CellContext } from '@tanstack/react-table';
import {
  ActionTypeEnum,
  StatutAvancementCreate,
} from '@tet/domain/referentiels';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ActionListItem } from '../actions/use-list-actions';
import { ReferentielTableProgressionCell } from './referentiel-table.progression.cell';
import { ReferentielTableStatutCell } from './referentiel-table.statut.cell';

type Props = {
  info: CellContext<ActionListItem, StatutAvancementCreate | undefined>;
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
};

export const ReferentielTableStatutOrProgressionCell = ({
  info,
  updateActionStatut,
}: Props) => {
  const data = info.row.original;

  if (
    data.actionType === ActionTypeEnum.AXE ||
    data.actionType === ActionTypeEnum.SOUS_AXE ||
    data.actionType === ActionTypeEnum.ACTION
  ) {
    return ReferentielTableProgressionCell({
      row: data,
      toggleRowExpanded: info.row.getToggleExpandedHandler(),
    });
  }

  return ReferentielTableStatutCell({ info, updateActionStatut });
};
