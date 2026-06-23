import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditViewerRole } from '../../../audit-badge-status/types';
import { useChecklist } from '../../../checklist.context';
import { usePreuvesLabellisation } from '../../../../labellisations/useCycleLabellisation';
import { ActeEngagementSection } from './acte-engagement.section';

vi.mock('../../../checklist.context', () => ({
  useChecklist: vi.fn(),
}));

vi.mock('../../../../labellisations/useCycleLabellisation', () => ({
  usePreuvesLabellisation: vi.fn(),
}));

vi.mock('../../../../labellisations/useAddPreuveToDemande', () => ({
  useAddPreuveToDemande: vi.fn(() => ({})),
}));

vi.mock('../../../../preuves/AddPreuveModal', () => ({
  AddPreuveModal: () => null,
}));

vi.mock('@tet/ui', async (importActual) => ({
  ...(await importActual<typeof import('@tet/ui')>()),
  Modal: ({ children }: { children: ReactNode }) => children,
}));

const mockedUseChecklist = vi.mocked(useChecklist);
const mockedUsePreuvesLabellisation = vi.mocked(usePreuvesLabellisation);

const setViewerRole = (viewerRole: AuditViewerRole): void => {
  mockedUseChecklist.mockReturnValue({
    cycle: { viewerRole },
  } as unknown as ReturnType<typeof useChecklist>);
};

const setDepositedActe = (filename: string): void => {
  mockedUsePreuvesLabellisation.mockReturnValue({
    data: [{ id: 99, fichier: { filename } }],
    isLoading: false,
  } as unknown as ReturnType<typeof usePreuvesLabellisation>);
};

beforeEach(() => {
  mockedUsePreuvesLabellisation.mockReturnValue({
    data: [],
    isLoading: false,
  } as unknown as ReturnType<typeof usePreuvesLabellisation>);
});

describe('ActeEngagementSection — acte signé (état signed)', () => {
  it("affiche le nom de l'acte déposé et le bouton « Remplacer » pour un éditeur", () => {
    setViewerRole('auditee');
    setDepositedActe('acte-signe.pdf');

    render(<ActeEngagementSection signed={true} demandeId={42} />);

    expect(screen.getByText('acte-signe.pdf')).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Remplacer le fichier' })
    ).toBeDefined();
  });

  it("affiche l'acte déposé sans bouton « Remplacer » pour un auditeur", () => {
    setViewerRole('auditor');
    setDepositedActe('acte-signe.pdf');

    render(<ActeEngagementSection signed={true} demandeId={42} />);

    expect(screen.getByText('acte-signe.pdf')).toBeDefined();
    expect(
      screen.queryByRole('button', { name: 'Remplacer le fichier' })
    ).toBeNull();
  });
});

describe('ActeEngagementSection — acte non déposé (état uploadable)', () => {
  it("affiche le bouton « Téléverser l'acte signé » pour un éditeur", () => {
    setViewerRole('auditee');

    render(<ActeEngagementSection signed={false} demandeId={null} />);

    expect(
      screen.getByRole('button', { name: "Téléverser l'acte signé" })
    ).toBeDefined();
  });
});

describe('ActeEngagementSection — masqué (état hidden)', () => {
  it('ne rend rien pour un auditeur', () => {
    setViewerRole('auditor');

    const { container } = render(
      <ActeEngagementSection signed={false} demandeId={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('ne rend rien pour un visiteur (ni mutation ni auditeur)', () => {
    setViewerRole('other');

    const { container } = render(
      <ActeEngagementSection signed={false} demandeId={null} />
    );

    expect(container.firstChild).toBeNull();
  });
});
