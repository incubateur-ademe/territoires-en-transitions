import { CellContext } from '@tanstack/react-table';
import {
  ActionTypeEnum,
  StatutAvancementIncludingNonConcerne,
} from '@tet/domain/referentiels';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ReferentielTableProgressionCell } from './referentiel-table.progression.cell';
import { ReferentielTableStatutCell } from './referentiel-table.statut.cell';
import { ReferentielTableRow } from './types';

type Props = {
  info: CellContext<
    ReferentielTableRow,
    StatutAvancementIncludingNonConcerne | undefined
  >;
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
};

export const ReferentielTableStatutOrProgressionCell = ({
  info,
  updateActionStatut,
}: Props) => {
  const data = info.row.original;

  if (
    data.type === ActionTypeEnum.AXE ||
    data.type === ActionTypeEnum.SOUS_AXE ||
    data.type === ActionTypeEnum.ACTION
  ) {
    return ReferentielTableProgressionCell({ row: data });
  }

  return ReferentielTableStatutCell({ info, updateActionStatut });
};
