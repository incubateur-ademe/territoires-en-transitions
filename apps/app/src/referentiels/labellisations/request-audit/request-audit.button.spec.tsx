import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  ObjetPreuveEnum,
  ParcoursForAuditRequest,
} from '@tet/domain/referentiels';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditViewerRole } from '../../audit-labellisation/audit-badge-status/types';
import { useCycleLabellisation } from '../useCycleLabellisation';
import { RequestAuditButton } from './request-audit.button';

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock('../useCycleLabellisation', () => ({
  useCycleLabellisation: vi.fn(),
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

const demanderAuditButton = /Demander un audit/;

const getRequestAuditButton = (): HTMLButtonElement => {
  const button = screen.getByRole('button', { name: demanderAuditButton });
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('bouton « Demander un audit » inattendu');
  }
  return button;
};

const getTooltipLabel = (): string | null =>
  document
    .querySelector('[data-tooltip-label]')
    ?.getAttribute('data-tooltip-label') ?? null;

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
    completudeOk: true,
    critereScore: {
      atteint: true,
      scoreFait: 0.4,
    } as ParcoursForAuditRequest['critereScore'],
    isCot: false,
    etoiles: 2,
    conditionFichiers: { preuveNombre: 2 },
    preuvesObjets: [
      { objet: ObjetPreuveEnum.ACTE_ENGAGEMENT },
      { objet: ObjetPreuveEnum.CANDIDATURE },
    ],
    referentiel: 'cae',
    referentRolesDefined: { eluReferent: true, referentTechnique: true },
    criteresAction: [
      { atteint: true, actionId: 'cae_5.1.2.1.1' },
      { atteint: true, actionId: 'cae_5.1.1.1.3' },
    ],
  } as ParcoursForAuditRequest,
  maximumRequestableStar: 2,
};

beforeEach(() => {
  mockedUseCurrentCollectivite.mockReturnValue({
    collectiviteId: 1,
  } as unknown as ReturnType<typeof useCurrentCollectivite>);
  setCycle(requestableCycle);
});

describe('RequestAuditButton — visibilité selon le rôle', () => {
  it('ne rend rien pour un auditeur', () => {
    setCycle({ ...requestableCycle, viewerRole: 'auditor' });

    const { container } = render(<RequestAuditButton referentielId="cae" />);

    expect(
      screen.queryByRole('button', { name: demanderAuditButton })
    ).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('ne rend rien pour un non-membre', () => {
    setCycle({ ...requestableCycle, viewerRole: 'other' });

    const { container } = render(<RequestAuditButton referentielId="cae" />);

    expect(
      screen.queryByRole('button', { name: demanderAuditButton })
    ).toBeNull();
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

    expect(getRequestAuditButton().disabled).toBe(false);
    expect(getTooltipLabel()).toBeNull();
  });

  const setCotCycleBelowAuditableScore = (completudeOk: boolean): void =>
    setCycle({
      parcours: {
        ...requestableCycle.parcours,
        isCot: true,
        etoiles: 1,
        completudeOk,
      } as ParcoursForAuditRequest,
      isCOT: true,
      maximumRequestableStar: 1,
    });

  it('COT dont les statuts ne sont pas tous renseignés : bouton désactivé, la complétude manque', () => {
    setCotCycleBelowAuditableScore(false);

    render(<RequestAuditButton referentielId="cae" />);

    expect(getRequestAuditButton().disabled).toBe(true);
    expect(getTooltipLabel()).toBe(
      'Renseigner les statuts de toutes les mesures du référentiel'
    );
  });

  it("COT dont tous les statuts sont renseignés : bouton actif, l'audit COT seul n'exige rien de plus", () => {
    setCotCycleBelowAuditableScore(true);

    render(<RequestAuditButton referentielId="cae" />);

    expect(getRequestAuditButton().disabled).toBe(false);
    expect(getTooltipLabel()).toBeNull();
  });

  it('motif autre que la complétude : le tooltip reste la phrase générique sur les critères attendus', () => {
    setCycle({
      parcours: {
        ...requestableCycle.parcours,
        isCot: false,
        completudeOk: true,
        criteresAction: [
          { atteint: true, actionId: 'cae_5.1.2.1.1' },
          { atteint: false, actionId: 'cae_1.1.1' },
        ],
      } as ParcoursForAuditRequest,
      isCOT: false,
      maximumRequestableStar: 2,
    });

    render(<RequestAuditButton referentielId="cae" />);

    expect(getRequestAuditButton().disabled).toBe(true);
    expect(getTooltipLabel()).toBe(
      'Renseigner tous les critères attendus afin de pouvoir demander un audit ou une labellisation'
    );
  });

  it('non-COT dont tous les statuts sont renseignés mais sous 35 % de score : bouton désactivé, le score manque', () => {
    setCycle({
      parcours: {
        ...requestableCycle.parcours,
        isCot: false,
        etoiles: 1,
        completudeOk: true,
      } as ParcoursForAuditRequest,
      isCOT: false,
      maximumRequestableStar: 1,
    });

    render(<RequestAuditButton referentielId="cae" />);

    expect(getRequestAuditButton().disabled).toBe(true);
    expect(getTooltipLabel()).toBe(
      'Atteindre au moins 35 % de score pour pouvoir demander un audit de labellisation.'
    );
  });

  it("rend le bouton désactivé avec un tooltip quand l'élu référent ou le référent technique n'est pas désigné", () => {
    setCycle({
      ...requestableCycle,
      parcours: {
        ...requestableCycle.parcours,
        referentRolesDefined: { eluReferent: false, referentTechnique: true },
      } as ParcoursForAuditRequest,
    });

    render(<RequestAuditButton referentielId="cae" />);

    expect(getRequestAuditButton().disabled).toBe(true);
    expect(getTooltipLabel()).not.toBeNull();
  });

  it('rend le bouton désactivé avec un tooltip quand les prérequis de labellisation sont incomplets', () => {
    mockedUseCycleLabellisation.mockReturnValue({
      parcours: {
        status: 'non_demandee',
        demande: null,
        labellisation: null,
        completudeOk: false,
        etoiles: 2,
        isCot: false,
        critereScore: { atteint: false },
        conditionFichiers: { preuveNombre: 0 },
        preuvesObjets: [],
        referentiel: 'cae',
        referentRolesDefined: { eluReferent: true, referentTechnique: true },
        criteresAction: [{ atteint: false, actionId: 'cae_1.1.1' }],
      },
      isCOT: false,
      maximumRequestableStar: 2,
      viewerRole: 'auditee',
    } as unknown as ReturnType<typeof useCycleLabellisation>);

    render(<RequestAuditButton referentielId="cae" />);

    expect(getRequestAuditButton().disabled).toBe(true);
    expect(getTooltipLabel()).not.toBeNull();
  });
});
