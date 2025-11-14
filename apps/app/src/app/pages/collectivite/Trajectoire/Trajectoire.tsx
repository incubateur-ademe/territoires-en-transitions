'use client';

import { useTRPC } from '@/api';
import { useCurrentCollectivite } from '@/api/collectivites';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { VerificationTrajectoireStatus } from '@/domain/indicateurs';
import { Alert, Button, Card, Modal } from '@/ui';
import { useQueryClient } from '@tanstack/react-query';
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
  const collectivite = useCurrentCollectivite();

  return (
    <Card className="flex items-center my-16">
      <DbErrorPicto />
      <h2>Données disponibles insuffisantes pour le calcul</h2>
      {collectivite?.isReadOnly ? (
        <p className="font-normal text-lg text-center">
          Nous ne disposons pas encore des données suffisantes pour permettre le
          calcul automatique de la trajectoire SNBC territorialisé de votre
          collectivité.{' '}
          <b>
            Un utilisateur en Edition ou Admin sur le profil de cette
            collectivité
          </b>{' '}
          peut néanmoins lancer un calcul en complétant les données disponibles
          en open data avec celles disponibles au sein de la collectivité. Vous
          pourrez ensuite visualiser facilement votre trajectoire SNBC
          territorialisée et la comparer aux objectifs fixés et résultats
          observés.
        </p>
      ) : (
        <p className="font-normal text-lg text-center">
          Nous ne disposons pas encore des données suffisantes pour permettre le
          calcul automatique de la trajectoire SNBC territorialisée de votre
          collectivité. Vous pouvez néanmoins lancer un calcul en complétant les
          données disponibles en open data avec vos propres données. Vous
          pourrez ainsi visualiser facilement votre trajectoire SNBC
          territorialisée et la comparer aux objectifs fixés et résultats
          observés.
        </p>
      )}
      <Modal
        size="xl"
        render={(props) => <DonneesCollectivite modalProps={props} />}
      >
        <Button disabled={!collectivite || collectivite.isReadOnly}>
          Compléter mes données
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
      title="Droits insuffisants"
      description="La trajectoire des autres collectivités n’est pas encore accessible en mode visite. Elle le sera très prochainement."
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
      title="Erreur lors du chargement des données"
      description="Veuillez ré-essayer dans quelques instants. Si le problème persiste merci de contacter le support."
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
          <h1>
            Calculez votre trajectoire de transition bas-carbone avec la méthode
            développée par l’ADEME.
          </h1>
          <p className="font-bold text-lg">
            C’est un excellent outil stratégique pour :
          </p>
          <ul className="w-11/12 text-lg list-disc ml-4 mb-0">
            <li>
              {
                "Définir ou évaluer vos objectifs, par exemple lors d'un suivi annuel ou d'un bilan à mi-parcours de PCAET"
              }
            </li>
            <li>Quantifier les efforts nécessaires secteur par secteur</li>
            <li>Identifier votre contribution à la SNBC</li>
          </ul>
          <p className="text-lg mt-2">
            {
              "Cette trajectoire n'est pas prescriptive, mais peut constituer un repère pour guider votre stratégie, vos actions."
            }
          </p>
          <Button
            size="md"
            variant="underlined"
            external
            href={HELPDESK_URL}
            className="mb-6"
          >
            Pour plus d’informations
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
          J’accède à la trajectoire
        </Button>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          {isPending && (
            <span>
              Le calcul de la trajectoire peut prendre jusqu’à 25 secondes. Il
              s’est lancé automatiquement à l’arrivée sur la page.
            </span>
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
