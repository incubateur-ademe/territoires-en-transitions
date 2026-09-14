import { toDocumentCollectivite } from '@/app/referentiels/preuves/Bibliotheque/to-document-collectivite.utils';
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
  fichier: (Omit<Fichier, 'filesize'> & { filesize?: number | null }) | null;
  lien: PreuveLien | null;
};

export const auditReportToPreuve = (report: AuditReportInput): PreuveAudit => ({
  ...toDocumentCollectivite({
    id: report.id,
    collectiviteId: report.collectiviteId,
    commentaire: report.commentaire,
    modifiedAt: report.modifiedAt,
    modifiedBy: report.modifiedBy,
    modifiedByNom: report.modifiedByNom,
    fichier: report.fichier && {
      ...report.fichier,
      filesize: report.fichier.filesize ?? null,
    },
    lien: report.lien,
  }),
  preuveType: 'audit',
  audit: report.audit,
  demande: report.demande,
});
