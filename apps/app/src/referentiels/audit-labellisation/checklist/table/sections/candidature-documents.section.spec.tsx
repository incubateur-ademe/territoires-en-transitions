import { render, screen } from '@testing-library/react';
import { appLabels } from '../../../../../labels/catalog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreuvesLabellisation } from '../../../../labellisations/useCycleLabellisation';
import { AuditViewerRole } from '../../../audit-badge-status/types';
import { Parcours } from '../../../checklist-view-model';
import { useChecklist } from '../../../checklist.context';
import { CandidatureDocumentsRow } from './candidature-documents.section';

vi.mock('../../../checklist.context', () => ({
  useChecklist: vi.fn(),
}));

vi.mock('../../../../labellisations/useCycleLabellisation', () => ({
  usePreuvesLabellisation: vi.fn(),
}));

vi.mock('./upload-preuve-button', () => ({
  UploadPreuveButton: ({ label }: { label: string }) => (
    <button>{label}</button>
  ),
}));

vi.mock('./rename-preuve-button', () => ({
  RenamePreuveButton: () => <button>{'Renommer le fichier'}</button>,
}));

vi.mock('./delete-preuve-button', () => ({
  DeletePreuveButton: () => <button>{'Supprimer'}</button>,
}));

const mockedUseChecklist = vi.mocked(useChecklist);
const mockedUsePreuvesLabellisation = vi.mocked(usePreuvesLabellisation);

const setChecklist = (
  parcours: Parcours | null,
  viewerRole: AuditViewerRole = 'auditee'
): void => {
  mockedUseChecklist.mockReturnValue({
    parcours,
    referentielId: 'cae',
    cycle: { viewerRole },
  } as unknown as ReturnType<typeof useChecklist>);
};

const toParcours = ({
  demandeId,
  canModifyCandidatureDocuments,
}: {
  demandeId: number | null;
  canModifyCandidatureDocuments: boolean;
}): Parcours =>
  ({
    acteEngagement: { signed: true, demandeId },
    canModifyCandidatureDocuments,
  } as unknown as Parcours);

const setPreuves = (
  preuves: Array<{ id: number; fichier: { filename: string } }>
): void => {
  mockedUsePreuvesLabellisation.mockReturnValue({
    data: preuves,
  } as unknown as ReturnType<typeof usePreuvesLabellisation>);
};

const renderRow = () =>
  render(
    <table>
      <CandidatureDocumentsRow />
    </table>
  );

beforeEach(() => {
  mockedUseChecklist.mockReset();
  mockedUsePreuvesLabellisation.mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof usePreuvesLabellisation>);
});

describe('CandidatureDocumentsRow — bouton d\'ajout', () => {
  it('ne rend rien quand le parcours est absent', () => {
    setChecklist(null);

    renderRow();

    expect(
      screen.queryByText(
        appLabels.labellisationAjouterDocumentsOfficielsCandidature
      )
    ).toBeNull();
  });

  it("affiche le critère sans bouton d'ajout quand aucune demande n'existe", () => {
    setChecklist(
      toParcours({ demandeId: null, canModifyCandidatureDocuments: true })
    );

    renderRow();

    expect(
      screen.getByText(
        appLabels.labellisationAjouterDocumentsOfficielsCandidature
      )
    ).toBeDefined();
    expect(
      screen.queryByRole('button', { name: appLabels.ajouterDocument })
    ).toBeNull();
  });

  it("affiche le bouton d'ajout pour un éditeur quand les documents sont modifiables", () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true })
    );

    renderRow();

    expect(
      screen.getByRole('button', { name: appLabels.ajouterDocument })
    ).toBeDefined();
  });

  it("masque le bouton d'ajout une fois l'audit validé", () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: false })
    );

    renderRow();

    expect(
      screen.queryByRole('button', { name: appLabels.ajouterDocument })
    ).toBeNull();
  });

  it("masque le bouton d'ajout pour un auditeur", () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true }),
      'auditor'
    );

    renderRow();

    expect(
      screen.queryByRole('button', { name: appLabels.ajouterDocument })
    ).toBeNull();
  });

  it("masque le bouton d'ajout pour un visiteur", () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true }),
      'other'
    );

    renderRow();

    expect(
      screen.queryByRole('button', { name: appLabels.ajouterDocument })
    ).toBeNull();
  });
});

describe('CandidatureDocumentsRow — actions par document', () => {
  it('affiche « Renommer » et « Supprimer » par document pour un éditeur quand les documents sont modifiables', () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true })
    );
    setPreuves([
      { id: 1, fichier: { filename: 'doc-a.pdf' } },
      { id: 2, fichier: { filename: 'doc-b.pdf' } },
    ]);

    renderRow();

    expect(
      screen.getAllByRole('button', { name: appLabels.renommerLeFichier })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: appLabels.supprimer })
    ).toHaveLength(2);
  });

  it("n'expose aucun bouton « Remplacer » par document de candidature", () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true })
    );
    setPreuves([{ id: 1, fichier: { filename: 'doc-a.pdf' } }]);

    renderRow();

    expect(
      screen.queryByRole('button', { name: appLabels.remplacerLeFichier })
    ).toBeNull();
  });

  it("masque « Renommer » et « Supprimer » une fois l'audit validé", () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: false })
    );
    setPreuves([{ id: 1, fichier: { filename: 'doc-a.pdf' } }]);

    renderRow();

    expect(
      screen.queryByRole('button', { name: appLabels.renommerLeFichier })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: appLabels.supprimer })
    ).toBeNull();
  });

  it('masque « Renommer » et « Supprimer » pour un auditeur', () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true }),
      'auditor'
    );
    setPreuves([{ id: 1, fichier: { filename: 'doc-a.pdf' } }]);

    renderRow();

    expect(
      screen.queryByRole('button', { name: appLabels.renommerLeFichier })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: appLabels.supprimer })
    ).toBeNull();
  });

  it('masque « Renommer » et « Supprimer » pour un visiteur', () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true }),
      'other'
    );
    setPreuves([{ id: 1, fichier: { filename: 'doc-a.pdf' } }]);

    renderRow();

    expect(
      screen.queryByRole('button', { name: appLabels.renommerLeFichier })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: appLabels.supprimer })
    ).toBeNull();
  });
});
