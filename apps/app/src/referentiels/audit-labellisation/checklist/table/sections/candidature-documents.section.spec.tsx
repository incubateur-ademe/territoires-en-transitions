import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditViewerRole } from '../../../audit-badge-status/types';
import { Parcours } from '../../../checklist-view-model';
import { useChecklist } from '../../../checklist.context';
import { usePreuvesLabellisation } from '../../../../labellisations/useCycleLabellisation';
import { CandidatureDocumentsRow } from './candidature-documents.section';

vi.mock('../../../checklist.context', () => ({
  useChecklist: vi.fn(),
}));

vi.mock('../../../../labellisations/useCycleLabellisation', () => ({
  usePreuvesLabellisation: vi.fn(),
}));

vi.mock('../../../../labellisations/useAddPreuveToDemande', () => ({
  useAddPreuveToDemande: vi.fn(() => ({})),
}));

vi.mock('../../../../labellisations/useRemovePreuveFromDemande', () => ({
  useRemovePreuveFromDemande: vi.fn(() => ({ removePreuve: vi.fn() })),
}));

vi.mock('../../../../preuves/AddPreuveModal', () => ({
  AddPreuveModal: () => null,
}));

vi.mock('../../../../preuves/Bibliotheque/EditerDocumentModal', () => ({
  EditerDocumentModal: () => null,
}));

vi.mock('@tet/ui', async (importActual) => ({
  ...(await importActual<typeof import('@tet/ui')>()),
  Modal: ({ children }: { children: ReactNode }) => children,
}));

const mockedUseChecklist = vi.mocked(useChecklist);
const mockedUsePreuvesLabellisation = vi.mocked(usePreuvesLabellisation);

const documentsCandidatureCriterion = 'Ajouter les documents officiels de candidature';
const addDocumentButton = 'Ajouter un document';
const renameFileButton = 'Renommer le fichier';
const deleteFileButton = 'Supprimer';

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

const buildParcours = ({
  demandeId,
  peutModifierDocumentsCandidature,
}: {
  demandeId: number | null;
  peutModifierDocumentsCandidature: boolean;
}): Parcours =>
  ({
    acteEngagement: { signed: true, demandeId },
    peutModifierDocumentsCandidature,
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
      <tbody>
        <CandidatureDocumentsRow />
      </tbody>
    </table>
  );

beforeEach(() => {
  mockedUsePreuvesLabellisation.mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof usePreuvesLabellisation>);
});

describe('CandidatureDocumentsRow', () => {
  it('ne rend rien quand parcours est null', () => {
    setChecklist(null);

    renderRow();

    expect(screen.queryByText(documentsCandidatureCriterion)).toBeNull();
  });

  it("affiche le critère sans bouton d'ajout quand il n'y a pas de demande", () => {
    setChecklist(
      buildParcours({
        demandeId: null,
        peutModifierDocumentsCandidature: true,
      })
    );

    renderRow();

    expect(screen.getByText(documentsCandidatureCriterion)).toBeDefined();
    expect(
      screen.queryByRole('button', { name: addDocumentButton })
    ).toBeNull();
  });

  it("affiche le bouton d'ajout pour un éditeur quand les documents de candidature sont modifiables", () => {
    setChecklist(
      buildParcours({ demandeId: 42, peutModifierDocumentsCandidature: true })
    );

    renderRow();

    expect(
      screen.getByRole('button', { name: addDocumentButton })
    ).toBeDefined();
  });

  it("masque le bouton d'ajout une fois l'audit validé", () => {
    setChecklist(
      buildParcours({ demandeId: 42, peutModifierDocumentsCandidature: false })
    );

    renderRow();

    expect(
      screen.queryByRole('button', { name: addDocumentButton })
    ).toBeNull();
  });

  it("masque le bouton d'ajout pour un auditeur", () => {
    setChecklist(
      buildParcours({ demandeId: 42, peutModifierDocumentsCandidature: true }),
      'auditor'
    );

    renderRow();

    expect(
      screen.queryByRole('button', { name: addDocumentButton })
    ).toBeNull();
  });
});

describe('CandidatureDocumentsRow — actions par document', () => {
  it('affiche un bouton « Renommer le fichier » et « Supprimer » par document quand les documents sont modifiables', () => {
    setChecklist(
      buildParcours({ demandeId: 42, peutModifierDocumentsCandidature: true })
    );
    setPreuves([
      { id: 1, fichier: { filename: 'doc-a.pdf' } },
      { id: 2, fichier: { filename: 'doc-b.pdf' } },
    ]);

    renderRow();

    expect(
      screen.getAllByRole('button', { name: renameFileButton })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: deleteFileButton })
    ).toHaveLength(2);
  });

  it("n'expose aucun bouton « Remplacer le fichier » par document", () => {
    setChecklist(
      buildParcours({ demandeId: 42, peutModifierDocumentsCandidature: true })
    );
    setPreuves([{ id: 1, fichier: { filename: 'doc-a.pdf' } }]);

    renderRow();

    expect(
      screen.queryByRole('button', { name: 'Remplacer le fichier' })
    ).toBeNull();
  });

  it("n'affiche ni « Renommer le fichier » ni « Supprimer » une fois l'audit validé", () => {
    setChecklist(
      buildParcours({ demandeId: 42, peutModifierDocumentsCandidature: false })
    );
    setPreuves([{ id: 1, fichier: { filename: 'doc-a.pdf' } }]);

    renderRow();

    expect(
      screen.queryByRole('button', { name: renameFileButton })
    ).toBeNull();
    expect(screen.queryByRole('button', { name: deleteFileButton })).toBeNull();
  });

  it("n'affiche ni « Renommer le fichier » ni « Supprimer » pour un auditeur", () => {
    setChecklist(
      buildParcours({ demandeId: 42, peutModifierDocumentsCandidature: true }),
      'auditor'
    );
    setPreuves([{ id: 1, fichier: { filename: 'doc-a.pdf' } }]);

    renderRow();

    expect(
      screen.queryByRole('button', { name: renameFileButton })
    ).toBeNull();
    expect(screen.queryByRole('button', { name: deleteFileButton })).toBeNull();
  });
});
