import Dialog from '@material-ui/core/Dialog';
import {useState} from 'react';
import {CloseDialogButton} from 'ui/shared/CloseDialogButton';
import {numLabels} from './numLabels';
import {TSujetDemande} from './types';
import {useEnvoiDemande} from './useEnvoiDemande';
import {TCycleLabellisation} from './useCycleLabellisation';

export type TDemandeLabellisationModalProps = {
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

const submittedEtoile1 =
  'Votre demande de labellisation a bien été envoyée. Vous recevrez dans les 48h ouvrées un mail de l’ADEME.';
const submittedAutresEtoiles =
  'Votre demande d’audit a bien été envoyée. Vous recevrez prochainement un mail du Bureau d’Appui.';

const getMessage = (parcours: TCycleLabellisation['parcours']) => {
  const {etoiles, referentiel} = parcours || {};
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
 * Affiche la modale d'envoie de la demande d'audit
 */
export const DemandeLabellisationModal = (
  props: TDemandeLabellisationModalProps
) => {
  const {isLoading, envoiDemande} = useEnvoiDemande();
  const {parcoursLabellisation, opened, setOpened} = props;
  const {parcours, status, isCOT} = parcoursLabellisation;
  const {collectivite_id, referentiel, etoiles} = parcours || {};
  const onClose = () => setOpened(false);

  // n'affiche rien si les donnnées ne sont pas valides
  if (
    !parcours ||
    !collectivite_id ||
    (status !== 'non_demandee' && status !== 'demande_envoyee')
  ) {
    return null;
  }

  // affiche le sélecteur de sujet de demande d'audit pour les COT
  if (isCOT) {
    return <DemandeAuditModal {...props} />;
  }

  const canSubmit = referentiel && etoiles;

  return (
    <Dialog
      data-test="DemandeLabellisationModal"
      open={opened}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <div className="p-7 flex flex-col">
        <CloseDialogButton setOpened={setOpened} />
        <h3>
          {etoiles === '1'
            ? 'Demander la première étoile'
            : `Demander un audit pour la ${numLabels[etoiles!]} étoile`}
        </h3>
        <div className="w-full">
          {isLoading ? 'Envoi en cours...' : null}
          {status === 'demande_envoyee' ? (
            <div className="fr-alert fr-alert--success">
              {etoiles === '1' ? submittedEtoile1 : submittedAutresEtoiles}
            </div>
          ) : null}
          {status === 'non_demandee' && !isLoading ? (
            <>
              {getMessage(parcours)?.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
              <button
                className="fr-btn"
                disabled={!canSubmit}
                onClick={() =>
                  canSubmit &&
                  envoiDemande({
                    collectivite_id,
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
    </Dialog>
  );
};

/**
 * Affiche la modale de sélection du type d'audit souhaité et d'envoie de la
 * demande d'audit
 */
const DemandeAuditModal = (props: TDemandeLabellisationModalProps) => {
  const {isLoading, envoiDemande} = useEnvoiDemande();
  const {parcoursLabellisation, opened, setOpened} = props;
  const {parcours, status, labellisable} = parcoursLabellisation;
  const {collectivite_id, referentiel, etoiles} = parcours || {};
  const [sujet, setSujet] = useState<TSujetDemande | null>(
    !labellisable ? 'cot' : null
  );
  const onClose = () => setOpened(false);

  if (!collectivite_id || !referentiel) {
    return null;
  }

  return (
    <Dialog
      data-test="DemandeAuditModal"
      open={opened}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <div className="p-7 flex flex-col">
        <CloseDialogButton setOpened={setOpened} />
        <h3>Demander un audit</h3>
        <div className="w-full">
          {isLoading ? 'Envoi en cours...' : null}
          {status === 'demande_envoyee' ? (
            <div className="fr-alert fr-alert--success">
              {submittedAutresEtoiles}
            </div>
          ) : null}
          {status === 'non_demandee' && !isLoading ? (
            <fieldset className="fr-fieldset">
              <legend className="fr-fieldset__legend fr-text--regular">
                Quel type d’audit souhaitez-vous demander ?
              </legend>
              <div className="fr-radio-group fr-radio-group--sm fr-mb-4w">
                <RadioButton value="cot" sujet={sujet} setSujet={setSujet}>
                  Audit COT <b>sans</b> labellisation
                </RadioButton>
                <RadioButton
                  disabled={!labellisable}
                  value="labellisation_cot"
                  sujet={sujet}
                  setSujet={setSujet}
                >
                  Audit COT <b>avec</b> labellisation
                </RadioButton>
                <RadioButton
                  disabled={!labellisable}
                  value="labellisation"
                  sujet={sujet}
                  setSujet={setSujet}
                >
                  Audit <b>de</b> labellisation
                </RadioButton>
              </div>
              <button
                className="fr-btn"
                disabled={!sujet}
                onClick={() =>
                  sujet &&
                  envoiDemande({
                    collectivite_id,
                    etoiles: etoiles || null,
                    referentiel,
                    sujet,
                  })
                }
              >
                Envoyer ma demande
              </button>
              <button
                className="fr-btn fr-btn--secondary fr-ml-4w"
                onClick={onClose}
              >
                Annuler
              </button>
            </fieldset>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
};

const RadioButton = ({
  disabled,
  value,
  children,
  sujet,
  setSujet,
}: {
  disabled?: boolean;
  value: TSujetDemande;
  children: React.ReactNode;
  sujet: TSujetDemande | null;
  setSujet: (value: TSujetDemande) => void;
}) => (
  <>
    <input
      type="radio"
      id={value}
      disabled={disabled}
      value={value}
      checked={sujet === value}
      onChange={() => setSujet(value)}
    />
    <label className="fr-label" htmlFor={value}>
      <span>{children}</span>
    </label>
  </>
);
