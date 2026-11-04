import { SujetDemande, SujetDemandeEnum } from '@tet/domain/referentiels';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TCycleLabellisation } from '../../labellisations/useCycleLabellisation';
import { ChecklistContextValue, useChecklist } from '../checklist.context';
import { ChecklistActions } from './checklist-actions';

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: () => ({ collectiviteId: 1 }),
}));

vi.mock(
  '../checklist.context',
  (): Partial<
    Record<keyof typeof import('../checklist.context'), unknown>
  > => ({
    useChecklist: vi.fn(),
  })
);

vi.mock(
  '../../labellisations/send-demande/send-demande.modal',
  (): Partial<
    Record<
      keyof typeof import('../../labellisations/send-demande/send-demande.modal'),
      unknown
    >
  > => ({
    SendDemandeModal: () => null,
  })
);

const mockedUseChecklist = vi.mocked(useChecklist);

const obtenirPremiereEtoile = 'Obtenir la première étoile';
const demanderAudit = 'Demander un audit';

const parcoursSansDemande = {
  etoiles: 1,
  status: 'non_demandee',
  audit: null,
  demande: null,
  labellisation: null,
  completudeOk: true,
  critereScore: { atteint: true, scoreFait: 0 },
  isCot: false,
  conditionFichiers: { preuveNombre: 0 },
  preuvesObjets: [],
  referentiel: 'cae',
  referentRolesDefined: { eluReferent: true, referentTechnique: true },
  criteresAction: [],
} as unknown as NonNullable<TCycleLabellisation['parcours']>;

const setCycle = ({
  cycle,
  sujetVise = SujetDemandeEnum.LABELLISATION,
}: {
  cycle: Partial<TCycleLabellisation>;
  sujetVise?: SujetDemande;
}): void => {
  mockedUseChecklist.mockReturnValue({
    sujetVise,
    referentielId: 'cae',
    cycle: {
      isAuditeur: false,
      viewerRole: 'auditee',
      isCOT: false,
      canAskFirstStar: false,
      parcours: parcoursSansDemande,
      ...cycle,
    } as TCycleLabellisation,
  } as unknown as ChecklistContextValue);
};

const getButton = (name: string): HTMLButtonElement => {
  const button = screen
    .getAllByRole('button', { name })
    .find((element) => element instanceof HTMLButtonElement);
  if (!button) {
    throw new Error(`Bouton « ${name} » introuvable`);
  }
  return button;
};

beforeEach(() => {
  mockedUseChecklist.mockReset();
});

describe('ChecklistActions — une seule demande selon le choix de la checklist', () => {
  it('propose la première étoile, et pas un audit, quand la première étoile est choisie', () => {
    setCycle({ cycle: { canAskFirstStar: true } });

    render(<ChecklistActions />);

    expect(getButton(obtenirPremiereEtoile).disabled).toBe(false);
    expect(screen.queryByRole('button', { name: demanderAudit })).toBeNull();
  });

  it('propose un audit, et pas la première étoile, quand une étoile auditée est choisie', () => {
    setCycle({
      cycle: { parcours: { ...parcoursSansDemande, etoiles: 2 } },
    });

    render(<ChecklistActions />);

    expect(getButton(demanderAudit)).toBeDefined();
    expect(
      screen.queryByRole('button', { name: obtenirPremiereEtoile })
    ).toBeNull();
  });

  it('propose un audit à une collectivité COT qui désactive la labellisation, même à la première étoile', () => {
    setCycle({
      cycle: {
        isCOT: true,
        canAskFirstStar: true,
        parcours: { ...parcoursSansDemande, isCot: true },
      },
      sujetVise: SujetDemandeEnum.COT,
    });

    render(<ChecklistActions />);

    expect(getButton(demanderAudit).disabled).toBe(false);
    expect(
      screen.queryByRole('button', { name: obtenirPremiereEtoile })
    ).toBeNull();
  });

  it('désactive la première étoile tant que ses critères ne sont pas remplis', () => {
    setCycle({ cycle: { canAskFirstStar: false } });

    render(<ChecklistActions />);

    expect(getButton(obtenirPremiereEtoile).disabled).toBe(true);
  });

  it("n'affiche aucune demande à un auditeur", () => {
    setCycle({ cycle: { viewerRole: 'auditor', canAskFirstStar: true } });

    render(<ChecklistActions />);

    expect(
      screen.queryByRole('button', { name: obtenirPremiereEtoile })
    ).toBeNull();
    expect(screen.queryByRole('button', { name: demanderAudit })).toBeNull();
  });
});
