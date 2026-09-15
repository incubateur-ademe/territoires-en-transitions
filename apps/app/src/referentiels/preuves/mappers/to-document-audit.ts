import { Lien } from '@tet/domain/collectivites';
import { toDocumentCollectivite } from '@/app/referentiels/preuves/Bibliotheque/to-document-collectivite.utils';
import {
  Fichier,
  DocumentAudit,
} from '@/app/referentiels/preuves/Bibliotheque/types';

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
  fichier: (Omit<Fichier, 'filesize'> & { filesize?: number | null }) | null;
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
