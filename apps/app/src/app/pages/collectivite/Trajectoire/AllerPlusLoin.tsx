import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useDownloadFile } from '@/app/utils/useDownloadFile';
import { appLabels } from '@/app/labels/catalog';
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
        <h3 className="mb-6">{appLabels.trajectoireAllerPlusLoin}</h3>
      </div>
      <h6 className="mb-4 text-base">
        {appLabels.trajectoireAllerPlusLoinDescription}
      </h6>
      <Button
        variant="outlined"
        onClick={() => download()}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <>
            {appLabels.telechargementEnCours} <SpinnerLoader />
          </>
        ) : (
          appLabels.trajectoireTelechargerDonneesXlsx
        )}
      </Button>
      <h6 className="mt-8 mb-4 text-base">
        {appLabels.trajectoireTelechargerFichiersMethodologie}
      </h6>
      <Button
        variant="outlined"
        onClick={() => downloadFile(DOC_METHODO)}
        disabled={isDownloadingFile}
      >
        {appLabels.trajectoireTelechargerMethodologiePdf}
      </Button>

      <h6 className="mt-8 mb-4 text-base">
        {appLabels.trajectoireSimulateurTerritorial}
      </h6>
      <Button variant="outlined" external href={SIMULATEUR_TERRITORIAL_URL}>
        {appLabels.trajectoireVoirSimulateurSgpe}
      </Button>
    </div>
  );
};
