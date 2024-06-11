import {Badge, BadgeState} from '@tet/ui';
import {TAuditStatut} from './types';

export const statutToOption: Record<
  TAuditStatut,
  {label: string; badge: BadgeState}
> = {
  non_audite: {label: 'Non audité', badge: 'warning'},
  en_cours: {label: 'Audit en cours', badge: 'info'},
  audite: {label: 'Audité', badge: 'success'},
};

/**
 * Affiche un badge représentant un statut d'audit
 */
export const BadgeAuditStatut = ({statut}: {statut: TAuditStatut}) => {
  const {label, badge} = statutToOption[statut];
  return <Badge title={label} state={badge} size="sm" />;
};
