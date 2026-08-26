import { EtoileEnum, SujetDemandeEnum } from '@tet/domain/referentiels';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AskPremiereEtoileModalContent } from './ask-premiere-etoile.modal';

const { askPremiereEtoile, setToast } = vi.hoisted(() => ({
  askPremiereEtoile: vi.fn(),
  setToast: vi.fn(),
}));

vi.mock('../data/use-request-labellisation', () => ({
  useRequestLabellisation: () => ({
    isPending: false,
    mutate: askPremiereEtoile,
  }),
}));

vi.mock('../../../utils/toast/toast-context', () => ({
  useToastContext: () => ({ setToast }),
}));

const DEMANDER_LA_PREMIERE_ETOILE = 'Demander la première étoile';
const BRAVO_PREMIERE_ETOILE =
  'Bravo ! Vous remplissez apparemment les conditions minimales requises pour la première étoile.';
const REVENIR_PREPARATION_AUDIT = "Revenir à la préparation de l'audit";
const ENVOYER_MA_DEMANDE = 'Envoyer ma demande';
const DEMANDE_ENVOYEE =
  "Votre demande de labellisation a bien été envoyée. Vous recevrez dans les 48h ouvrées un mail de l'ADEME.";
const MESSAGE_ERREUR_API =
  "L'élu référent et le référent technique doivent être désignés comme pilotes pour demander un audit ou une labellisation.";

const COLLECTIVITE_ID = 1;

const renderContent = ({
  isCOT = false,
  status = 'non_demandee',
}: {
  isCOT?: boolean;
  status?: 'non_demandee' | 'demande_envoyee';
} = {}): void => {
  render(
    <AskPremiereEtoileModalContent
      isCOT={isCOT}
      collectiviteId={COLLECTIVITE_ID}
      referentiel="eci"
      status={status}
    />
  );
};

const demandeSoumise = (): unknown => askPremiereEtoile.mock.calls[0][0];

beforeEach(() => {
  askPremiereEtoile.mockReset();
  setToast.mockReset();
});

describe('Modale de demande de première étoile', () => {
  it('annonce la première étoile et non un audit', () => {
    renderContent();

    expect(
      screen.getByRole('heading', { name: DEMANDER_LA_PREMIERE_ETOILE })
    ).toBeDefined();
    expect(
      screen.getByText(BRAVO_PREMIERE_ETOILE, { exact: false })
    ).toBeDefined();
  });

  it("ne propose pas de revenir à la préparation d'un audit", () => {
    renderContent();

    expect(screen.queryByText(REVENIR_PREPARATION_AUDIT)).toBeNull();
  });

  it('soumet une demande de première étoile', () => {
    renderContent();

    fireEvent.click(screen.getByText(ENVOYER_MA_DEMANDE));

    expect(demandeSoumise()).toEqual({
      collectiviteId: COLLECTIVITE_ID,
      referentiel: 'eci',
      etoiles: EtoileEnum.PREMIERE_ETOILE,
      sujet: SujetDemandeEnum.LABELLISATION,
    });
  });

  it('soumet le sujet COT quand la collectivité est sous COT', () => {
    renderContent({ isCOT: true });

    fireEvent.click(screen.getByText(ENVOYER_MA_DEMANDE));

    expect(demandeSoumise()).toEqual({
      collectiviteId: COLLECTIVITE_ID,
      referentiel: 'eci',
      etoiles: EtoileEnum.PREMIERE_ETOILE,
      sujet: SujetDemandeEnum.LABELLISATION_COT,
    });
  });

  it('remplace le formulaire par un accusé de réception une fois la demande envoyée', () => {
    renderContent({ status: 'demande_envoyee' });

    expect(screen.getByText(DEMANDE_ENVOYEE)).toBeDefined();
    expect(screen.queryByText(ENVOYER_MA_DEMANDE)).toBeNull();
  });

  it("remonte le message d'erreur de l'API dans un toast", () => {
    askPremiereEtoile.mockImplementation((_demande, { onError }) =>
      onError(new Error(MESSAGE_ERREUR_API))
    );
    renderContent();

    fireEvent.click(screen.getByText(ENVOYER_MA_DEMANDE));

    expect(setToast).toHaveBeenCalledWith('error', MESSAGE_ERREUR_API);
  });
});
