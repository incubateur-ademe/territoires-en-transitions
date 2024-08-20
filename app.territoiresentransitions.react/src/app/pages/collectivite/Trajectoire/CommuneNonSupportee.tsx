import {Button, Card} from '@tet/ui';
import {useDownloadFile} from 'utils/useDownloadFile';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import {useTelechargementTrajectoire} from './useTelechargementTrajectoire';
import {DOC_METHODO} from './constants';
import {ReactComponent as DbErrorPicto} from './db-error.svg';

/**
 * Affiche un message pour les communes.
 */
export const CommuneNonSupportee = () => {
  // pour télécharger les fichiers
  const {mutate: download, isLoading: isDownloading} =
    useTelechargementTrajectoire();
  const {mutate: downloadFile, isLoading: isDownloadingFile} =
    useDownloadFile();

  return (
    <Card className="flex items-center my-16">
      <DbErrorPicto />
      <h2>Méthodologie limitée pour les communes</h2>
      <p className="font-normal text-lg text-center">
        La méthodologie de territorialisation de la SNBC est conçue pour les
        niveaux allant de l’EPCI à la région. Bien que les principes et les
        calculs soient applicables à l'échelle communale, certaines données
        nécessaires ne sont pas disponibles pour ce niveau.
      </p>
      <p className="font-normal text-lg text-center">
        Nous mettons à votre disposition le fichier de calcul et de méthodologie
        pour vous informer sur les processus et les principes de cette méthode,
        dans le cas où vous souhaiteriez vous en inspirer.La méthodogie
        permettant de calculer la trajectoire SNBC territorialisée a été
        développée pour l’ADEME par Solagro et l’Institut Negawatt. Fruit d’un
        travail de 18 mois avec la contribution de 13 collectivités pilotes
        volontaires, elle a permis de construire une méthode de référence pour
        aider les territoires à définir et à interroger leur trajectoire
        bas-carbone.
      </p>
      <div className="flex flex-row gap-4">
        <Button onClick={() => download()} disabled={isDownloading}>
          {isDownloading ? (
            <>
              Téléchargement en cours <SpinnerLoader />
            </>
          ) : (
            'Télécharger le modèle (.xlsx)'
          )}
        </Button>
        <Button
          variant="outlined"
          onClick={() => downloadFile(DOC_METHODO)}
          disabled={isDownloadingFile}
        >
          Télécharger la méthodologie (.pdf)
        </Button>
      </div>
    </Card>
  );
};
