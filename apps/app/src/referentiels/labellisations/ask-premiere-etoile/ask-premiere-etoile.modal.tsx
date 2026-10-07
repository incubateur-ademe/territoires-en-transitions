import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import {
  EtoileEnum,
  ParcoursLabellisationStatus,
  ReferentielId,
  SujetDemande,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { Alert, Button, Modal } from '@tet/ui';
import { ReactNode } from 'react';
import { useRequestLabellisation } from '../data/use-request-labellisation';

export type AskPremiereEtoileModalProps = {
  isCOT: boolean;
  collectiviteId: number;
  referentiel: ReferentielId;
  status: ParcoursLabellisationStatus;
  opened: boolean;
  setOpened: (opened: boolean) => void;
};

type AskPremiereEtoileModalContentProps = Omit<
  AskPremiereEtoileModalProps,
  'opened' | 'setOpened'
>;

const premiereEtoileSujet = (isCOT: boolean): SujetDemande =>
  isCOT ? SujetDemandeEnum.LABELLISATION_COT : SujetDemandeEnum.LABELLISATION;

const DemandePremiereEtoile = ({
  status,
  isPending,
  onEnvoi,
}: {
  status: ParcoursLabellisationStatus;
  isPending: boolean;
  onEnvoi: () => void;
}): ReactNode => {
  if (status === 'demande_envoyee') {
    return (
      <Alert
        state="success"
        className="mb-4"
        title={appLabels.demandeLabellisationEnvoyee}
      />
    );
  }
  if (status !== 'non_demandee') {
    return null;
  }
  if (isPending) {
    return <p>{appLabels.envoiEnCours}</p>;
  }
  return (
    <>
      <p>{appLabels.bravoConditionsPremiereEtoile}</p>
      <Button size="sm" onClick={onEnvoi}>
        {appLabels.envoyerMaDemande}
      </Button>
    </>
  );
};

export const AskPremiereEtoileModalContent = ({
  isCOT,
  collectiviteId,
  referentiel,
  status,
}: AskPremiereEtoileModalContentProps): ReactNode => {
  const { setToast } = useToastContext();
  const { isPending, mutate: askPremiereEtoile } = useRequestLabellisation();

  return (
    <div className="flex flex-col">
      <h3 className="mb-6">{appLabels.demanderLaPremiereEtoile}</h3>
      <div className="w-full">
        <DemandePremiereEtoile
          status={status}
          isPending={isPending}
          onEnvoi={() =>
            askPremiereEtoile(
              {
                collectiviteId,
                referentiel,
                etoiles: EtoileEnum.PREMIERE_ETOILE,
                sujet: premiereEtoileSujet(isCOT),
              },
              { onError: (error) => setToast('error', error.message) }
            )
          }
        />
      </div>
    </div>
  );
};

export const AskPremiereEtoileModal = ({
  opened,
  setOpened,
  ...content
}: AskPremiereEtoileModalProps): ReactNode => (
  <Modal
    openState={{ isOpen: opened, setIsOpen: setOpened }}
    size="lg"
    render={() => <AskPremiereEtoileModalContent {...content} />}
  />
);
