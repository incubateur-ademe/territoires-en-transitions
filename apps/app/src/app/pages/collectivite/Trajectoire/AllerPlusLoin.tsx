import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useDownloadFile } from '@/app/utils/useDownloadFile';
import { Button } from '@tet/ui';
import {
  DOC_METHODO,
  SIMULATEUR_TERRITORIAL_URL,
} from '../../../../indicateurs/trajectoires/trajectoire-constants';
import { useTelechargementTrajectoire } from './useTelechargementTrajectoire';

export const AllerPlusLoin = () => {
  // pour télécharger les fichiers
  const { mutate: download, isPending: isDownloading } =
    useTelechargementTrajectoire();
  const { mutate: downloadFile, isPending: isDownloadingFile } =
    useDownloadFile();

  return (
    <div>
      <div className="text-center">
        <h3>Aller plus loin</h3>
      </div>
      <h6 className="mb-4 text-base">
        Téléchargez le fichier Excel de calcul pour comprendre le détail des
        calculs et approfondir votre analyse.
      </h6>
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
      <h6 className="mt-8 mb-4 text-base">
        Télécharger les fichiers de l’étude détaillant la méthodologie, etc.
      </h6>
      <Button
        variant="outlined"
        onClick={() => downloadFile(DOC_METHODO)}
        disabled={isDownloadingFile}
      >
        Télécharger la méthodologie (.pdf)
      </Button>

      <h6 className="mt-8 mb-4 text-base">Simulateur territorial</h6>
      <Button variant="outlined" external href={SIMULATEUR_TERRITORIAL_URL}>
        Voir le simulateur du SGPE
      </Button>
    </div>
  );
};
