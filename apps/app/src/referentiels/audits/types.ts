import { Views } from '@/api';

export type TAuditStatut = 'non_audite' | 'en_cours' | 'audite';

// statut de l'audit en cours
export type TAudit = Views<'audit'> & {
  // auditeurs: Record<'id', string>[];
  // audit_id: number;
  valide: boolean;
};
