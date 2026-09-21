import { toDocumentCollectivite } from '@/app/referentiels/preuves/Bibliotheque/to-document-collectivite.utils';
import { DocumentAudit } from '@/app/referentiels/preuves/Bibliotheque/types';
import { Lien, StoredFile } from '@tet/domain/collectivites';

export type AuditReportInput = Pick<
  DocumentAudit,
  | 'id'
  | 'collectiviteId'
  | 'commentaire'
  | 'modifiedAt'
  | 'modifiedBy'
  | 'modifiedByNom'
  | 'audit'
  | 'demande'
> & {
  fichier: (Omit<StoredFile, 'filesize'> & { filesize?: number }) | null;
  lien: Lien | null;
};

export const toDocumentAudit = (report: AuditReportInput): DocumentAudit => ({
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
