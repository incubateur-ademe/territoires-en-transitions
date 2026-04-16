'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { VerificationTrajectoireStatus } from '@tet/domain/indicateurs';
import { Alert, Button, Card, Modal } from '@tet/ui';
import { HELPDESK_URL } from '../../../../indicateurs/trajectoires/trajectoire-constants';
import { CommuneNonSupportee } from './CommuneNonSupportee';
import DbErrorPicto from './db-error.svg';
import { DonneesCollectivite } from './DonneesCollectivite/DonneesCollectivite';
import TrajectoirePicto from './trajectoire.svg';
import { TrajectoireCalculee } from './TrajectoireCalculee';
import { useGetStatutTrajectoire } from './use-get-statut-trajectoire';
import { useGetTrajectoire } from './use-trajectoire';

/**
 * Affiche l'écran approprié en fonction du statut du calcul de la trajectoire SNBC
 */
const TrajectoireContent = (props: {
  statut: ReturnType<typeof useGetStatutTrajectoire>;
}) => {
  const { data, error, isLoading } = props.statut;
  if (isLoading) {
    return (
      <div className="h-56 flex justify-center items-center">
        <SpinnerLoader className="w-8 h-8 fill-primary-5" />
      </div>
    );
  }

  if (data?.status === VerificationTrajectoireStatus.DROITS_INSUFFISANTS) {
    return <ErreurDroits />;
  }

  if (error || !data || !data.status) {
    return <ErreurDeChargement />;
  }

  if (data.status === VerificationTrajectoireStatus.DONNEES_MANQUANTES) {
    return <DonneesNonDispo />;
  }

  if (data.status === VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE) {
    return <CommuneNonSupportee />;
  }

  if (data.status === VerificationTrajectoireStatus.PRET_A_CALCULER) {
    return <Presentation />;
  }

  if (data.status === VerificationTrajectoireStatus.DEJA_CALCULE) {
    return <TrajectoireCalculee />;
  }

  return <ErreurDeChargement />;
};

/**
 * Affiche un message quand les données pour faire le calcul de la trajectoire
 * ne sont pas disponibles.
 */
const DonneesNonDispo = () => {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canMutateValeurs = hasCollectivitePermission(
    'indicateurs.valeurs.mutate'
  );

  return (
    <Card className="flex items-center my-16">
      <DbErrorPicto />
      <h2 className="mb-6">{appLabels.trajectoireDonneesInsuffisantesCalcul}</h2>
      {canMutateValeurs ? (
        <p className="font-normal text-lg text-center">
          {appLabels.trajectoireDonneesInsuffisantesDescriptionMutateur}
        </p>
      ) : (
        <p className="font-normal text-lg text-center">
          {appLabels.trajectoireDonneesInsuffisantesDescriptionLecture}{' '}
          <b>
            {
              appLabels.trajectoireDonneesInsuffisantesDescriptionLectureHighlight
            }
          </b>{' '}
          {appLabels.trajectoireDonneesInsuffisantesDescriptionLectureSuite}
        </p>
      )}
      <Modal
        size="xl"
        render={(props) => <DonneesCollectivite modalProps={props} />}
      >
        <Button disabled={!canMutateValeurs}>
          {appLabels.trajectoireCompleterDonnees}
        </Button>
      </Modal>
    </Card>
  );
};

/**
 * Affiche un message quand l'utilisateur n'a pas les droits requis
 */
const ErreurDroits = () => {
  return (
    <Alert
      state="error"
      className="self-stretch my-8"
      title={appLabels.trajectoireDroitsInsuffisants}
      description={appLabels.trajectoireDroitsInsuffisantsDescription}
    />
  );
};

/**
 * Affiche un message quand les données n'ont pas pu être chargées (erreur 500 par exemple)
 */
const ErreurDeChargement = () => {
  return (
    <Alert
      state="error"
      className="self-stretch my-8"
      title={appLabels.trajectoireErreurChargementDonnees}
      description={appLabels.trajectoireErreurChargementDonneesDescription}
    />
  );
};

/**
 * Affiche le message de présentation
 */
const Presentation = () => {
  const { isPending, data: trajectoire } = useGetTrajectoire();

  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { collectiviteId } = useCurrentCollectivite();

  return (
    <div className="flex flex-col">
      <div className="flex flex-row gap-14">
        <div className="w-3/5">
          <h1 className="mb-6">
            {appLabels.trajectoireTitrePresentation}
          </h1>
          <p className="font-bold text-lg">{appLabels.trajectoireSousTitrePresentation}</p>
          <ul className="w-11/12 text-lg list-disc ml-4 mb-0">
            <li>{appLabels.trajectoireObjectif1}</li>
            <li>{appLabels.trajectoireObjectif2}</li>
            <li>{appLabels.trajectoireObjectif3}</li>
          </ul>
          <p className="text-lg mt-2">{appLabels.trajectoirePresentationDescription}</p>
          <Button
            size="md"
            variant="underlined"
            external
            href={HELPDESK_URL}
            className="mb-6"
          >
            {appLabels.trajectoirePlusInformations}
          </Button>
        </div>
        <TrajectoirePicto />
      </div>
      {trajectoire ? (
        <Button
          onClick={() => {
            queryClient.invalidateQueries({
              queryKey: trpc.indicateurs.trajectoires.snbc.checkStatus.queryKey(
                {
                  collectiviteId,
                }
              ),
            });
          }}
        >
          {appLabels.trajectoireAcceder}
        </Button>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          {isPending && (
            <span>{appLabels.trajectoireCalculEnCoursInfo}</span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Point d'entrée
 */
const Trajectoire = () => {
  const statutTrajectoire = useGetStatutTrajectoire();

  return (
    <div className="flex flex-col gap-16">
      <TrajectoireContent statut={statutTrajectoire} />
    </div>
  );
};

export default Trajectoire;
