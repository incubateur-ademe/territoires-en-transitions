import {Referentiel} from 'types/litterals';

export type TAuditStatut = 'non_audite' | 'en_cours' | 'audite';

// statut de l'audit en cours
export type TAudit = {
  id: number;
  collectivite_id: number;
  referentiel: Referentiel;
  demande_id: number | null;
  auditeur: string;
  date_debut: string;
  date_fin: string | null;
};

// statut d'audit d'une action
export type TActionAuditStatut = {
  collectivite_id: number;
  referentiel: Referentiel;
  audit_id: number;
  action_id: string;
  state_id: number;
  statut: TAuditStatut;
  avis: string;
  ordre_du_jour: boolean;
};
