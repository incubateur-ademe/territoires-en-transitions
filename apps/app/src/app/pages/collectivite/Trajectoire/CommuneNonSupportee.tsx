import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useDownloadFile } from '@/app/utils/useDownloadFile';
import { EmptyCard, Event, useEventTracker } from '@/ui';
import { DOC_METHODO } from '../../../../indicateurs/trajectoires/trajectoire-constants';
import DbErrorPicto from './db-error.svg';
import { useTelechargementModele } from './useTelechargementModele';

/**
 * Affiche un message pour les communes.
 */
export const CommuneNonSupportee = () => {
  // pour télécharger les fichiers
  const { mutate: download, isPending: isDownloading } =
    useTelechargementModele();
  const { mutate: downloadFile, isPending: isDownloadingFile } =
    useDownloadFile();
  const trackEvent = useEventTracker();

  return (
    <EmptyCard
      picto={(props) => <DbErrorPicto {...props} />}
      title="Méthodologie limitée pour les communes"
      description="La méthodologie de territorialisation de la SNBC est conçue pour les niveaux allant de l'EPCI à la région. Bien que les principes et les calculs soient applicables à l'échelle communale, certaines données nécessaires ne sont pas disponibles pour ce niveau."
      subTitle="Nous mettons à votre disposition le fichier de calcul et de méthodologie pour vous informer sur les processus et les principes de cette méthode, dans le cas où vous souhaiteriez vous en inspirer. La méthodogie permettant de calculer la trajectoire SNBC territorialisée a été développée pour l'ADEME par Solagro et l'Institut Negawatt. Fruit d'un travail de 18 mois avec la contribution de 13 collectivités pilotes volontaires, elle a permis de construire une méthode de référence pour aider les territoires à définir et à interroger leur trajectoire bas-carbone."
      actions={[
        {
          children: isDownloading ? (
            <>
              Téléchargement en cours <SpinnerLoader />
            </>
          ) : (
            'Télécharger le modèle (.xlsx)'
          ),
          onClick: () => download(),
          disabled: isDownloading,
        },
        {
          children: 'Télécharger la méthodologie (.pdf)',
          onClick: () => {
            trackEvent(Event.trajectoire.downloadSnbcFile, {
              file: 'methodo',
            });
            downloadFile(DOC_METHODO);
          },
          disabled: isDownloadingFile,
          variant: 'outlined',
        },
      ]}
    />
  );
};
