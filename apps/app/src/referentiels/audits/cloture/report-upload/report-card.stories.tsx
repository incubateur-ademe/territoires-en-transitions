import { toDocumentHash } from '@tet/domain/collectivites';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { AuditReport } from '../data/use-list-reports-by-audit';
import { PersistedReportCard } from './report-card';

const base = {
  id: 1,
  collectiviteId: 1,
  commentaire: null,
  modifiedAt: '2026-09-06T16:43:41.423515+00:00',
  modifiedBy: null,
  modifiedByNom: 'Yolo Dodo',
  preuveType: 'audit',
  auditId: 3,
  demande: null,
  audit: { id: 3 },
};

const rapportFichier = {
  ...base,
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
} as unknown as AuditReport;

const rapportLien = {
  ...base,
  type: 'lien',
  lien: { url: 'https://exemple.test/rapport', titre: 'Rapport en ligne' },
} as unknown as AuditReport;

const rapportIntrouvable = {
  ...base,
  type: 'fichierManquant',
  filename: 'rapport-perdu.pdf',
} as unknown as AuditReport;

export default {
  title: 'Referentiels/Audits/PersistedReportCard',
  component: PersistedReportCard,
  args: { isRemoving: false, onRemove: fn() },
  decorators: [
    (Story) => (
      <div className="w-[36rem] p-4">
        <Story />
      </div>
    ),
  ],
} as Meta<typeof PersistedReportCard>;

type Story = StoryObj<typeof PersistedReportCard>;

export const RapportFichier: Story = {
  args: { report: rapportFichier },
};

export const RapportLien: Story = {
  args: { report: rapportLien },
};

/** Le fichier est référencé mais sa ligne de bibliothèque n'est plus résoluble. */
export const RapportIntrouvable: Story = {
  args: { report: rapportIntrouvable },
};

export const SuppressionEnCours: Story = {
  args: { report: rapportFichier, isRemoving: true },
};
