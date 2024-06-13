import {useState} from 'react';
import classNames from 'classnames';
import Modal from 'ui/shared/floating-ui/Modal';
import {TSujetDemande} from './types';
import {useEnvoiDemande} from './useEnvoiDemande';
import {
  TDemandeLabellisationModalProps,
  submittedEtoile1,
  submittedAutresEtoiles,
} from './DemandeLabellisationModal';
import {MessageCompletudeECi} from './MessageCompletudeECi';
import {usePreuvesLabellisation} from './useCycleLabellisation';
import {Alert} from '@tet/ui';

/**
 * Affiche la modale de sélection du type d'audit souhaité et d'envoie de la
 * demande d'audit
 */
export const DemandeAuditModal = (props: TDemandeLabellisationModalProps) => {
  const {parcoursLabellisation, opened, setOpened} = props;
  const {parcours} = parcoursLabellisation;
  const {collectivite_id, referentiel} = parcours || {};

  if (!collectivite_id || !referentiel) {
    return null;
  }

  return (
    <Modal
      externalOpen={opened}
      setExternalOpen={setOpened}
      size="lg"
      render={({close}) => (
        <DemandeAuditModalContent {...props} onClose={close} />
      )}
    />
  );
};

export const DemandeAuditModalContent = (
  props: TDemandeLabellisationModalProps & {onClose: () => void}
) => {
  const {isLoading, envoiDemande} = useEnvoiDemande();
  const {parcoursLabellisation, onClose, isCOT} = props;
  const {parcours, status, labellisable} = parcoursLabellisation;
  const {collectivite_id, referentiel, etoiles} = parcours || {};
  const [sujet, setSujet] = useState<TSujetDemande | null>(
    labellisable ? null : 'cot'
  );
  const preuves = usePreuvesLabellisation(parcours?.demande?.id);

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
    <div className="p-7 flex flex-col" data-test="DemandeAuditModal">
      <h3>Demander un audit</h3>
      <div className="w-full">
        {status === 'non_demandee' && isLoading ? 'Envoi en cours...' : null}
        {status === 'demande_envoyee' ? (
          <Alert
            state="success"
            className="mb-4"
            title={
              etoiles === '1' && !isCOT
                ? submittedEtoile1
                : submittedAutresEtoiles
            }
          />
        ) : null}
        {status === 'non_demandee' && !isLoading ? (
          <>
            <MessageCompletudeECi parcours={parcours} />
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
            </fieldset>
            {aide}
            <div className={classNames({'fr-mt-2w': !aide})}>
              <button
                className="fr-btn"
                data-test="EnvoyerDemandeBtn"
                disabled={!sujet}
                onClick={() =>
                  sujet &&
                  envoiDemande({
                    collectivite_id: collectivite_id!,
                    etoiles: etoiles || null,
                    referentiel: referentiel!,
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
          </>
        ) : null}
      </div>
    </div>
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
