import { SujetDemandeEnum } from '@tet/domain/referentiels';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemandeVisee } from '../../audit-labellisation/demande-visee';
import { SendDemandeModalContent } from './send-demande.modal';

const { sendDemande, setToast } = vi.hoisted(() => ({
  sendDemande: vi.fn(),
  setToast: vi.fn(),
}));

vi.mock(
  '../data/use-request-labellisation',
  (): Partial<
    Record<keyof typeof import('../data/use-request-labellisation'), unknown>
  > => ({
    useRequestLabellisation: () => ({
      isPending: false,
      mutate: sendDemande,
    }),
  })
);

vi.mock(
  '../../../utils/toast/toast-context',
  (): Partial<
    Record<keyof typeof import('../../../utils/toast/toast-context'), unknown>
  > => ({
    useToastContext: () => ({ setToast }),
  })
);

const ENVOYER_MA_DEMANDE = 'Envoyer ma demande';
const COLLECTIVITE_ID = 1;

const renderContent = (
  demande: DemandeVisee,
  onClose: () => void = vi.fn()
): void => {
  render(
    <SendDemandeModalContent
      collectiviteId={COLLECTIVITE_ID}
      referentiel="eci"
      demande={demande}
      onClose={onClose}
    />
  );
};

const demandeEnvoyee = (): unknown => sendDemande.mock.calls[0][0];

beforeEach(() => {
  sendDemande.mockReset();
  setToast.mockReset();
});

describe('Modale de demande — première étoile', () => {
  const premiereEtoile: DemandeVisee = {
    kind: 'premiere-etoile',
    sujet: SujetDemandeEnum.LABELLISATION_COT,
  };

  it("rappelle que l'ADEME vérifiera les conditions de la première étoile", () => {
    renderContent(premiereEtoile);

    expect(
      screen.getByText(
        'Bravo ! Vous remplissez apparemment les conditions minimales requises pour la première étoile.',
        { exact: false }
      )
    ).toBeDefined();
  });

  it('envoie la première étoile avec le sujet de la collectivité', () => {
    renderContent(premiereEtoile);

    fireEvent.click(screen.getByText(ENVOYER_MA_DEMANDE));

    expect(demandeEnvoyee()).toEqual({
      collectiviteId: COLLECTIVITE_ID,
      referentiel: 'eci',
      sujet: SujetDemandeEnum.LABELLISATION_COT,
      etoiles: 1,
    });
  });

  it("confirme l'envoi de la demande de labellisation et ferme la modale", () => {
    sendDemande.mockImplementation((_demande, { onSuccess }) => onSuccess());
    const onClose = vi.fn();
    renderContent(premiereEtoile, onClose);

    fireEvent.click(screen.getByText(ENVOYER_MA_DEMANDE));

    expect(setToast).toHaveBeenCalledWith(
      'success',
      "Votre demande de labellisation a bien été envoyée. Vous recevrez dans les 48h ouvrées un mail de l'ADEME."
    );
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Modale de demande — audit de labellisation', () => {
  const auditTroisiemeEtoile: DemandeVisee = {
    kind: 'audit-labellisation',
    sujet: SujetDemandeEnum.LABELLISATION,
    etoile: 3,
  };

  it("rappelle le type d'audit et l'étoile choisis dans la checklist", () => {
    renderContent(auditTroisiemeEtoile);

    expect(screen.getByText('Audit de labellisation')).toBeDefined();
    expect(
      screen.getByText('Étoile demandée : troisième étoile')
    ).toBeDefined();
  });

  it("distingue l'audit COT avec labellisation d'une collectivité COT", () => {
    renderContent({
      ...auditTroisiemeEtoile,
      sujet: SujetDemandeEnum.LABELLISATION_COT,
    });

    expect(screen.getByText('Audit COT avec labellisation')).toBeDefined();
  });

  it("envoie l'étoile choisie", () => {
    renderContent(auditTroisiemeEtoile);

    fireEvent.click(screen.getByText(ENVOYER_MA_DEMANDE));

    expect(demandeEnvoyee()).toEqual({
      collectiviteId: COLLECTIVITE_ID,
      referentiel: 'eci',
      sujet: SujetDemandeEnum.LABELLISATION,
      etoiles: 3,
    });
  });

  it("confirme l'envoi de la demande d'audit", () => {
    sendDemande.mockImplementation((_demande, { onSuccess }) => onSuccess());
    renderContent(auditTroisiemeEtoile);

    fireEvent.click(screen.getByText(ENVOYER_MA_DEMANDE));

    expect(setToast).toHaveBeenCalledWith(
      'success',
      "Votre demande d'audit a bien été envoyée."
    );
  });
});

describe('Modale de demande — audit COT seul', () => {
  it('récapitule un audit COT sans labellisation et envoie la demande sans étoile', () => {
    renderContent({ kind: 'audit-cot' });

    expect(screen.getByText('Audit COT sans labellisation')).toBeDefined();

    fireEvent.click(screen.getByText(ENVOYER_MA_DEMANDE));

    expect(demandeEnvoyee()).toEqual({
      collectiviteId: COLLECTIVITE_ID,
      referentiel: 'eci',
      sujet: SujetDemandeEnum.COT,
      etoiles: null,
    });
  });
});

describe("Modale de demande — erreur de l'API", () => {
  it("remonte le message d'erreur de l'API dans un toast sans fermer la modale", () => {
    const messageErreur =
      "L'élu référent et le référent technique doivent être désignés comme pilotes pour demander un audit ou une labellisation.";
    sendDemande.mockImplementation((_demande, { onError }) =>
      onError(new Error(messageErreur))
    );
    const onClose = vi.fn();
    renderContent({ kind: 'audit-cot' }, onClose);

    fireEvent.click(screen.getByText(ENVOYER_MA_DEMANDE));

    expect(setToast).toHaveBeenCalledWith('error', messageErreur);
    expect(onClose).not.toHaveBeenCalled();
  });
});
