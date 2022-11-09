import {CellProps} from 'react-table';
import {TAuditSuiviRow} from './queries';
import {BadgeAuditStatut} from '../Audit/BadgeAuditStatut';

type TCellProps = CellProps<TAuditSuiviRow>;

/**
 * Affiche une cellule contenant le statut d'audit d'une action
 */
export const CellAuditStatut = (props: TCellProps) => {
  const {value} = props;

  return <BadgeAuditStatut statut={value} />;
};

/**
 * Affiche une cellule contenant une marque représentant un booléen
 */
export const CellCheckmark = (props: TCellProps) => {
  const {value} = props;

  return value ? <span className="block fr-fi-check-line scale-75" /> : null;
};
