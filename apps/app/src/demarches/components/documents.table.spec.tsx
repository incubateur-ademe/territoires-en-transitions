import '@testing-library/jest-dom/vitest';

import { appLabels } from '@/app/labels/catalog';
import type {
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
  DemarcheDocumentsConfig,
} from '@tet/domain/demarches';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DemarcheDocumentsTable } from './documents.table';

const CONFIG: DemarcheDocumentsConfig = {
  additionalAmont: true,
  additionalAval: true,
  formatsAutorises: ['pdf'],
  mimeTypesAutorises: ['application/pdf'],
};

const definition = (
  overrides: Partial<DemarcheDocumentDefinition>
): DemarcheDocumentDefinition => ({
  id: 'pcaet_diagnostic',
  nom: 'Diagnostic',
  description: '',
  requis: true,
  ordre: 1,
  portee: 'section',
  etape: 'amont',
  couverturePlateforme: null,
  substituts: [],
  ...overrides,
});

const GLOBAL = definition({
  id: 'pcaet_document_global',
  nom: 'Document global',
  description: 'Document unique regroupant l’ensemble des pièces attendues.',
  requis: false,
  ordre: 0,
  portee: 'global',
});
const DIAGNOSTIC = definition({});

const depose = (documentId: string): DemarcheDocumentDepose => ({
  id: 1,
  documentId,
  commentaire: '',
  modifiedAt: '2026-08-20T00:00:00Z',
  modifiedBy: null,
  fichier: {
    id: 7,
    filename: 'diagnostic.pdf',
    hash: 'hash',
    bucketId: 'bucket',
    filesize: 1024,
  },
});

const renderTable = ({
  definitions = [GLOBAL, DIAGNOSTIC],
  documents = [],
}: {
  definitions?: DemarcheDocumentDefinition[];
  documents?: DemarcheDocumentDepose[];
} = {}) =>
  render(
    <DemarcheDocumentsTable
      demarcheType="pcaet"
      etape="amont"
      config={CONFIG}
      definitions={definitions}
      documents={documents}
      documentsAdditional={[]}
      coverage={[]}
      onAddFichier={vi.fn()}
      onRemoveDocument={vi.fn()}
      onToggleCouverture={vi.fn()}
      onCreateAdditional={vi.fn()}
      onRenameAdditional={vi.fn()}
      onAddFichierAdditional={vi.fn()}
      onRemoveAdditional={vi.fn()}
    />
  );

describe('DemarcheDocumentsTable — une seule liste', () => {
  it('range le document global dans le tableau, à la place que le modèle lui donne', () => {
    renderTable();

    // Les lignes du corps, dans l'ordre du modèle : le global d'abord.
    const [premiere] = screen.getAllByRole('row').slice(1);
    expect(within(premiere).getByText('Document global')).toBeInTheDocument();
    expect(
      within(premiere).getByText(/Document unique regroupant/)
    ).toBeInTheDocument();
  });

  it('n’a plus de sous-titre de section : le tableau se suffit', () => {
    renderTable();

    expect(screen.queryByText('Détail par section attendue')).toBeNull();
  });
});

describe('DemarcheDocumentsTable — actions de dépôt', () => {
  it('propose le seul dépôt quand aucun document n’est défini', () => {
    renderTable();

    expect(
      screen.getAllByRole('button', {
        name: appLabels.demarcheDocumentsTeleverser,
      })
    ).toHaveLength(2);
    expect(
      screen.queryByRole('button', {
        name: appLabels.demarcheDocumentsRemplacerDocument,
      })
    ).toBeNull();
  });

  it('scinde le remplacement et le retrait quand un document est défini', () => {
    renderTable({ documents: [depose(DIAGNOSTIC.id)] });

    expect(screen.getByText('diagnostic.pdf')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: appLabels.demarcheDocumentsRemplacerDocument,
      })
    ).toBeInTheDocument();
    // Le retrait n'apparaît qu'à l'ouverture du menu.
    expect(
      screen.queryByRole('button', {
        name: appLabels.demarcheDocumentsSupprimerDocument,
      })
    ).toBeNull();
  });
});
