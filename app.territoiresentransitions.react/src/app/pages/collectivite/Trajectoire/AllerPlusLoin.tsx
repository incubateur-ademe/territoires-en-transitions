import {Button, Card} from '@tet/ui';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import {useDownloadFile} from 'utils/useDownloadFile';
import {useTelechargementTrajectoire} from './useTelechargementTrajectoire';

// fichier dans le dossier `public`
const METHODO = 'ADEME-Methodo-Outil-trajectoire-référence.pdf';

export const AllerPlusLoin = () => {
  // pour télécharger les fichiers
  const {mutate: download, isLoading: isDownloading} =
    useTelechargementTrajectoire();
  const {mutate: downloadFile, isLoading: isDownloadingFile} =
    useDownloadFile();

  return (
    <Card>
      <h5>Aller plus loin</h5>
      <p className="text-sm font-normal mb-2">
        Téléchargez le fichier Excel de calcul pour comprendre le détail des
        calculs et approfondir votre analyse.
      </p>
      <Button
        variant="outlined"
        onClick={() => download()}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <>
            Téléchargement en cours <SpinnerLoader />
          </>
        ) : (
          'Télécharger les données (.xlsx)'
        )}
      </Button>
      <p className="text-sm font-normal mt-2 mb-2">
        Télécharger les fichiers de l’étude détaillant la méthodologie, etc.
      </p>
      <Button
        variant="outlined"
        onClick={() => downloadFile(METHODO)}
        disabled={isDownloadingFile}
      >
        Télécharger la méthodologie (.pdf)
      </Button>
    </Card>
  );
};
