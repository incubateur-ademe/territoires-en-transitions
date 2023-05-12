import Dialog from '@material-ui/core/Dialog';
import {useState} from 'react';
import classNames from 'classnames';
import {CloseDialogButton} from 'ui/buttons/CloseDialogButton';
import {TSujetDemande} from './types';
import {useEnvoiDemande} from './useEnvoiDemande';
import {
  TDemandeLabellisationModalProps,
  submittedEtoile1,
  submittedAutresEtoiles,
} from './DemandeLabellisationModal';

/**
 * Affiche la modale de sélection du type d'audit souhaité et d'envoie de la
 * demande d'audit
 */
export const DemandeAuditModal = (props: TDemandeLabellisationModalProps) => {
  const {isLoading, envoiDemande} = useEnvoiDemande();
  const {parcoursLabellisation, opened, setOpened} = props;
  const {parcours, status, labellisable, preuves} = parcoursLabellisation;
  const {collectivite_id, referentiel, etoiles} = parcours || {};
  const [sujet, setSujet] = useState<TSujetDemande | null>(
    !labellisable ? 'cot' : null
  );
  const onClose = () => setOpened(false);

  if (!collectivite_id || !referentiel) {
    return null;
  }

  // on doit afficher un meesage d'aide si la collectivité est non labellisable
  // car le critère fichier n'est pas atteint
  const aide =
    !labellisable && !preuves?.length ? (
      <p className="fr-text--sm">
        * Pour passer en CNL penser à joindre les documents de labellisation.
      </p>
    ) : null;
  const asterique = aide ? <sup>*</sup> : null;

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
          {status === 'non_demandee' && isLoading ? 'Envoi en cours...' : null}
          {status === 'demande_envoyee' ? (
            <div className="fr-alert fr-alert--success">
              {etoiles === '1' ? submittedEtoile1 : submittedAutresEtoiles}
            </div>
          ) : null}
          {status === 'non_demandee' && !isLoading ? (
            <fieldset className="fr-fieldset">
              <legend className="fr-fieldset__legend fr-fieldset__legend--regular">
                Quel type d’audit souhaitez-vous demander ?
              </legend>
              <RadioButton value="cot" sujet={sujet} setSujet={setSujet}>
                Audit COT <b>sans</b> labellisation
              </RadioButton>
              <RadioButton
                disabled={!labellisable}
                value="labellisation_cot"
                sujet={sujet}
                setSujet={setSujet}
              >
                Audit COT <b>avec</b> labellisation{asterique}
              </RadioButton>
              <RadioButton
                disabled={!labellisable}
                value="labellisation"
                sujet={sujet}
                setSujet={setSujet}
              >
                Audit <b>de</b> labellisation{asterique}
              </RadioButton>
              {aide}
              <div className={classNames({'fr-mt-2w': !aide})}>
                <button
                  className="fr-btn"
                  data-test="EnvoyerDemandeBtn"
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
              </div>
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
  <div className="fr-fieldset__element">
    <div className="fr-radio-group">
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
    </div>
  </div>
);
