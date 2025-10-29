import Modal from '@/app/ui/shared/floating-ui/Modal';
import { SujetDemande } from '@/domain/referentiels';
import { Alert, Button, RadioButton } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import {
  TDemandeLabellisationModalProps,
  submittedAutresEtoiles,
  submittedEtoile1,
} from './DemandeLabellisationModal';
import { MessageCompletudeECi } from './MessageCompletudeECi';
import { usePreuvesLabellisation } from './useCycleLabellisation';
import { useEnvoiDemande } from './useEnvoiDemande';
/**
 * Affiche la modale de sélection du type d'audit souhaité et d'envoie de la
 * demande d'audit
 */
export const DemandeAuditModal = (props: TDemandeLabellisationModalProps) => {
  const { parcoursLabellisation, opened, setOpened } = props;
  const { parcours } = parcoursLabellisation;
  const { collectivite_id, referentiel } = parcours || {};

  if (!collectivite_id || !referentiel) {
    return null;
  }

  return (
    <Modal
      externalOpen={opened}
      setExternalOpen={setOpened}
      size="lg"
      render={({ close }) => (
        <DemandeAuditModalContent {...props} onClose={close} />
      )}
    />
  );
};

export const DemandeAuditModalContent = (
  props: TDemandeLabellisationModalProps & { onClose: () => void }
) => {
  const { isLoading, envoiDemande } = useEnvoiDemande();
  const { parcoursLabellisation, onClose, isCOT } = props;
  const { parcours, status, labellisable } = parcoursLabellisation;
  const { collectivite_id, referentiel, etoiles } = parcours || {};
  const [sujet, setSujet] = useState<SujetDemande | null>(
    labellisable ? null : 'cot'
  );
  const preuves = usePreuvesLabellisation(parcours?.demande?.id);

  // on doit afficher un meesage d'aide si la collectivité est non labellisable
  // car le critère fichier n'est pas atteint
  const aide =
    !labellisable && !preuves?.length ? (
      <p className="text-sm">
        * Pour passer en CNL penser à joindre les documents de labellisation.
      </p>
    ) : null;
  const asterique = aide ? '*' : '';

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
              etoiles === 1 && !isCOT
                ? submittedEtoile1
                : submittedAutresEtoiles
            }
          />
        ) : null}
        {status === 'non_demandee' && !isLoading ? (
          <>
            <MessageCompletudeECi parcours={parcours} />
            <div className="flex flex-col gap-6 mb-6">
              <p className="mb-0">
                Quel type d’audit souhaitez-vous demander ?
              </p>
              <RadioButton
                id="cot"
                value="cot"
                onChange={() => setSujet('cot')}
                checked={sujet === 'cot'}
                label="Audit COT sans labellisation"
              />
              <RadioButton
                id="labellisation_cot"
                value="labellisation_cot"
                onChange={() => setSujet('labellisation_cot')}
                checked={sujet === 'labellisation_cot'}
                label={`Audit COT avec labellisation${asterique}`}
                disabled={!labellisable}
              />
              <RadioButton
                id="labellisation"
                value="labellisation"
                onChange={() => setSujet('labellisation')}
                checked={sujet === 'labellisation'}
                label={`Audit de labellisation${asterique}`}
                disabled={!labellisable}
              />
            </div>
            {aide}
            <div className={classNames('flex gap-4', { 'mt-4': !aide })}>
              <Button
                dataTest="EnvoyerDemandeBtn"
                size="sm"
                disabled={!sujet}
                onClick={() =>
                  sujet &&
                  envoiDemande({
                    collectivite_id: collectivite_id!,
                    etoiles: etoiles ?? null,
                    referentiel: referentiel!,
                    sujet,
                  })
                }
              >
                Envoyer ma demande
              </Button>
              <Button variant="outlined" size="sm" onClick={onClose}>
                Annuler
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
