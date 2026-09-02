import { PreuveAudit } from '@/app/referentiels/preuves/Bibliotheque/types';
import { ReferentielId } from '@tet/domain/referentiels';

// Forme structurelle minimale attendue côté input ; documente la frontière
// entre le contexte audit-cloture et celui des preuves sans dépendre du
// type trpc-output de l'autre côté.
export type AuditReportInput = {
  id: number;
  collectiviteId: number;
  commentaire: string | null;
  modifiedAt: string | null;
  modifiedBy: string | null;
  createdByNom: string | null;
  fichier: {
    hash: string;
    filename: string;
    filesize?: number;
    confidentiel: boolean | null;
    bucketId: string;
  } | null;
  lien: { url: string; titre: string } | null;
  audit: {
    id: number;
    collectiviteId: number;
    referentielId: ReferentielId;
    demandeId: number | null;
    dateDebut: string | null;
    dateFin: string | null;
    clos: boolean;
    valide: boolean;
  } | null;
  demande: unknown;
};

export const auditReportToPreuve = (report: AuditReportInput): PreuveAudit => {
  const base = {
    id: report.id,
    collectiviteId: report.collectiviteId,
    commentaire: report.commentaire,
    modifiedAt: report.modifiedAt,
    modifiedBy: report.modifiedBy,
    modifiedByNom: report.createdByNom,
    preuveType: 'audit' as const,
    audit: report.audit,
    demande: null,
  };

  if (report.fichier) {
    return { ...base, fichier: report.fichier, lien: null };
  }
  if (report.lien) {
    return { ...base, fichier: null, lien: report.lien };
  }
  return { ...base, fichier: null, lien: null };
};
