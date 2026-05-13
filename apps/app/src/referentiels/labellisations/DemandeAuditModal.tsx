import { appLabels } from '@/app/labels/catalog';
import { SujetDemande } from '@tet/domain/referentiels';
import { Alert, Button, RadioButton } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useState } from 'react';
import {
  TDemandeLabellisationModalProps,
  submittedAutresEtoiles,
  submittedEtoile1,
} from './DemandeLabellisationModal';
import { MessageCompletudeECi } from './MessageCompletudeECi';
import { usePreuvesLabellisation } from './useCycleLabellisation';
import { useEnvoiDemande } from './useEnvoiDemande';

export const DemandeAuditModal = (props: TDemandeLabellisationModalProps) => {
  const { parcoursLabellisation, opened, setOpened, isCOT } = props;
  const { parcours, status, labellisable } = parcoursLabellisation;
  const { collectivite_id, referentiel, etoiles } = parcours || {};
  const [sujet, setSujet] = useState<SujetDemande | null>(
    labellisable ? null : 'cot'
  );
  const { isPending: isLoading, mutate: envoiDemande } = useEnvoiDemande();
  const preuves = usePreuvesLabellisation(parcours?.demande?.id);

  if (!collectivite_id || !referentiel) {
    return null;
  }

  const aide =
    !labellisable && preuves?.data && !preuves.data.length ? (
      <p className="text-sm">
        * Pour passer en CNL penser à joindre les documents de labellisation.
      </p>
    ) : null;
  const asterique = aide ? '*' : '';

  return (
    <Modal
      openState={{ isOpen: opened, setIsOpen: setOpened }}
      size="lg"
    >
      <Modal.Header>
        <Modal.Title>{appLabels.demanderAudit}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div data-test="DemandeAuditModal">
          {status === 'non_demandee' && isLoading ? appLabels.envoiEnCours : null}
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
                  Quel type d'audit souhaitez-vous demander ?
                </p>
                <RadioButton
                  id="cot"
                  value="cot"
                  onChange={() => setSujet('cot')}
                  checked={sujet === 'cot'}
                  label={appLabels.auditCotSansLabellisation}
                />
                <RadioButton
                  id="labellisation_cot"
                  value="labellisation_cot"
                  onChange={() => setSujet('labellisation_cot')}
                  checked={sujet === 'labellisation_cot'}
                  label={appLabels.auditCotAvecLabellisation({ asterique })}
                  disabled={!labellisable}
                />
                <RadioButton
                  id="labellisation"
                  value="labellisation"
                  onChange={() => setSujet('labellisation')}
                  checked={sujet === 'labellisation'}
                  label={appLabels.auditLabellisation({ asterique })}
                  disabled={!labellisable}
                />
              </div>
              {aide}
            </>
          ) : null}
        </div>
      </Modal.Body>
      {status === 'non_demandee' && !isLoading ? (
        <Modal.Footer className={cn({ 'mt-4': !aide })}>
          <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
          <Button
            dataTest="EnvoyerDemandeBtn"
            size="sm"
            disabled={!sujet}
            onClick={() => {
              if (sujet && collectivite_id && referentiel) {
                envoiDemande({
                  collectiviteId: collectivite_id,
                  etoiles: sujet === 'cot' ? null : etoiles ?? null,
                  referentiel,
                  sujet,
                });
              }
            }}
          >
            Envoyer ma demande
          </Button>
        </Modal.Footer>
      ) : null}
    </Modal>
  );
};
