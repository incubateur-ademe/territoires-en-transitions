import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useDownloadFile } from '@/app/utils/useDownloadFile';
import { Button, Card } from '@/ui';
import { DOC_METHODO } from './constants';
import { useTelechargementTrajectoire } from './useTelechargementTrajectoire';

export const AllerPlusLoin = () => {
  // pour télécharger les fichiers
  const { mutate: download, isPending: isDownloading } =
    useTelechargementTrajectoire();
  const { mutate: downloadFile, isPending: isDownloadingFile } =
    useDownloadFile();

  return (
    <Card dataTest="more">
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
        onClick={() => downloadFile(DOC_METHODO)}
        disabled={isDownloadingFile}
      >
        Télécharger la méthodologie (.pdf)
      </Button>
    </Card>
  );
};
