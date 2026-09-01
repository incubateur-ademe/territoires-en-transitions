import { LabellisationAudit } from '@tet/domain/referentiels';

export type TAuditEnCours = Pick<
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
