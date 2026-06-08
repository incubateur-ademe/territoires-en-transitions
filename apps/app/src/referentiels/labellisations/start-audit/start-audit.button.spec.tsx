import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ParcoursForAuditRequest } from '@tet/domain/referentiels';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCycleLabellisation } from '../useCycleLabellisation';
import { StartAuditButton } from './start-audit.button';

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock('../useCycleLabellisation', () => ({
  useCycleLabellisation: vi.fn(),
}));

vi.mock('./start-audit.modal', () => ({
  StartAuditModal: () => null,
}));

vi.mock('@tet/ui', async (importActual) => {
  const actual = await importActual<typeof import('@tet/ui')>();
  const { createElement } = await import('react');
  return {
    ...actual,
    Tooltip: ({ label, children }: { label: string; children: ReactNode }) =>
      createElement('span', { 'data-tooltip-label': label }, children),
  };
});

const mockedUseCurrentCollectivite = vi.mocked(useCurrentCollectivite);
const mockedUseCycleLabellisation = vi.mocked(useCycleLabellisation);

const demanderAuditButton = /Demander un audit/;

const setCollectivite = ({
  canMutate,
  isRoleAuditeur,
}: {
  canMutate: boolean;
  isRoleAuditeur: boolean;
}): void => {
  mockedUseCurrentCollectivite.mockReturnValue({
    hasCollectivitePermission: (permission: string) =>
      permission === 'referentiels.mutate' ? canMutate : false,
    isRoleAuditeur,
    collectiviteId: 1,
  } as unknown as ReturnType<typeof useCurrentCollectivite>);
};

const setCycle = ({
  parcours,
  maximumRequestableStar,
  isCOT = false,
}: {
  parcours: ParcoursForAuditRequest | null;
  maximumRequestableStar: number | null;
  isCOT?: boolean;
}): void => {
  mockedUseCycleLabellisation.mockReturnValue({
    parcours,
    isCOT,
    maximumRequestableStar,
  } as unknown as ReturnType<typeof useCycleLabellisation>);
};

const requestableCycle = {
  parcours: {
    status: 'non_demandee',
    demande: null,
    labellisation: null,
    completude_ok: true,
    critere_score: {
      atteint: true,
      score_fait: 0.4,
    } as ParcoursForAuditRequest['critere_score'],
    isCot: false,
    etoiles: 2,
    conditionFichiers: { atteint: true },
    criteres_action: [{ atteint: true }],
  } as ParcoursForAuditRequest,
  maximumRequestableStar: 2,
};

beforeEach(() => {
  setCollectivite({ canMutate: true, isRoleAuditeur: false });
  setCycle(requestableCycle);
});

describe('StartAuditButton — visibilité selon le rôle', () => {
  it('ne rend rien pour un auditeur', () => {
    setCollectivite({ canMutate: true, isRoleAuditeur: true });

    const { container } = render(<StartAuditButton referentielId="cae" />);

    expect(screen.queryByRole('button', { name: demanderAuditButton })).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('ne rend rien pour un non-membre', () => {
    setCollectivite({ canMutate: false, isRoleAuditeur: false });

    const { container } = render(<StartAuditButton referentielId="cae" />);

    expect(screen.queryByRole('button', { name: demanderAuditButton })).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("ne rend rien tant que le parcours n'est pas chargé", () => {
    setCycle({
      parcours: null,
      maximumRequestableStar: 2,
    });

    const { container } = render(<StartAuditButton referentielId="cae" />);

    expect(container.firstChild).toBeNull();
  });
});

describe('StartAuditButton — état du bouton pour la collectivité auditée', () => {
  it('rend le bouton actif sans tooltip quand la demande est possible', () => {
    render(<StartAuditButton referentielId="cae" />);

    const button = screen.getByRole('button', { name: demanderAuditButton });
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('bouton « Demander un audit » inattendu');
    }
    expect(button.disabled).toBe(false);
    expect(document.querySelector('[data-tooltip-label]')).toBeNull();
  });

  it("rend le bouton désactivé avec un tooltip quand aucun type d'audit n'est demandable", () => {
    setCycle({ ...requestableCycle, maximumRequestableStar: 1 });

    render(<StartAuditButton referentielId="cae" />);

    const button = screen.getByRole('button', { name: demanderAuditButton });
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('bouton « Demander un audit » inattendu');
    }
    expect(button.disabled).toBe(true);
    expect(document.querySelector('[data-tooltip-label]')).not.toBeNull();
  });

  it('rend le bouton désactivé pour un COT quand maximumRequestableStar < 2', () => {
    setCycle({
      parcours: {
        ...requestableCycle.parcours,
        isCot: true,
        etoiles: 1,
      } as ParcoursForAuditRequest,
      isCOT: true,
      maximumRequestableStar: 1,
    });

    render(<StartAuditButton referentielId="cae" />);

    const button = screen.getByRole('button', { name: demanderAuditButton });
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('bouton « Demander un audit » inattendu');
    }
    expect(button.disabled).toBe(true);
    expect(document.querySelector('[data-tooltip-label]')).not.toBeNull();
  });

  it('rend le bouton désactivé avec un tooltip quand les prérequis de labellisation sont incomplets', () => {
    mockedUseCycleLabellisation.mockReturnValue({
      parcours: {
        status: 'non_demandee',
        demande: null,
        labellisation: null,
        completude_ok: false,
        etoiles: 2,
        isCot: false,
        critere_score: { atteint: false },
        conditionFichiers: { atteint: false },
        criteres_action: [{ atteint: false }],
      },
      isCOT: false,
      maximumRequestableStar: 2,
    } as unknown as ReturnType<typeof useCycleLabellisation>);

    render(<StartAuditButton referentielId="cae" />);

    const button = screen.getByRole('button', { name: demanderAuditButton });
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('bouton « Demander un audit » inattendu');
    }
    expect(button.disabled).toBe(true);
    expect(document.querySelector('[data-tooltip-label]')).not.toBeNull();
  });
});
