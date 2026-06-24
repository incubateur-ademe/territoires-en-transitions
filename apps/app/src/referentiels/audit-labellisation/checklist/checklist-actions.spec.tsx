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

vi.mock('../../labellisations/request-audit/request-audit.button', () => ({
  RequestAuditButton: () => null,
}));

const mockedUseChecklist = vi.mocked(useChecklist);

const obtenirPremiereEtoile = 'Obtenir la première étoile';

const setCollectiviteCycle = (
  cycle: Partial<TCycleLabellisation>
): void => {
  mockedUseChecklist.mockReturnValue({
    cycle: {
      isAuditeur: false,
      viewerRole: 'auditee',
      isCOT: false,
      peutCommencerAudit: false,
      ...cycle,
    } as TCycleLabellisation,
    parcours: null,
    referentielId: 'cae',
    premiereEtoileObtenue: false,
    showActeEngagement: false,
    showCandidatureDocuments: false,
  } as unknown as ReturnType<typeof useChecklist>);
};

const premiereEtoileDemandeEnvoyee = {
  status: 'demande_envoyee',
  audit: null,
  demande: { sujet: 'labellisation', etoiles: '1' },
} as TCycleLabellisation['parcours'];

beforeEach(() => {
  mockedUseChecklist.mockReset();
});

describe('ChecklistActions — bouton « Obtenir la première étoile »', () => {
  it('désactive le bouton quand une demande de première étoile est déjà en cours', () => {
    setCollectiviteCycle({
      canAskFirstStar: true,
      status: 'demande_envoyee',
      parcours: premiereEtoileDemandeEnvoyee,
    });

    render(<ChecklistActions />);

    const button = screen.getByRole('button', { name: obtenirPremiereEtoile });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('garde le bouton actif quand aucune demande première étoile n\'a été envoyée', () => {
    setCollectiviteCycle({
      canAskFirstStar: true,
      status: 'non_demandee',
      parcours: {
        status: 'non_demandee',
        audit: null,
        demande: null,
      } as TCycleLabellisation['parcours'],
    });

    render(<ChecklistActions />);

    const button = screen.getByRole('button', { name: obtenirPremiereEtoile });
    expect(button.hasAttribute('disabled')).toBe(false);
  });
});
