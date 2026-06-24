import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  ParcoursForAuditRequest,
  ROLE_IDENTIFIANTS,
  ReferentRolesDefined,
} from '@tet/domain/referentiels';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditViewerRole } from '../../audit-labellisation/audit-badge-status/types';
import { useReferentRolesDefined } from '../../audit-labellisation/use-referent-roles-defined';
import { useCycleLabellisation } from '../useCycleLabellisation';
import { RequestAuditButton } from './request-audit.button';

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock('../useCycleLabellisation', () => ({
  useCycleLabellisation: vi.fn(),
}));

vi.mock('../../audit-labellisation/use-referent-roles-defined', () => ({
  useReferentRolesDefined: vi.fn(),
}));

vi.mock('./request-audit.modal', () => ({
  RequestAuditModal: () => null,
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
const mockedUseReferentRolesDefined = vi.mocked(useReferentRolesDefined);

const demanderAuditButton = /Demander un audit/;

const ROLES_DEFINIS: ReferentRolesDefined = {
  eluReferent: true,
  referentTechnique: true,
};

const eluReferentActionId = `cae_${ROLE_IDENTIFIANTS.cae.eluReferent}`;
const referentTechniqueActionId = `cae_${ROLE_IDENTIFIANTS.cae.referentTechnique}`;

const setReferentRoles = (
  referentRolesDefined: ReferentRolesDefined = ROLES_DEFINIS,
  isLoaded = true
): void => {
  mockedUseReferentRolesDefined.mockReturnValue({ referentRolesDefined, isLoaded });
};

const setCycle = ({
  parcours,
  maximumRequestableStar,
  isCOT = false,
  viewerRole = 'auditee',
}: {
  parcours: ParcoursForAuditRequest | null;
  maximumRequestableStar: number | null;
  isCOT?: boolean;
  viewerRole?: AuditViewerRole;
}): void => {
  mockedUseCycleLabellisation.mockReturnValue({
    parcours,
    isCOT,
    maximumRequestableStar,
    viewerRole,
  } as unknown as ReturnType<typeof useCycleLabellisation>);
};

const requestableCycle = {
  parcours: {
    status: 'non_demandee',
    demande: null,
    labellisation: null,
    referentiel: 'cae',
    completude_ok: true,
    critere_score: {
      atteint: true,
      score_fait: 0.4,
    } as ParcoursForAuditRequest['critere_score'],
    isCot: false,
    etoiles: 2,
    conditionFichiers: { atteint: true },
    criteres_action: [
      { atteint: true, action_id: eluReferentActionId },
      { atteint: true, action_id: referentTechniqueActionId },
    ],
  } as ParcoursForAuditRequest,
  maximumRequestableStar: 2,
};

beforeEach(() => {
  mockedUseCurrentCollectivite.mockReturnValue({
    collectiviteId: 1,
  } as unknown as ReturnType<typeof useCurrentCollectivite>);
  setCycle(requestableCycle);
  setReferentRoles();
});

describe('RequestAuditButton — visibilité selon le rôle', () => {
  it('ne rend rien pour un auditeur', () => {
    setCycle({ ...requestableCycle, viewerRole: 'auditor' });

    const { container } = render(<RequestAuditButton referentielId="cae" />);

    expect(screen.queryByRole('button', { name: demanderAuditButton })).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('ne rend rien pour un non-membre', () => {
    setCycle({ ...requestableCycle, viewerRole: 'other' });

    const { container } = render(<RequestAuditButton referentielId="cae" />);

    expect(screen.queryByRole('button', { name: demanderAuditButton })).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("ne rend rien tant que le parcours n'est pas chargé", () => {
    setCycle({
      parcours: null,
      maximumRequestableStar: 2,
    });

    const { container } = render(<RequestAuditButton referentielId="cae" />);

    expect(container.firstChild).toBeNull();
  });
});

describe('RequestAuditButton — état du bouton pour la collectivité auditée', () => {
  it('rend le bouton actif sans tooltip quand la demande est possible', () => {
    render(<RequestAuditButton referentielId="cae" />);

    const button = screen.getByRole('button', { name: demanderAuditButton });
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('bouton « Demander un audit » inattendu');
    }
    expect(button.disabled).toBe(false);
    expect(document.querySelector('[data-tooltip-label]')).toBeNull();
  });

  it("rend le bouton désactivé avec un tooltip quand aucun type d'audit n'est demandable", () => {
    setCycle({ ...requestableCycle, maximumRequestableStar: 1 });

    render(<RequestAuditButton referentielId="cae" />);

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

    render(<RequestAuditButton referentielId="cae" />);

    const button = screen.getByRole('button', { name: demanderAuditButton });
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('bouton « Demander un audit » inattendu');
    }
    expect(button.disabled).toBe(true);
    expect(document.querySelector('[data-tooltip-label]')).not.toBeNull();
  });

  it("rend le bouton désactivé avec un tooltip quand l'élu référent ou le référent technique n'est pas désigné", () => {
    setReferentRoles({ eluReferent: false, referentTechnique: true });

    render(<RequestAuditButton referentielId="cae" />);

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
      viewerRole: 'auditee',
    } as unknown as ReturnType<typeof useCycleLabellisation>);

    render(<RequestAuditButton referentielId="cae" />);

    const button = screen.getByRole('button', { name: demanderAuditButton });
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('bouton « Demander un audit » inattendu');
    }
    expect(button.disabled).toBe(true);
    expect(document.querySelector('[data-tooltip-label]')).not.toBeNull();
  });
});
