import Dialog from '@material-ui/core/Dialog';
import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';
import {CloseDialogButton} from 'ui/shared/CloseDialogButton';
import {numLabels} from './numLabels';

export type TDemandeLabellisationModalProps = {
  parcours: LabellisationParcoursRead;
  submitted: boolean;
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

const submittedEtoile1 =
  'Votre demande de labellisation a bien été envoyée. Vous recevrez dans les 48h ouvrées un mail de l’ADEME.';
const submittedAutresEtoiles =
  'Votre demande d’audit a bien été envoyée. Vous recevrez prochainement un mail du Bureau d’Appui.';

const getMessage = (parcours: LabellisationParcoursRead) => {
  const {etoiles, referentiel} = parcours;
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
 * Affiche la modale d'envoie de la demande de labellisation
 */
export const DemandeLabellisationModal = (
  props: TDemandeLabellisationModalProps
) => {
  const {parcours, submitted, opened, setOpened} = props;
  const {etoiles} = parcours;

  const onClose = () => setOpened(false);
  return (
    <Dialog
      data-test="DemandeLabellisationModal"
      open={opened}
      onClose={onClose}
      maxWidth="md"
      fullWidth={true}
    >
      <div className="p-7 flex flex-col">
        <CloseDialogButton setOpened={setOpened} />
        <h3>
          {etoiles === '1'
            ? 'Demander la première étoile'
            : `Demander un audit pour la ${numLabels[etoiles]} étoile`}
        </h3>
        <div className="w-full">
          {submitted ? (
            <div className="fr-alert fr-alert--success">
              {etoiles === '1' ? submittedEtoile1 : submittedAutresEtoiles}
            </div>
          ) : (
            <>
              {getMessage(parcours).map((line, index) => (
                <p key={index}>{line}</p>
              ))}
              <button className="fr-btn">Envoyer ma demande</button>
              {etoiles !== '1' ? (
                <button
                  className="fr-btn fr-btn--secondary fr-ml-4w"
                  onClick={onClose}
                >
                  Revenir à la préparation de l’audit
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
};
