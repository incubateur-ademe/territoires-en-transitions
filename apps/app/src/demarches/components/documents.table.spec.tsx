import '@testing-library/jest-dom/vitest';

import { appLabels } from '@/app/labels/catalog';
import type {
  DemarcheDocumentCoverage,
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
  DemarcheDocumentEtape,
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
  etape: 'amont',
  substituts: [],
  substitutsDeclarables: [],
  ...overrides,
});

const GLOBAL = definition({
  id: 'pcaet_document_global',
  nom: 'PCAET global',
  description:
    'Document unique regroupant une partie des pièces obligatoires attendues.',
  requis: false,
  ordre: 0,
});
const DIAGNOSTIC = definition({});
/** Pièce que le global ne couvre pas d'office : son inclusion se déclare. */
const ETUDE_IMPACT = definition({
  id: 'pcaet_etude_impact',
  nom: 'Étude d’impact',
  ordre: 2,
  substitutsDeclarables: [GLOBAL.id],
});

const depose = (
  documentId: string,
  etape: DemarcheDocumentEtape = 'amont'
): DemarcheDocumentDepose => ({
  id: 1,
  documentId,
  etape,
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
  coverage = [],
  etape = 'amont',
}: {
  definitions?: DemarcheDocumentDefinition[];
  documents?: DemarcheDocumentDepose[];
  coverage?: DemarcheDocumentCoverage[];
  etape?: DemarcheDocumentEtape;
  onToggleCouverture?: (documentId: string, couvert: boolean) => void;
} = {}) =>
  render(
    <DemarcheDocumentsTable
      demarcheType="pcaet"
      etape={etape}
      config={CONFIG}
      definitions={definitions}
      documents={documents}
      documentsAdditional={[]}
      coverage={coverage}
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
    expect(within(premiere).getByText('PCAET global')).toBeInTheDocument();
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

describe('DemarcheDocumentsTable — le dossier transmis reste consultable à l’aval', () => {
  /** Délibération d'arrêt : requise, du seul amont, jamais reprise après les avis. */
  const DELIBERATION_ARRET = definition({
    id: 'pcaet_deliberation_arret',
    nom: 'Délibération d’arrêt du PCAET',
    ordre: 3,
  });
  const ADOPTION = definition({
    id: 'pcaet_deliberation_adoption',
    nom: 'Délibération d’adoption',
    ordre: 4,
    etape: 'aval',
  });

  const renderAval = () =>
    renderTable({
      etape: 'aval',
      definitions: [DELIBERATION_ARRET, ADOPTION],
      documents: [depose(DELIBERATION_ARRET.id)],
    });

  /** La ligne du tableau qui porte cette pièce, pour y chercher ses actions. */
  const ligneDe = (nom: string) => {
    const ligne = screen
      .getAllByRole('row')
      .find((row) => within(row).queryByText(nom));
    if (!ligne) {
      throw new Error(`Aucune ligne pour la pièce « ${nom} »`);
    }
    return within(ligne);
  };

  it('montre la pièce amont et son fichier, alors qu’elle n’appartient pas à ce temps', () => {
    renderAval();

    expect(
      ligneDe('Délibération d’arrêt du PCAET').getByText('diagnostic.pdf')
    ).toBeInTheDocument();
  });

  it('la garde en lecture seule : son temps de dépôt est passé', () => {
    renderAval();

    expect(
      ligneDe('Délibération d’arrêt du PCAET').queryByRole('button')
    ).toBeNull();
  });

  it('laisse la pièce aval déposable', () => {
    renderAval();

    expect(
      ligneDe('Délibération d’adoption').getByRole('button', {
        name: appLabels.demarcheDocumentsTeleverser,
      })
    ).toBeInTheDocument();
  });
});

describe('DemarcheDocumentsTable — inclusion déclarée dans une autre pièce', () => {
  it('ne propose rien à cocher tant que le document qui accueillerait l’inclusion n’est pas déposé', () => {
    renderTable({ definitions: [GLOBAL, ETUDE_IMPACT] });

    expect(
      screen.queryByRole('checkbox', {
        name: appLabels.demarcheDocumentsInclusDans({ nom: GLOBAL.nom }),
      })
    ).toBeNull();
  });

  it('propose la case dès que le PCAET global est déposé', () => {
    renderTable({
      definitions: [GLOBAL, ETUDE_IMPACT],
      documents: [depose(GLOBAL.id)],
    });

    expect(
      screen.getByRole('checkbox', {
        name: appLabels.demarcheDocumentsInclusDans({ nom: GLOBAL.nom }),
      })
    ).not.toBeChecked();
  });

  it('coche la case et retire le dépôt une fois l’inclusion déclarée', () => {
    renderTable({
      definitions: [GLOBAL, ETUDE_IMPACT],
      documents: [depose(GLOBAL.id)],
      coverage: [
        {
          documentId: ETUDE_IMPACT.id,
          couvert: true,
          origine: 'substitut',
          substitutId: GLOBAL.id,
        },
      ],
    });

    expect(
      screen.getByRole('checkbox', {
        name: appLabels.demarcheDocumentsInclusDans({ nom: GLOBAL.nom }),
      })
    ).toBeChecked();
    // Le dépôt d'une pièce propre disparaît : l'inclusion tient la place.
    expect(
      screen.queryByRole('button', {
        name: appLabels.demarcheDocumentsTeleverser,
      })
    ).toBeNull();
  });
});
