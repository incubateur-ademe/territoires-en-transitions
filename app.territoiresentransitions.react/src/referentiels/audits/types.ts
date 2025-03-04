import { Views } from '@/api';
import { ReferentielId } from '@/domain/referentiels';

export type TAuditStatut = 'non_audite' | 'en_cours' | 'audite';

// statut de l'audit en cours
export type TAudit = Views<'audit'> & {
  // auditeurs: Record<'id', string>[];
  // audit_id: number;
  valide: boolean;
};

// statut d'audit d'une action
export type TActionAuditStatut = {
  collectivite_id: number;
  referentiel: ReferentielId;
  audit_id: number;
  action_id: string;
  state_id: number;
  statut: TAuditStatut;
  avis: string;
  ordre_du_jour: boolean;
};
