import { toDocumentHash } from '@tet/domain/collectivites';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AuditReport } from '../data/use-list-reports-by-audit';
import { PersistedReportCard } from './report-card';

const COLLECTIVITE_ID = 1;

const { openPreuve } = vi.hoisted(() => ({ openPreuve: vi.fn() }));

vi.mock(
  '@/app/collectivites/documents/bibliotheque/use-open-preuve',
  (): Partial<
    Record<
      keyof typeof import('@/app/collectivites/documents/bibliotheque/use-open-preuve'),
      unknown
    >
  > => ({
    useOpenPreuve: () => openPreuve,
  })
);

const base = {
  id: 1,
  collectiviteId: COLLECTIVITE_ID,
  commentaire: null,
  modifiedAt: '2026-09-06T16:43:41.423515+00:00',
  modifiedBy: null,
  modifiedByNom: 'Yolo Dodo',
  preuveType: 'audit',
  auditId: 3,
  demande: null,
  audit: { id: 3 },
};

const rapportFichier = {
  ...base,
  type: 'fichier',
  fichier: {
    id: 21,
    collectiviteId: COLLECTIVITE_ID,
    hash: toDocumentHash(
      'c9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9'
    ),
    filename: 'rapport-audit.pdf',
    filesize: 2048,
    bucketId: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: false,
  },
} as unknown as AuditReport;

const rapportIntrouvable = {
  ...base,
  type: 'fichierManquant',
  filename: 'rapport-perdu.pdf',
} as unknown as AuditReport;

const renderCard = (report: AuditReport) =>
  render(
    <PersistedReportCard
      report={report}
      isRemoving={false}
      onRemove={vi.fn()}
    />
  );

describe('PersistedReportCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("le nom d'un rapport introuvable n'est pas un bouton", () => {
    renderCard(rapportIntrouvable);

    expect(
      screen.queryByRole('button', { name: /^rapport-perdu\.pdf/ })
    ).toBeNull();
    expect(screen.getByText(/rapport-perdu\.pdf/)).toBeTruthy();
  });

  test('un clic sur le titre ouvre le rapport', () => {
    renderCard(rapportFichier);

    fireEvent.click(
      screen.getByRole('button', { name: /^rapport-audit\.pdf/ })
    );

    expect(openPreuve).toHaveBeenCalledWith(rapportFichier);
  });

  test("le titre n'ouvre plus le rapport pendant sa suppression", () => {
    render(
      <PersistedReportCard
        report={rapportFichier}
        isRemoving
        onRemove={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /^rapport-audit\.pdf/ })
    );

    expect(openPreuve).not.toHaveBeenCalled();
  });
});
