import { toPreuveSupport } from '@/app/referentiels/preuves/Bibliotheque/to-preuve-support.utils';
import {
  Fichier,
  PreuveAudit,
  PreuveLien,
} from '@/app/referentiels/preuves/Bibliotheque/types';

export type AuditReportInput = Pick<
  PreuveAudit,
  | 'id'
  | 'collectiviteId'
  | 'commentaire'
  | 'modifiedAt'
  | 'modifiedBy'
  | 'modifiedByNom'
  | 'audit'
  | 'demande'
> & {
  fichier: Fichier | null;
  lien: PreuveLien | null;
};

export const auditReportToPreuve = (report: AuditReportInput): PreuveAudit => ({
  id: report.id,
  collectiviteId: report.collectiviteId,
  commentaire: report.commentaire,
  modifiedAt: report.modifiedAt,
  modifiedBy: report.modifiedBy,
  modifiedByNom: report.modifiedByNom,
  preuveType: 'audit',
  audit: report.audit,
  demande: report.demande,
  support: toPreuveSupport({ fichier: report.fichier, lien: report.lien }),
});
