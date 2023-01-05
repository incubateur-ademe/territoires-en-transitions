import {Database} from 'types/database.types';
import {Referentiel} from 'types/litterals';

export type TAuditStatut = 'non_audite' | 'en_cours' | 'audite';

// statut de l'audit en cours
export type TAudit = Database['public']['Tables']['audit']['Row'] & {
  auditeurs: Record<'id', string>[];
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
