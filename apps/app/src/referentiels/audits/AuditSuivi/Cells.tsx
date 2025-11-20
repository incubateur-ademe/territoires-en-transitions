import { Icon } from '@tet/ui';
import { CellProps } from 'react-table';
import { BadgeAuditStatut } from '../BadgeAuditStatut';
import { MesureAuditStatut } from './useTableData';

type TCellProps = CellProps<MesureAuditStatut>;

/**
 * Affiche une cellule contenant le statut d'audit d'une action
 */
export const CellAuditStatut = (props: TCellProps) => {
  const { value, row } = props;

  return row.original.mesureType === 'action' ? (
    <BadgeAuditStatut statut={value || 'non_audite'} />
  ) : null;
};

/**
 * Affiche une cellule contenant une marque représentant un booléen
 */
export const CellCheckmark = (props: TCellProps) => {
  const { value } = props;

  return value ? <Icon icon="check-line" /> : null;
};
