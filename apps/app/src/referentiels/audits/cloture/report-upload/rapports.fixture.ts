import { toDocumentHash } from '@tet/domain/collectivites';
import { AuditReport } from '../data/use-list-reports-by-audit';

const audit = {
  id: 3,
  collectiviteId: 1,
  referentielId: 'cae',
  demandeId: null,
  dateDebut: '2026-01-06T09:00:00.000Z',
  dateFin: null,
  valide: false,
  dateCnl: null,
  valideLabellisation: null,
  clos: false,
} as const;

const rapportBase = {
  id: 1,
  collectiviteId: 1,
  commentaire: null,
  modifiedAt: '2026-09-06T16:43:41.423515+00:00',
  modifiedBy: null,
  modifiedByNom: 'Yolo Dodo',
  preuveType: 'audit',
  auditId: audit.id,
  demande: null,
  audit,
} as const;

export const rapportFichier: AuditReport = {
  ...rapportBase,
  type: 'fichier',
  fichier: {
    id: 21,
    collectiviteId: 1,
    hash: toDocumentHash(
      'c9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9'
    ),
    filename: 'rapport-audit.pdf',
    filesize: 2048,
    bucketId: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: false,
  },
};

export const rapportLien: AuditReport = {
  ...rapportBase,
  type: 'lien',
  lien: { url: 'https://exemple.test/rapport', titre: 'Rapport en ligne' },
};

export const rapportFichierManquant: AuditReport = {
  ...rapportBase,
  type: 'fichierManquant',
  filename: 'rapport-perdu.pdf',
};

export const rapportFichierManquantAuNomLong: AuditReport = {
  ...rapportFichierManquant,
  filename:
    'rapport-audit-climat-air-energie-territorial-communaute-agglomeration-2026-version-definitive-relue.pdf',
};
