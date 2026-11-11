import { makeCollectiviteTrajectoirelUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { EmptyCard, EmptyCardAction, Event, useEventTracker } from '@tet/ui';
import DbErrorPicto from '../db-error.svg';
import { useTelechargementMethodologieSnbc3 } from './data/use-telechargement-methodologie-snbc3';
import { useTelechargementOutilSnbc3 } from './data/use-telechargement-outil-snbc3';

/**
 * Carte d'état vide de la page SNBC 3, construite sur le modèle de
 * `methodology-not-applicable.card.tsx` (qui reste pour l'ancienne page). Elle
 * propose l'outil Excel SNBC 3 et la méthodologie, et, pour une commune,
 * la trajectoire de sa collectivité de rattachement (son EPCI, ou Paris pour
 * un arrondissement parisien).
 */
export const TrajectoireSnbc3IndisponibleCard = ({
  title,
  description,
  collectiviteRattachement,
  dataTest,
}: {
  title: string;
  description: string;
  collectiviteRattachement?: { id: number; nom: string };
  dataTest: string;
}) => {
  const { mutate: downloadOutil, isPending: isDownloading } =
    useTelechargementOutilSnbc3();
  const { mutate: downloadMethodologie, isPending: isDownloadingMethodologie } =
    useTelechargementMethodologieSnbc3();
  const trackEvent = useEventTracker();

  const actions: EmptyCardAction[] = [
    {
      children: isDownloading ? (
        <>
          {appLabels.telechargementEnCours} <SpinnerLoader />
        </>
      ) : (
        appLabels.trajectoireSnbc3TelechargerOutil
      ),
      onClick: () => downloadOutil(),
      disabled: isDownloading,
      dataTest: 'indicateurs.trajectoires.snbc3.telecharger-outil',
    },
    {
      children: appLabels.trajectoireSnbc3ConsulterMethodologie,
      variant: 'outlined',
      onClick: () => downloadMethodologie(),
      disabled: isDownloadingMethodologie,
      dataTest: 'indicateurs.trajectoires.snbc3.methodologie',
    },
  ];

  if (collectiviteRattachement) {
    actions.unshift({
      children: appLabels.trajectoireSnbc3VoirTrajectoireDe({
        nom: collectiviteRattachement.nom,
      }),
      href: makeCollectiviteTrajectoirelUrl({
        collectiviteId: collectiviteRattachement.id,
      }),
      onClick: () =>
        trackEvent(Event.trajectoire.snbc3.voirTrajectoireRattachement, {
          collectiviteRattachementId: collectiviteRattachement.id,
        }),
      dataTest: 'indicateurs.trajectoires.snbc3.voir-rattachement',
    });
  }

  return (
    <EmptyCard
      className="my-16"
      picto={(props) => <DbErrorPicto {...props} />}
      title={title}
      description={description}
      subTitle={appLabels.trajectoireSnbc3OutilSousTitre}
      actions={actions}
      dataTest={dataTest}
    />
  );
};
