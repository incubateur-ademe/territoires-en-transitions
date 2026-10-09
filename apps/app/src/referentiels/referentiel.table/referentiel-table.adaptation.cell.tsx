import { appLabels } from '@/app/labels/catalog';
import { CellContext } from '@tanstack/react-table';
import {
  ActionAdaptationNiveau,
  ActionAdaptationNiveauEnum,
} from '@tet/domain/referentiels';
import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { ReferentielTableFeatures } from './utils';

// Le niveau "exposition faible" n'est volontairement pas affiché.
const adaptationNiveauToLabel: Partial<Record<ActionAdaptationNiveau, string>> =
  {
    [ActionAdaptationNiveauEnum.EXPOSITION_FORTE]:
      appLabels.referentielTableAdaptationExpositionForte,
    [ActionAdaptationNiveauEnum.EXPOSITION_PARTIELLE]:
      appLabels.referentielTableAdaptationExpositionPartielle,
  };

type Props = {
  info: CellContext<
    ReferentielTableFeatures,
    ActionListItem,
    ActionListItem['adaptationNiveau']
  >;
};

export const ReferentielTableAdaptationCell = ({ info }: Props) => {
  const value = info.getValue();
  const label = value ? adaptationNiveauToLabel[value] : undefined;
  const cellId = info.cell.id;

  return (
    <TableCell tabIndex={-1} data-cell-id={cellId}>
      {label && <span className="text-grey-8">{label}</span>}
    </TableCell>
  );
};
