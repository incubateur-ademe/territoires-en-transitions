import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type {
  DemarcheDocumentAdditional,
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
  DemarcheDocumentsConfig,
} from '@tet/domain/demarches';
import { DemarcheDocumentsTable } from './documents.table';

const config: DemarcheDocumentsConfig = {
  additionalAmont: true,
  additionalAval: true,
  formatsAutorises: ['pdf'],
  mimeTypesAutorises: ['application/pdf'],
};

/** Le catalogue tel que la base le sert : le document global d'abord. */
const definitions: DemarcheDocumentDefinition[] = [
  {
    id: 'pcaet_document_global',
    nom: 'Document global',
    description:
      'Document unique regroupant l’ensemble des pièces attendues. Son dépôt couvre toutes les sections du dossier.',
    requis: false,
    ordre: 0,
    portee: 'global',
    etape: 'amont',
    couverturePlateforme: null,
    substituts: [],
  },
  {
    id: 'pcaet_diagnostic',
    nom: 'Diagnostic',
    description: '',
    requis: true,
    ordre: 1,
    portee: 'section',
    etape: 'amont',
    couverturePlateforme: null,
    substituts: ['pcaet_document_global'],
  },
  {
    id: 'pcaet_plan_actions',
    nom: 'Plan d’actions',
    description: '',
    requis: true,
    ordre: 2,
    portee: 'section',
    etape: 'amont',
    couverturePlateforme: 'plan_actions',
    substituts: ['pcaet_document_global'],
  },
];

const documents: DemarcheDocumentDepose[] = [
  {
    id: 1,
    documentId: 'pcaet_diagnostic',
    commentaire: '',
    modifiedAt: '2026-08-20T00:00:00Z',
    modifiedBy: null,
    fichier: {
      id: 7,
      filename: 'diagnostic-territorial-2026.pdf',
      hash: 'hash',
      bucketId: 'bucket',
      filesize: 1024,
    },
  },
];

const documentsAdditional: DemarcheDocumentAdditional[] = [
  {
    id: 42,
    etape: 'amont',
    titre: 'Étude acoustique du territoire',
    commentaire: '',
    modifiedAt: '2026-08-20T00:00:00Z',
    modifiedBy: null,
    fichier: null,
  },
  {
    id: 43,
    etape: 'amont',
    titre: '',
    commentaire: '',
    modifiedAt: '2026-08-20T00:00:00Z',
    modifiedBy: null,
    fichier: null,
  },
];

const meta: Meta<typeof DemarcheDocumentsTable> = {
  component: DemarcheDocumentsTable,
  decorators: [(story) => <div className="p-8">{story()}</div>],
  args: {
    demarcheType: 'pcaet',
    etape: 'amont',
    config,
    definitions,
    documents,
    documentsAdditional,
    coverage: [],
    onAddFichier: () => undefined,
    onRemoveDocument: () => undefined,
    onToggleCouverture: () => undefined,
    onCreateAdditional: () => undefined,
    onRenameAdditional: () => undefined,
    onAddFichierAdditional: () => undefined,
    onRemoveAdditional: () => undefined,
  },
};

export default meta;

type Story = StoryObj<typeof DemarcheDocumentsTable>;

/**
 * Une seule liste, dans l'ordre du modèle : le document global ouvre le tableau,
 * les pièces additionnelles le ferment.
 */
export const Default: Story = {};

/** La pièce qui vient d'être ouverte a son champ de nom déjà en saisie. */
export const AdditionalEnSaisie: Story = {
  args: { documentAdditionalCreeId: 43 },
};

/** Dossier gelé : plus rien à déposer, ni à nommer. */
export const EtapeGelee: Story = {
  args: { isEtapeReadonly: true, isDocumentReadonly: () => true },
};
