import { appLabels } from '@/app/labels/catalog';
import type { AbandonedAiImport } from '@/app/plans/plans/import-plan/data/use-find-abandoned-ai-import';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgrammeImportStatus } from './programme-import.status';

const abandoned = vi.hoisted(() => ({
  current: null as AbandonedAiImport | null,
}));

vi.mock('./import-programme.context', () => ({
  useImportProgramme: () => ({
    isEnabled: true,
    isOngoing: false,
    isAwaitingAnswer: false,
    ongoingJobId: null,
    ongoingStatus: undefined,
    startProgrammeImport: vi.fn(),
    isStarting: false,
  }),
}));
vi.mock(
  '@/app/plans/plans/import-plan/data/use-find-previous-ai-import',
  () => ({
    useFindPreviousAiImport: () => ({ previousImport: null, isLoading: false }),
  })
);
vi.mock(
  '@/app/plans/plans/import-plan/data/use-find-abandoned-ai-import',
  () => ({
    useFindAbandonedAiImport: () => ({
      abandonedImport: abandoned.current,
      isLoading: false,
    }),
  })
);
vi.mock('@/app/demarches/use-demarche-tracker', () => ({
  useDemarcheTracker: () => vi.fn(),
}));
vi.mock('react-use/lib/useLocalStorage', () => ({
  default: () => [undefined, vi.fn()],
}));

const programmeFichier = {
  id: 42,
  filename: 'programme-actions.pdf',
  hash: 'abc',
  bucketId: null,
  filesize: 1000,
};

const renderStatus = () =>
  render(
    <ProgrammeImportStatus
      demarcheId={3}
      programmeFichier={programmeFichier}
      isAmontModifiable
    />
  );

describe('ProgrammeImportStatus', () => {
  beforeEach(() => {
    abandoned.current = null;
  });

  it('propose de créer le plan à partir du programme déposé', () => {
    renderStatus();

    expect(
      screen.getByText(appLabels.demarcheProgrammeProposerTitre)
    ).toBeTruthy();
  });

  it("explique l'abandon du dernier import de ce fichier au lieu de reproposer le même document", () => {
    abandoned.current = {
      jobId: '7b0f7d4e-3c1a-4d0e-9c55-2f8f8a1b2c3d',
      importedAt: '2026-11-20T10:00:00Z',
      abandon: {
        motif: 'aucune-action',
        evidence: [{ citation: 'Synthèse des enjeux du territoire', page: 4 }],
        explanation: 'Ce document est le diagnostic du territoire.',
      },
    };

    renderStatus();

    expect(
      screen.queryByText(appLabels.demarcheProgrammeProposerTitre)
    ).toBeNull();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain(appLabels.importPlanIaAbandonTitre);
    expect(alert.textContent).toContain(
      appLabels.importPlanIaAbandonProbleme['aucune-action']
    );
    expect(alert.textContent).toContain('Synthèse des enjeux du territoire');
    expect(alert.textContent).toContain(
      appLabels.importPlanIaAbandonPreuvePage({ page: 4 })
    );
  });
});
