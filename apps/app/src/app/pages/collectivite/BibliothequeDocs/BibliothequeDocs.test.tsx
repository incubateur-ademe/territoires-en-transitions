import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BibliothequeDocs } from './BibliothequeDocs';
import type {
  TPreuveAuditEtLabellisation,
  TPreuveRapport,
} from '@/app/referentiels/preuves/Bibliotheque/types';

// Mock child components
vi.mock('./PreuveLabellisation', () => ({
  PreuvesLabellisation: ({ preuves }: { preuves: unknown[] }) => (
    <div data-testid="preuves-labellisation">
      {preuves.length} labellisation preuves
    </div>
  ),
}));

vi.mock('./PreuvesTabs', () => ({
  PreuvesTabs: () => <div data-testid="preuves-tabs">Preuves Tabs</div>,
}));

vi.mock('./AddRapportVisite', () => ({
  AddRapportVisite: () => (
    <div data-testid="add-rapport-visite">Add Rapport</div>
  ),
}));

vi.mock('@/app/referentiels/preuves/Bibliotheque/PreuveDoc', () => ({
  default: ({ preuve }: { preuve: TPreuveRapport }) => (
    <div data-testid={`preuve-doc-${preuve.id}`}>
      Preuve {preuve.id}
    </div>
  ),
}));

describe('BibliothequeDocs', () => {
  const mockLabellisationPreuve: TPreuveAuditEtLabellisation = {
    preuve_type: 'labellisation',
    id: 1,
    collectivite_id: 1,
    fichier: {
      hash: 'hash123',
      filename: 'test.pdf',
      filesize: 1000,
      bucket_id: 'bucket-id',
    },
    lien: null,
    commentaire: '',
    created_at: '2023-01-01T00:00:00Z',
    created_by: 'user-id',
    created_by_nom: 'Test User',
    action: null,
    preuve_reglementaire: null,
    demande: {
      id: 1,
      date: '2023-01-01T00:00:00Z',
      sujet: 'cot',
      etoiles: null,
      en_cours: true,
      referentiel: 'cae',
      collectivite_id: 1,
    },
    rapport: null,
    audit: null,
  };

  const mockRapportPreuve: TPreuveRapport = {
    preuve_type: 'rapport',
    id: 2,
    collectivite_id: 1,
    fichier: {
      hash: 'hash456',
      filename: 'rapport.pdf',
      filesize: 2000,
      bucket_id: 'bucket-id',
    },
    lien: null,
    commentaire: '',
    created_at: '2023-02-01T00:00:00Z',
    created_by: 'user-id',
    created_by_nom: 'Test User',
    action: null,
    preuve_reglementaire: null,
    demande: null,
    rapport: {
      id: 1,
      collectivite_id: 1,
      date: '2023-02-01',
      modified_at: '2023-02-01T00:00:00Z',
    },
    audit: null,
  };

  it('should render main title', () => {
    render(
      <BibliothequeDocs
        labellisationEtAudit={[]}
        rapports={[]}
        isReadOnly={false}
      />
    );

    expect(screen.getByText('Bibliothèque de documents')).toBeInTheDocument();
  });

  it('should render labellisation section when preuves are provided', () => {
    render(
      <BibliothequeDocs
        labellisationEtAudit={[mockLabellisationPreuve]}
        rapports={[]}
        isReadOnly={false}
      />
    );

    const labellisationSection = screen.getByTestId('labellisation');
    expect(labellisationSection).toBeInTheDocument();
    expect(screen.getByTestId('preuves-labellisation')).toBeInTheDocument();
  });

  it('should not render labellisation section when no preuves', () => {
    render(
      <BibliothequeDocs
        labellisationEtAudit={[]}
        rapports={[]}
        isReadOnly={false}
      />
    );

    expect(screen.queryByTestId('labellisation')).not.toBeInTheDocument();
  });

  describe('Rapports section', () => {
    it('should render rapports section title', () => {
      render(
        <BibliothequeDocs
          labellisationEtAudit={[]}
          rapports={[]}
          isReadOnly={false}
        />
      );

      expect(screen.getByText('Rapports de visite annuelle')).toBeInTheDocument();
    });

    it('should show AddRapportVisite when not read-only', () => {
      render(
        <BibliothequeDocs
          labellisationEtAudit={[]}
          rapports={[]}
          isReadOnly={false}
        />
      );

      expect(screen.getByTestId('add-rapport-visite')).toBeInTheDocument();
    });

    it('should not show AddRapportVisite when read-only', () => {
      render(
        <BibliothequeDocs
          labellisationEtAudit={[]}
          rapports={[]}
          isReadOnly={true}
        />
      );

      expect(screen.queryByTestId('add-rapport-visite')).not.toBeInTheDocument();
    });

    it('should show empty message when read-only and no rapports', () => {
      render(
        <BibliothequeDocs
          labellisationEtAudit={[]}
          rapports={[]}
          isReadOnly={true}
        />
      );

      expect(
        screen.getByText("Aucun rapport de visite annuelle n'a été ajouté.")
      ).toBeInTheDocument();
    });

    it('should not show empty message when not read-only', () => {
      render(
        <BibliothequeDocs
          labellisationEtAudit={[]}
          rapports={[]}
          isReadOnly={false}
        />
      );

      expect(
        screen.queryByText("Aucun rapport de visite annuelle n'a été ajouté.")
      ).not.toBeInTheDocument();
    });

    it('should render rapport documents when provided', () => {
      render(
        <BibliothequeDocs
          labellisationEtAudit={[]}
          rapports={[mockRapportPreuve]}
          isReadOnly={false}
        />
      );

      expect(screen.getByTestId('preuve-doc-2')).toBeInTheDocument();
    });

    it('should render multiple rapport documents', () => {
      const rapports = [
        mockRapportPreuve,
        { ...mockRapportPreuve, id: 3 },
        { ...mockRapportPreuve, id: 4 },
      ];

      render(
        <BibliothequeDocs
          labellisationEtAudit={[]}
          rapports={rapports}
          isReadOnly={false}
        />
      );

      expect(screen.getByTestId('preuve-doc-2')).toBeInTheDocument();
      expect(screen.getByTestId('preuve-doc-3')).toBeInTheDocument();
      expect(screen.getByTestId('preuve-doc-4')).toBeInTheDocument();
    });
  });

  describe('Documents section', () => {
    it('should render documents section', () => {
      render(
        <BibliothequeDocs
          labellisationEtAudit={[]}
          rapports={[]}
          isReadOnly={false}
        />
      );

      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByTestId('preuves-tabs')).toBeInTheDocument();
    });
  });

  it('should render all sections together', () => {
    render(
      <BibliothequeDocs
        labellisationEtAudit={[mockLabellisationPreuve]}
        rapports={[mockRapportPreuve]}
        isReadOnly={false}
      />
    );

    expect(screen.getByTestId('labellisation')).toBeInTheDocument();
    expect(screen.getByText('Rapports de visite annuelle')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('should have correct data-test attribute on root element', () => {
    const { container } = render(
      <BibliothequeDocs
        labellisationEtAudit={[]}
        rapports={[]}
        isReadOnly={false}
      />
    );

    expect(container.querySelector('[data-test="BibliothequeDocs"]')).toBeInTheDocument();
  });
});