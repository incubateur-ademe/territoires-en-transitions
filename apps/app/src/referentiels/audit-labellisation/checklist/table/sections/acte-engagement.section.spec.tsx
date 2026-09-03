import { EtoileEnum, ObjetPreuveEnum } from '@tet/domain/referentiels';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../../labels/catalog';
import { usePreuvesLabellisation } from '../../../../labellisations/useCycleLabellisation';
import { EMPTY_CYCLE } from '../../../checklist.test-fixture';
import {
  ChecklistContext,
  ChecklistContextValue,
} from '../../../checklist.context';
import {
  ActeEngagementRow,
  ActeEngagementSection,
} from './acte-engagement.section';
import { ChecklistPreuve } from './checklist-preuve';

vi.mock('../../../../labellisations/useCycleLabellisation', () => ({
  usePreuvesLabellisation: vi.fn(),
}));

vi.mock('./upload-preuve-button', () => ({
  UploadPreuveButton: ({ label }: { label: string }) => (
    <button>{label}</button>
  ),
}));

vi.mock('./download-preuve-button', () => ({
  DownloadPreuveButton: () => <button>{'Télécharger le fichier'}</button>,
}));

vi.mock('./rename-preuve-button', () => ({
  RenamePreuveButton: () => <button>{'Renommer le fichier'}</button>,
}));

vi.mock('./delete-preuve-button', () => ({
  DeletePreuveButton: () => <button>{'Supprimer'}</button>,
}));

const toActeDepose = (filename: string, id = 99): ChecklistPreuve => ({
  id,
  objet: ObjetPreuveEnum.ACTE_ENGAGEMENT,
  collectiviteId: 1,
  preuveType: 'labellisation',
  fichier: {
    filename,
    hash: `hash-${id}`,
    bucketId: 'bucket',
    confidentiel: false,
  },
});

describe('ActeEngagementSection — acte depose', () => {
  it('affiche « Renommer » et « Supprimer » par acte quand le dépôt est permis', () => {
    render(
      <ActeEngagementSection
        actes={[toActeDepose('acte-signe.pdf')]}
        isLoading={false}
        canEdit={true}
      />
    );

    expect(screen.getByText('acte-signe.pdf')).toBeDefined();
    expect(
      screen.getByRole('button', { name: appLabels.renommerLeFichier })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: appLabels.supprimer })
    ).toBeDefined();
  });

  it("masque le téléversement quand un acte est déjà déposé, un seul acte d'engagement étant admis", () => {
    render(
      <ActeEngagementSection
        actes={[toActeDepose('acte-signe.pdf')]}
        isLoading={false}
        canEdit={true}
      />
    );

    expect(
      screen.queryByRole('button', {
        name: appLabels.ajouterDocument,
      })
    ).toBeNull();
  });

  it('rouvre le téléversement une fois le seul acte supprimé', () => {
    const { rerender } = render(
      <ActeEngagementSection
        actes={[toActeDepose('acte-signe.pdf')]}
        isLoading={false}
        canEdit={true}
      />
    );

    rerender(
      <ActeEngagementSection actes={[]} isLoading={false} canEdit={true} />
    );

    expect(
      screen.getByRole('button', { name: appLabels.ajouterDocument })
    ).toBeDefined();
  });

  it('masque « Renommer » et « Supprimer » quand le dépôt est interdit', () => {
    render(
      <ActeEngagementSection
        actes={[toActeDepose('acte-signe.pdf')]}
        isLoading={false}
        canEdit={false}
      />
    );

    expect(screen.getByText('acte-signe.pdf')).toBeDefined();
    expect(
      screen.queryByRole('button', { name: appLabels.renommerLeFichier })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: appLabels.supprimer })
    ).toBeNull();
    expect(
      screen.queryByRole('button', {
        name: appLabels.ajouterDocument,
      })
    ).toBeNull();
  });

  it('liste tous les actes existants sans en masquer aucun', () => {
    render(
      <ActeEngagementSection
        actes={[
          toActeDepose('acte-signe.pdf', 1),
          toActeDepose('annexe.pdf', 2),
        ]}
        isLoading={false}
        canEdit={true}
      />
    );

    expect(screen.getByText('acte-signe.pdf')).toBeDefined();
    expect(screen.getByText('annexe.pdf')).toBeDefined();
  });

  it('affiche le bouton « Télécharger » quel que soit le profil', () => {
    render(
      <ActeEngagementSection
        actes={[toActeDepose('acte-signe.pdf')]}
        isLoading={false}
        canEdit={false}
      />
    );

    expect(
      screen.getByRole('button', { name: appLabels.telechargerFichier })
    ).toBeDefined();
  });
});

describe('ActeEngagementSection — acte non depose', () => {
  it('affiche le bouton de téléversement quand le dépôt est permis', () => {
    render(
      <ActeEngagementSection actes={[]} isLoading={false} canEdit={true} />
    );

    expect(
      screen.getByRole('button', { name: appLabels.ajouterDocument })
    ).toBeDefined();
    expect(
      screen.queryByRole('button', { name: appLabels.telechargerFichier })
    ).toBeNull();
  });

  it('ne rend rien quand le dépôt est interdit', () => {
    const { container } = render(
      <ActeEngagementSection actes={[]} isLoading={false} canEdit={false} />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('ActeEngagementSection — chargement', () => {
  it("affiche l'état de chargement plutôt que le bouton de téléversement", () => {
    render(
      <ActeEngagementSection actes={[]} isLoading={true} canEdit={true} />
    );

    expect(screen.getByText(appLabels.chargement)).toBeDefined();
    expect(
      screen.queryByRole('button', {
        name: appLabels.ajouterDocument,
      })
    ).toBeNull();
  });
});

describe("ActeEngagementRow — qui peut éditer l'acte", () => {
  const renderRow = ({
    canUpdateCandidatureDocuments,
  }: {
    canUpdateCandidatureDocuments: boolean;
  }) => {
    vi.mocked(usePreuvesLabellisation).mockReturnValue({
      data: [toActeDepose('acte-signe.pdf')],
      isLoading: false,
    } as unknown as ReturnType<typeof usePreuvesLabellisation>);

    const checklist: ChecklistContextValue = {
      cycle: EMPTY_CYCLE,
      parcours: {
        etoileObjectif: EtoileEnum.PREMIERE_ETOILE,
        completude: { done: false },
        minimumScore: { done: false, seuilPercent: 0 },
        scoreFait: 0,
        mesures: [],
        roleMesures: { eluReferent: null, referentTechnique: null },
        acteEngagement: { demandeId: 42 },
      },
      referentielId: 'cae',
      premiereEtoileObtenue: false,
      showActeEngagement: true,
      showCandidatureDocuments: false,
      canUpdateCandidatureDocuments,
    };

    render(
      <ChecklistContext.Provider value={checklist}>
        <ActeEngagementRow />
      </ChecklistContext.Provider>
    );
  };

  it("laisse supprimer l'acte quand les documents du cycle sont modifiables", () => {
    renderRow({ canUpdateCandidatureDocuments: true });

    expect(
      screen.getByRole('button', { name: appLabels.supprimer })
    ).toBeDefined();
  });

  it("refuse la suppression de l'acte quand ils ne le sont pas", () => {
    renderRow({ canUpdateCandidatureDocuments: false });

    expect(
      screen.queryByRole('button', { name: appLabels.supprimer })
    ).toBeNull();
  });
});
