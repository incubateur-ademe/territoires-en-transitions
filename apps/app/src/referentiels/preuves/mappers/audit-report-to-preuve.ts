import { TPreuveAudit } from '@/app/referentiels/preuves/Bibliotheque/types';

// Forme structurelle minimale attendue côté input ; documente la frontière
// entre le contexte audit-cloture et celui des preuves sans dépendre du
// type trpc-output de l'autre côté.
export type AuditReportInput = {
  id: number;
  collectivite_id: number;
  commentaire: string | null;
  created_at: string | null;
  created_by: string | null;
  created_by_nom: string | null;
  fichier: TPreuveAudit['fichier'];
  lien: TPreuveAudit['lien'];
  audit: TPreuveAudit['audit'];
  demande: TPreuveAudit['demande'];
};

export const auditReportToPreuve = (report: AuditReportInput): TPreuveAudit => {
  const base = {
    id: report.id,
    collectivite_id: report.collectivite_id,
    commentaire: report.commentaire,
    created_at: report.created_at,
    created_by: report.created_by,
    created_by_nom: report.created_by_nom,
    preuve_type: 'audit' as const,
    action: null,
    preuve_reglementaire: null,
    rapport: null,
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
