import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TCycleLabellisation } from '../../labellisations/useCycleLabellisation';
import { ChecklistContextValue, useChecklist } from '../checklist.context';
import { ChecklistActions } from './checklist-actions';

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: () => ({ collectiviteId: 1 }),
}));

vi.mock('../checklist.context', () => ({
  useChecklist: vi.fn(),
}));

vi.mock('../../labellisations/ask-premiere-etoile/ask-premiere-etoile.modal', () => ({
  AskPremiereEtoileModal: () => null,
}));

vi.mock('../../labellisations/request-audit/request-audit.button', () => ({
  RequestAuditButton: () => null,
}));

const mockedUseChecklist = vi.mocked(useChecklist);

const obtenirPremiereEtoile = 'Obtenir la première étoile';

const setCollectiviteCycle = (cycle: Partial<TCycleLabellisation>): void => {
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
  } as unknown as ChecklistContextValue);
};

const premiereEtoileDemandeEnvoyee = {
  status: 'demande_envoyee',
  audit: null,
  demande: { sujet: 'labellisation', etoiles: '1' },
} as TCycleLabellisation['parcours'];

const cycleSansDemande = {
  status: 'non_demandee',
  audit: null,
  demande: null,
} as TCycleLabellisation['parcours'];

const renderFirstStarButton = (): HTMLElement => {
  render(<ChecklistActions />);
  return screen.getByRole('button', { name: obtenirPremiereEtoile });
};

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

    expect(renderFirstStarButton().hasAttribute('disabled')).toBe(true);
  });

  it('désactive le bouton quand les critères ne sont pas tous remplis', () => {
    setCollectiviteCycle({
      canAskFirstStar: false,
      status: 'non_demandee',
      parcours: cycleSansDemande,
    });

    expect(renderFirstStarButton().hasAttribute('disabled')).toBe(true);
  });

  it("garde le bouton actif quand aucune demande n'a été envoyée et que les critères sont remplis", () => {
    setCollectiviteCycle({
      canAskFirstStar: true,
      status: 'non_demandee',
      parcours: cycleSansDemande,
    });

    expect(renderFirstStarButton().hasAttribute('disabled')).toBe(false);
  });
});
