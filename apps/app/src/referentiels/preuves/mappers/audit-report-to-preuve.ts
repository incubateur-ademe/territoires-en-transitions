import { PreuveAudit } from '@/app/referentiels/preuves/Bibliotheque/types';

// Forme structurelle minimale attendue côté input ; documente la frontière
// entre le contexte audit-cloture et celui des preuves sans dépendre du
// type trpc-output de l'autre côté.
export type AuditReportInput = {
  id: number;
  collectiviteId: number;
  commentaire: string | null;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedByNom: string | null;
  fichier: PreuveAudit['fichier'];
  lien: PreuveAudit['lien'];
  audit: PreuveAudit['audit'];
  demande: PreuveAudit['demande'];
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
