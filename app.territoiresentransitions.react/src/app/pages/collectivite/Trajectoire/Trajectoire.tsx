import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { PageContainer } from '@/app/ui/layout/page-layout';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Alert, Button, Card, Modal, TrackPageView } from '@/ui';
import { pick } from 'es-toolkit';
import { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useCurrentCollectivite } from '../../../../core-logic/hooks/useCurrentCollectivite';
import { CommuneNonSupportee } from './CommuneNonSupportee';
import { HELPDESK_URL } from './constants';
import { ReactComponent as DbErrorPicto } from './db-error.svg';
import { DonneesCollectivite } from './DonneesCollectivite/DonneesCollectivite';
import { ReactComponent as TrajectoirePicto } from './trajectoire.svg';
import { TrajectoireCalculee } from './TrajectoireCalculee';
import { useCalculTrajectoire } from './useCalculTrajectoire';
import {
  getStatusKey,
  StatutTrajectoire,
  useStatutTrajectoire,
} from './useStatutTrajectoire';

/**
 * Affiche l'écran approprié en fonction du statut du calcul de la trajectoire SNBC
 */
const TrajectoireContent = (props: {
  statut: ReturnType<typeof useStatutTrajectoire>;
}) => {
  const { data, error, isLoading } = props.statut;
  if (isLoading) {
    return (
      <div className="h-56 flex justify-center items-center">
        <SpinnerLoader className="w-8 h-8 fill-primary-5" />
      </div>
    );
  }

  if (error?.statusCode === 401) {
    return <ErreurDroits />;
  }

  if (error || !data || !data.status) {
    return <ErreurDeChargement />;
  }

  if (data.status === StatutTrajectoire.DONNEES_MANQUANTES) {
    return <DonneesNonDispo />;
  }

  if (data.status === StatutTrajectoire.COMMUNE_NON_SUPPORTEE) {
    return <CommuneNonSupportee />;
  }

  if (data.status === StatutTrajectoire.PRET_A_CALCULER) {
    return <Presentation />;
  }

  if (data.status === StatutTrajectoire.DEJA_CALCULE) {
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
  const {
    mutate: calcul,
    isLoading,
    data: trajectoire,
  } = useCalculTrajectoire();

  // démarre le calcul au chargement de la page
  useEffect(() => {
    if (!isLoading) {
      calcul();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();

  return (
    <div className="flex flex-col py-12">
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
            queryClient.invalidateQueries(getStatusKey(collectiviteId));
          }}
        >
          J’accède à la trajectoire
        </Button>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <Button onClick={() => calcul()} disabled={isLoading}>
            {isLoading ? (
              <>
                Calcul en cours
                <SpinnerLoader />
              </>
            ) : (
              'Je lance le calcul'
            )}
          </Button>
          {isLoading && (
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
  const statutTrajectoire = useStatutTrajectoire();
  const { data, error, isLoading } = statutTrajectoire;
  const collectivite = useCurrentCollectivite()!;
  const statut = isLoading ? undefined : data?.status ? data.status : 'error';
  const errorProps =
    statut === 'error'
      ? { error: error?.message, statusCode: error?.statusCode }
      : {};

  return (
    collectivite.collectiviteId && (
      <div className="bg-grey-2 -mb-8">
        {!isLoading && (
          <TrackPageView
            pageName="app/trajectoires/snbc"
            properties={{
              ...pick(collectivite, ['collectiviteId', 'niveauAcces', 'role']),
              statut,
              ...errorProps,
            }}
          />
        )}
        <PageContainer className="flex flex-col gap-16">
          <TrajectoireContent statut={statutTrajectoire} />
        </PageContainer>
      </div>
    )
  );
};

export default Trajectoire;
