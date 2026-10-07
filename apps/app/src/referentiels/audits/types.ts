import { LabellisationAudit } from '@tet/domain/referentiels';

export type AuditEnCours = Pick<
  LabellisationAudit,
  | 'id'
  | 'collectiviteId'
  | 'demandeId'
  | 'dateDebut'
  | 'dateFin'
  | 'clos'
  | 'valide'
  | 'referentielId'
>;
