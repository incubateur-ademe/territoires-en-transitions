import Modal from '@/app/ui/shared/floating-ui/Modal';
import { Alert } from '@/ui';
import { MessageCompletudeECi } from './MessageCompletudeECi';
import { numLabels } from './numLabels';
import { TCycleLabellisation } from './useCycleLabellisation';
import { useEnvoiDemande } from './useEnvoiDemande';

export type TDemandeLabellisationModalProps = {
  isCOT: boolean;
  parcoursLabellisation: TCycleLabellisation;
  opened: boolean;
  setOpened: (opened: boolean) => void;
};

const messageEtoile_1 = [
  'Bravo ! Vous remplissez apparemment les conditions minimales requises pour la première étoile. Ces conditions vont être vérifiées par l’ADEME qui reviendra vers vous par mail dans les prochaines 48h (ouvrées) pour vous confirmer l’attribution de la première étoile ou vous demander des informations complémentaires !',
];

const formatLigne1 = (parenthese: string) =>
  `Bravo ! Vous remplissez apparemment les conditions minimales requises pour la demande d’audit. Après vérification du bon respect des critères, le Bureau d’Appui reviendra vers vous rapidement pour vous informer des suites de la procédure (${parenthese}).`;

const Ligne2 =
  'Il est recommandé de disposer d’une marge minimale de 3 % par rapport au seuil minimum de l’étoile pour tenir compte des risques d’évolution à la baisse de la notation globale lors de l’audit.';

const messageEtoile_2_3_4_ECI = [
  formatLigne1('calendrier de labellisation et désignation d’un auditeur'),
  Ligne2,
];

const messageEtoile_2_3_4_CAE = [
  formatLigne1(
    'calendrier de labellisation, constitution d’un dossier de demande de labellisation et désignation d’un auditeur'
  ),
  Ligne2,
];

const messageEtoile_5 = [
  formatLigne1(
    'calendrier européen de labellisation et désignation d’un auditeur national et de l’auditeur international eea Gold'
  ),
  Ligne2,
];

export const submittedEtoile1 =
  'Votre demande de labellisation a bien été envoyée. Vous recevrez dans les 48h ouvrées un mail de l’ADEME.';
export const submittedAutresEtoiles =
  'Votre demande d’audit a bien été envoyée. Vous recevrez prochainement un mail du Bureau d’Appui.';

const getMessage = (parcours: TCycleLabellisation['parcours']) => {
  const { etoiles, referentiel } = parcours || {};
  if (!etoiles) {
    return null;
  }
  if (etoiles === '1') {
    return messageEtoile_1;
  }
  if (etoiles === '5') {
    return messageEtoile_5;
  }
  if (referentiel === 'eci') {
    return messageEtoile_2_3_4_ECI;
  }
  return messageEtoile_2_3_4_CAE;
};

/**
 * Affiche la modale d'envoi de la demande d'audit
 */
export const DemandeLabellisationModal = (
  props: TDemandeLabellisationModalProps
) => {
  const { parcoursLabellisation, opened, setOpened } = props;
  const { parcours, status } = parcoursLabellisation;

  // n'affiche rien si les donnnées ne sont pas valides
  if (
    !parcours?.collectivite_id &&
    status !== 'non_demandee' &&
    status !== 'demande_envoyee'
  ) {
    return null;
  }

  return (
    <Modal
      externalOpen={opened}
      setExternalOpen={setOpened}
      size="lg"
      render={({ close }) => (
        <DemandeLabellisationModalContent {...props} onClose={close} />
      )}
    />
  );
};

export const DemandeLabellisationModalContent = (
  props: TDemandeLabellisationModalProps & { onClose: () => void }
) => {
  const { isLoading, envoiDemande } = useEnvoiDemande();
  const { parcoursLabellisation, onClose } = props;
  const { parcours, status } = parcoursLabellisation;
  const { collectivite_id, referentiel, etoiles } = parcours || {};

  const canSubmit = referentiel && etoiles;

  return (
    <div className="p-7 flex flex-col" data-test="DemandeLabellisationModal">
      <h3>
        {etoiles === '1'
          ? 'Demander la première étoile'
          : `Demander un audit pour la ${numLabels[etoiles!]} étoile`}
      </h3>
      <div className="w-full">
        {status === 'non_demandee' && isLoading ? 'Envoi en cours...' : null}
        {status === 'demande_envoyee' ? (
          <Alert
            state="success"
            className="mb-4"
            title={etoiles === '1' ? submittedEtoile1 : submittedAutresEtoiles}
          />
        ) : null}
        {status === 'non_demandee' && !isLoading ? (
          <>
            {getMessage(parcours)?.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
            <MessageCompletudeECi parcours={parcours} />
            <button
              className="fr-btn"
              data-test="EnvoyerDemandeBtn"
              disabled={!canSubmit}
              onClick={() =>
                canSubmit &&
                envoiDemande({
                  collectivite_id: collectivite_id!,
                  referentiel,
                  etoiles,
                  sujet: 'labellisation',
                })
              }
            >
              Envoyer ma demande
            </button>
            {etoiles !== '1' ? (
              <button
                className="fr-btn fr-btn--secondary fr-ml-4w"
                onClick={onClose}
              >
                Revenir à la préparation de l’audit
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};
