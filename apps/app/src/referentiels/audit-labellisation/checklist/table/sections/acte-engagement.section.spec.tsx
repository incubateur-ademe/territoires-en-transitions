import { render, screen } from '@testing-library/react';
import { appLabels } from '../../../../../labels/catalog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreuvesLabellisation } from '../../../../labellisations/useCycleLabellisation';
import { AuditViewerRole } from '../../../audit-badge-status/types';
import { useChecklist } from '../../../checklist.context';
import { ActeEngagementSection } from './acte-engagement.section';

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

const mockedUseChecklist = vi.mocked(useChecklist);
const mockedUsePreuvesLabellisation = vi.mocked(usePreuvesLabellisation);

const setViewerRole = (viewerRole: AuditViewerRole): void => {
  mockedUseChecklist.mockReturnValue({
    cycle: { viewerRole },
  } as unknown as ReturnType<typeof useChecklist>);
};

const setActeDepose = (filename: string): void => {
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
  it("affiche l'acte déposé et le bouton « Remplacer » pour un éditeur", () => {
    setViewerRole('auditee');
    setActeDepose('acte-signe.pdf');

    render(<ActeEngagementSection signed={true} demandeId={42} />);

    expect(screen.getByText('acte-signe.pdf')).toBeDefined();
    expect(
      screen.getByRole('button', { name: appLabels.remplacerLeFichier })
    ).toBeDefined();
  });

  it("affiche l'acte déposé sans bouton « Remplacer » pour un auditeur", () => {
    setViewerRole('auditor');
    setActeDepose('acte-signe.pdf');

    render(<ActeEngagementSection signed={true} demandeId={42} />);

    expect(screen.getByText('acte-signe.pdf')).toBeDefined();
    expect(
      screen.queryByRole('button', { name: appLabels.remplacerLeFichier })
    ).toBeNull();
  });

  it("affiche l'acte déposé sans bouton « Remplacer » pour un visiteur", () => {
    setViewerRole('other');
    setActeDepose('acte-signe.pdf');

    render(<ActeEngagementSection signed={true} demandeId={42} />);

    expect(screen.getByText('acte-signe.pdf')).toBeDefined();
    expect(
      screen.queryByRole('button', { name: appLabels.remplacerLeFichier })
    ).toBeNull();
  });
});

describe('ActeEngagementSection — acte non déposé (état uploadable)', () => {
  it("affiche le bouton de téléversement de l'acte pour un éditeur", () => {
    setViewerRole('auditee');

    render(<ActeEngagementSection signed={false} demandeId={null} />);

    expect(
      screen.getByRole('button', { name: appLabels.acteEngagementUploadButton })
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

  it('ne rend rien pour un visiteur', () => {
    setViewerRole('other');

    const { container } = render(
      <ActeEngagementSection signed={false} demandeId={null} />
    );

    expect(container.firstChild).toBeNull();
  });
});
