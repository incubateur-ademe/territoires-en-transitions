import { ObjetPreuve, ObjetPreuveEnum } from '@tet/domain/referentiels';
import { render, screen } from '@testing-library/react';
import { appLabels } from '../../../../../../labels/catalog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreuvesLabellisation } from '../../../../../labellisations/useCycleLabellisation';
import { AuditViewerRole } from '../../../../audit-badge-status/types';
import { Parcours } from '../../../../checklist-view-model';
import {
  ChecklistContext,
  ChecklistContextValue,
} from '../../../../checklist.context';
import { ChecklistPreuve } from '../checklist-preuve';
import { CandidatureDocumentsRow } from './candidature-documents.section';

vi.mock('../../../../../labellisations/useCycleLabellisation', () => ({
  usePreuvesLabellisation: vi.fn(),
}));

vi.mock('../upload-preuve-button', () => ({
  UploadPreuveButton: ({ label }: { label: string }) => (
    <button>{label}</button>
  ),
}));

vi.mock('../rename-preuve-button', () => ({
  RenamePreuveButton: () => <button>{'Renommer le fichier'}</button>,
}));

vi.mock('../download-preuve-button', () => ({
  DownloadPreuveButton: () => <button>{'Télécharger le fichier'}</button>,
}));

vi.mock('../delete-preuve-button', () => ({
  DeletePreuveButton: () => <button>{'Supprimer'}</button>,
}));

const mockedUsePreuvesLabellisation = vi.mocked(usePreuvesLabellisation);

let checklist: ChecklistContextValue;

const setChecklist = (
  parcours: Parcours | null,
  viewerRole: AuditViewerRole = 'auditee',
  expectedDocuments: ObjetPreuve[] = [ObjetPreuveEnum.CANDIDATURE],
  canMutateLabellisationDocuments = false
): void => {
  checklist = {
    parcours,
    referentielId: 'cae',
    cycle: { viewerRole },
    expectedDocuments,
    canMutateLabellisationDocuments,
  } as unknown as ChecklistContextValue;
};

const toParcours = ({
  demandeId,
  canModifyCandidatureDocuments,
}: {
  demandeId: number | null;
  canModifyCandidatureDocuments: boolean;
}): Parcours =>
  ({
    acteEngagement: { demandeId },
    canModifyCandidatureDocuments,
  } as unknown as Parcours);

const setPreuves = (preuves: readonly ChecklistPreuve[]): void => {
  mockedUsePreuvesLabellisation.mockReturnValue({
    data: preuves,
  } as unknown as ReturnType<typeof usePreuvesLabellisation>);
};

const toPreuve = ({
  id,
  filename,
  objet,
}: {
  id: number;
  filename: string;
  objet: ObjetPreuve | null;
}): ChecklistPreuve => ({
  id,
  objet,
  collectiviteId: 1,
  preuveType: 'labellisation',
  fichier: {
    filename,
    hash: `hash-${id}`,
    bucketId: 'bucket',
    confidentiel: false,
  },
});

const renderRow = () =>
  render(
    <ChecklistContext.Provider value={checklist}>
      <table>
        <CandidatureDocumentsRow />
      </table>
    </ChecklistContext.Provider>
  );

beforeEach(() => {
  mockedUsePreuvesLabellisation.mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof usePreuvesLabellisation>);
});

describe("CandidatureDocumentsRow — bouton d'ajout", () => {
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

  it("affiche le bouton d'ajout au porteur de la permission, sans être l'audité", () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true }),
      'other',
      [ObjetPreuveEnum.CANDIDATURE],
      true
    );

    renderRow();

    expect(
      screen.getByRole('button', { name: appLabels.ajouterDocument })
    ).toBeTruthy();
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

describe('CandidatureDocumentsRow — filtrage par objet', () => {
  it("n'affiche pas les actes d'engagement", () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true })
    );
    setPreuves([
      toPreuve({
        id: 1,
        filename: 'dossier.pdf',
        objet: ObjetPreuveEnum.CANDIDATURE,
      }),
      toPreuve({
        id: 2,
        filename: 'acte.pdf',
        objet: ObjetPreuveEnum.ACTE_ENGAGEMENT,
      }),
    ]);

    renderRow();

    expect(screen.getByText('dossier.pdf')).toBeDefined();
    expect(screen.queryByText('acte.pdf')).toBeNull();
  });

  it("n'affiche pas une preuve sans objet", () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true })
    );
    setPreuves([toPreuve({ id: 1, filename: 'legacy.pdf', objet: null })]);

    renderRow();

    expect(screen.queryByText('legacy.pdf')).toBeNull();
  });
});

describe('CandidatureDocumentsRow — actions par document', () => {
  it('affiche « Renommer » et « Supprimer » par document pour un éditeur quand les documents sont modifiables', () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true })
    );
    setPreuves([
      toPreuve({
        id: 1,
        filename: 'doc-a.pdf',
        objet: ObjetPreuveEnum.CANDIDATURE,
      }),
      toPreuve({
        id: 2,
        filename: 'doc-b.pdf',
        objet: ObjetPreuveEnum.CANDIDATURE,
      }),
    ]);

    renderRow();

    expect(
      screen.getAllByRole('button', { name: appLabels.renommerLeFichier })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: appLabels.supprimer })
    ).toHaveLength(2);
  });

  it("masque « Renommer » et « Supprimer » une fois l'audit validé", () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: false })
    );
    setPreuves([
      toPreuve({
        id: 1,
        filename: 'doc-a.pdf',
        objet: ObjetPreuveEnum.CANDIDATURE,
      }),
    ]);

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
    setPreuves([
      toPreuve({
        id: 1,
        filename: 'doc-a.pdf',
        objet: ObjetPreuveEnum.CANDIDATURE,
      }),
    ]);

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
    setPreuves([
      toPreuve({
        id: 1,
        filename: 'doc-a.pdf',
        objet: ObjetPreuveEnum.CANDIDATURE,
      }),
    ]);

    renderRow();

    expect(
      screen.queryByRole('button', { name: appLabels.renommerLeFichier })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: appLabels.supprimer })
    ).toBeNull();
  });

  it('affiche « Télécharger » quel que soit le profil', () => {
    setChecklist(
      toParcours({ demandeId: 42, canModifyCandidatureDocuments: true }),
      'other'
    );
    setPreuves([
      toPreuve({
        id: 1,
        filename: 'doc-a.pdf',
        objet: ObjetPreuveEnum.CANDIDATURE,
      }),
    ]);

    renderRow();

    expect(
      screen.getByRole('button', { name: appLabels.telechargerFichier })
    ).toBeDefined();
  });
});
