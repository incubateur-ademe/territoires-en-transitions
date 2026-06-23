import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TCycleLabellisation } from '../../labellisations/useCycleLabellisation';
import { useChecklist } from '../checklist.context';
import { ChecklistActions } from './checklist-actions';

vi.mock('../checklist.context', () => ({
  useChecklist: vi.fn(),
}));

vi.mock('../../labellisations/DemandeLabellisationModal', () => ({
  DemandeLabellisationModal: () => null,
}));

vi.mock('../../labellisations/start-audit/start-audit.button', () => ({
  StartAuditButton: () => null,
}));

vi.mock('./actions/begin-audit.button', async () => {
  const { createElement } = await import('react');
  return {
    BeginAuditButton: () => createElement('span', null, 'begin-audit-button'),
  };
});

vi.mock('../../audits/cloture/cloturer-audit.button', async () => {
  const { createElement } = await import('react');
  return {
    CloturerAuditButton: () =>
      createElement('span', null, 'cloturer-audit-button'),
  };
});

const mockedUseChecklist = vi.mocked(useChecklist);

const obtenirPremiereEtoile = 'Obtenir la première étoile';

const setContext = ({
  cycle,
  premiereEtoileObtenue = false,
}: {
  cycle: Partial<TCycleLabellisation>;
  premiereEtoileObtenue?: boolean;
}): void => {
  mockedUseChecklist.mockReturnValue({
    cycle: {
      isAuditeur: false,
      viewerRole: 'auditee',
      isCOT: false,
      canStartAudit: false,
      isConductingAudit: false,
      parcours: null,
      ...cycle,
    } as TCycleLabellisation,
    parcours: null,
    referentielId: 'cae',
    premiereEtoileObtenue,
  } as unknown as ReturnType<typeof useChecklist>);
};

const auditEnCours = {
  status: 'audit_en_cours',
  audit: { id: 1, demande_id: 2 },
} as TCycleLabellisation['parcours'];

const premiereEtoileDemandeEnvoyee = {
  status: 'demande_envoyee',
  audit: null,
  demande: { sujet: 'labellisation', etoiles: '1' },
} as TCycleLabellisation['parcours'];

const requestablePremiereEtoile = {
  status: 'non_demandee',
  audit: null,
  demande: null,
} as TCycleLabellisation['parcours'];

beforeEach(() => {
  mockedUseChecklist.mockReset();
});

describe('ChecklistActions — bouton « Obtenir la première étoile »', () => {
  it('désactive le bouton quand une demande de première étoile est déjà en cours', () => {
    setContext({
      cycle: {
        canAskFirstStar: true,
        status: 'demande_envoyee',
        parcours: premiereEtoileDemandeEnvoyee,
      },
    });

    render(<ChecklistActions />);

    const button = screen.getByRole('button', { name: obtenirPremiereEtoile });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it("garde le bouton actif quand aucune demande première étoile n'a été envoyée", () => {
    setContext({
      cycle: {
        canAskFirstStar: true,
        status: 'non_demandee',
        parcours: requestablePremiereEtoile,
      },
    });

    render(<ChecklistActions />);

    const button = screen.getByRole('button', { name: obtenirPremiereEtoile });
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('masque le bouton une fois la première étoile obtenue', () => {
    setContext({
      cycle: {
        canAskFirstStar: false,
        status: 'non_demandee',
        parcours: requestablePremiereEtoile,
      },
      premiereEtoileObtenue: true,
    });

    render(<ChecklistActions />);

    expect(
      screen.queryByRole('button', { name: obtenirPremiereEtoile })
    ).toBeNull();
  });
});

describe("ChecklistActions — aiguillage selon le rôle et l'état du cycle", () => {
  it('ne rend aucune action collectivité pour un auditeur', () => {
    setContext({
      cycle: {
        viewerRole: 'auditor',
        canAskFirstStar: true,
        status: 'non_demandee',
        parcours: requestablePremiereEtoile,
      },
    });

    render(<ChecklistActions />);

    expect(
      screen.queryByRole('button', { name: obtenirPremiereEtoile })
    ).toBeNull();
  });

  it("rend « Commencer l'audit » quand l'auditeur peut démarrer un audit", () => {
    setContext({
      cycle: {
        viewerRole: 'auditor',
        canStartAudit: true,
        parcours: auditEnCours,
      },
    });

    render(<ChecklistActions />);

    expect(screen.getByText('begin-audit-button')).toBeDefined();
    expect(screen.queryByText('cloturer-audit-button')).toBeNull();
  });

  it("rend « Clôturer l'audit » quand un audit est en cours pour l'auditeur", () => {
    setContext({
      cycle: {
        viewerRole: 'auditor',
        isConductingAudit: true,
        parcours: auditEnCours,
      },
    });

    render(<ChecklistActions />);

    expect(screen.getByText('cloturer-audit-button')).toBeDefined();
    expect(screen.queryByText('begin-audit-button')).toBeNull();
  });
});
