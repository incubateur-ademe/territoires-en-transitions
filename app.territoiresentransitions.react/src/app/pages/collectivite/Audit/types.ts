import {Referentiel} from 'types/litterals';

export type TAuditStatut = 'non_audite' | 'en_cours' | 'audite';

// statut d'audit d'une action
export type TActionAuditStatut = {
  collectivite_id: number;
  referentiel: Referentiel;
  audit_id: number;
  action_id: string;
  state_id: number;
  statut: TAuditStatut;
  avis: string | null;
  ordre_du_jour: boolean;
};
