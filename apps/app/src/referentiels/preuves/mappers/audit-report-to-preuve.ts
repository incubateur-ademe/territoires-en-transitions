import { PreuveAudit } from '@/app/referentiels/preuves/Bibliotheque/types';
import { ReferentielId } from '@tet/domain/referentiels';

// Forme structurelle minimale attendue côté input ; documente la frontière
// entre le contexte audit-cloture et celui des preuves sans dépendre du
// type trpc-output de l'autre côté.
export type AuditReportInput = {
  id: number;
  collectivite_id: number;
  commentaire: string | null;
  modified_at: string | null;
  modified_by: string | null;
  created_by_nom: string | null;
  fichier: {
    hash: string;
    filename: string;
    filesize?: number;
    confidentiel: boolean | null;
    bucket_id: string;
  } | null;
  lien: { url: string; titre: string } | null;
  audit: {
    id: number;
    collectivite_id: number;
    referentiel_id: ReferentielId;
    demande_id: number | null;
    date_debut: string | null;
    date_fin: string | null;
    clos: boolean;
    valide: boolean;
  } | null;
  demande: unknown;
};

export const auditReportToPreuve = (report: AuditReportInput): PreuveAudit => {
  const base = {
    id: report.id,
    collectiviteId: report.collectivite_id,
    commentaire: report.commentaire,
    modifiedAt: report.modified_at,
    modifiedBy: report.modified_by,
    modifiedByNom: report.created_by_nom,
    preuveType: 'audit' as const,
    audit: report.audit && {
      id: report.audit.id,
      collectiviteId: report.audit.collectivite_id,
      referentielId: report.audit.referentiel_id,
      demandeId: report.audit.demande_id,
      dateDebut: report.audit.date_debut,
      dateFin: report.audit.date_fin,
      clos: report.audit.clos,
      valide: report.audit.valide,
    },
    demande: null,
  };

  if (report.fichier) {
    const { bucket_id: bucketId, ...fichier } = report.fichier;
    return { ...base, fichier: { ...fichier, bucketId }, lien: null };
  }
  if (report.lien) {
    return { ...base, fichier: null, lien: report.lien };
  }
  return { ...base, fichier: null, lien: null };
};
