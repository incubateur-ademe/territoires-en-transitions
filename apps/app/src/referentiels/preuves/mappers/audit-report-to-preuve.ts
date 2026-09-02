import { PreuveAudit } from '@/app/referentiels/preuves/Bibliotheque/types';

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
  fichier: PreuveAudit['fichier'];
  lien: PreuveAudit['lien'];
};

export const auditReportToPreuve = (report: AuditReportInput): PreuveAudit => {
  const base = {
    id: report.id,
    collectiviteId: report.collectiviteId,
    commentaire: report.commentaire,
    modifiedAt: report.modifiedAt,
    modifiedBy: report.modifiedBy,
    modifiedByNom: report.modifiedByNom,
    preuveType: 'audit' as const,
    audit: report.audit,
    demande: report.demande,
  };

  if (report.fichier) {
    return { ...base, fichier: report.fichier, lien: null };
  }
  if (report.lien) {
    return { ...base, fichier: null, lien: report.lien };
  }
  return { ...base, fichier: null, lien: null };
};
