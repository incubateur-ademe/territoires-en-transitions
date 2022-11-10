import {CellProps} from 'react-table';
import {TAuditSuiviRow} from './queries';
import {BadgeAuditStatut} from '../Audit/BadgeAuditStatut';

type TCellProps = CellProps<TAuditSuiviRow>;

/**
 * Affiche une cellule contenant le statut d'audit d'une action
 */
export const CellAuditStatut = (props: TCellProps) => {
  const {value, row} = props;

  return row.original.type === 'action' ? (
    <BadgeAuditStatut statut={value || 'non_audite'} />
  ) : null;
};

/**
 * Affiche une cellule contenant une marque représentant un booléen
 */
export const CellCheckmark = (props: TCellProps) => {
  const {value} = props;

  return value ? (
    <span className="block fr-fi-check-line scale-75 text-center" />
  ) : null;
};
