import { useCurrentCollectivite } from '@tet/api/collectivites';
import { render, screen } from '@testing-library/react';
import { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCycleLabellisation } from '../labellisations/useCycleLabellisation';
import { AuditViewerRole } from './audit-badge-status/types';
import {
  EMPTY_CYCLE,
  toAudit,
  toParcoursLabellisation,
} from './checklist.test-fixture';
import { ChecklistProvider, useChecklist } from './checklist.context';

vi.mock('../labellisations/useCycleLabellisation', () => ({
  useCycleLabellisation: vi.fn(),
  usePreuvesLabellisation: vi.fn(() => ({ data: [] })),
}));

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

const CanUpdateProbe = (): ReactElement => {
  const { canUpdateCandidatureDocuments } = useChecklist();
  return <span>{String(canUpdateCandidatureDocuments)}</span>;
};

const renderProbe = ({
  audit,
  viewerRole,
  canMutateLabellisationDocuments,
}: {
  audit: { valide: boolean } | null;
  viewerRole: AuditViewerRole;
  canMutateLabellisationDocuments: boolean;
}): void => {
  vi.mocked(useCycleLabellisation).mockReturnValue({
    ...EMPTY_CYCLE,
    parcours: toParcoursLabellisation({
      audit: audit === null ? null : toAudit(audit),
    }),
    viewerRole,
  });
  vi.mocked(useCurrentCollectivite).mockReturnValue({
    hasCollectivitePermission: () => canMutateLabellisationDocuments,
  } as unknown as ReturnType<typeof useCurrentCollectivite>);

  render(
    <ChecklistProvider referentielId="cae">
      <CanUpdateProbe />
    </ChecklistProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ChecklistProvider — documents du cycle modifiables', () => {
  it("laisse l'audité modifier tant que l'audit n'est pas validé", () => {
    renderProbe({
      audit: { valide: false },
      viewerRole: 'auditee',
      canMutateLabellisationDocuments: false,
    });

    expect(screen.getByText('true')).toBeDefined();
  });

  it("gèle les documents de l'audité dès que l'audit est validé", () => {
    renderProbe({
      audit: { valide: true },
      viewerRole: 'auditee',
      canMutateLabellisationDocuments: false,
    });

    expect(screen.getByText('false')).toBeDefined();
  });

  it("refuse l'auditeur pendant son audit", () => {
    renderProbe({
      audit: { valide: false },
      viewerRole: 'auditor',
      canMutateLabellisationDocuments: false,
    });

    expect(screen.getByText('false')).toBeDefined();
  });

  it('laisse le super admin modifier sur un audit validé', () => {
    renderProbe({
      audit: { valide: true },
      viewerRole: 'other',
      canMutateLabellisationDocuments: true,
    });

    expect(screen.getByText('true')).toBeDefined();
  });
});
