import { SIMULATEUR_TERRITORIAL_URL } from '@/app/indicateurs/trajectoires/trajectoire-constants';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useTelechargementMethodologieSnbc3 } from './data/use-telechargement-methodologie-snbc3';
import {
  IS_OUTIL_SNBC3_DISPONIBLE,
  useTelechargementOutilSnbc3,
} from './data/use-telechargement-outil-snbc3';

/**
 * « Aller plus loin » de la page SNBC 3. Le lot 5 y ajoute « Mes données
 * (.xlsx) », le classeur ouvert sur le territoire.
 */
export const AllerPlusLoinSnbc3 = () => {
  const { mutate: downloadOutil, isPending: isDownloading } =
    useTelechargementOutilSnbc3();
  const { mutate: downloadMethodologie, isPending: isDownloadingMethodologie } =
    useTelechargementMethodologieSnbc3();

  return (
    <div>
      {IS_OUTIL_SNBC3_DISPONIBLE && (
        <>
          <h6 className="mb-4 text-base">
            {appLabels.trajectoireSnbc3AllerPlusLoinOutil}
          </h6>
          <Button
            size="sm"
            variant="outlined"
            onClick={() => downloadOutil()}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                {appLabels.telechargementEnCours} <SpinnerLoader />
              </>
            ) : (
              appLabels.trajectoireSnbc3TelechargerOutil
            )}
          </Button>
        </>
      )}

      <h6 className={cn('mb-4 text-base', IS_OUTIL_SNBC3_DISPONIBLE && 'mt-8')}>
        {appLabels.documentation}
      </h6>
      <div className="flex gap-4">
        <Button
          size="sm"
          variant="outlined"
          onClick={() => downloadMethodologie()}
          disabled={isDownloadingMethodologie}
        >
          {appLabels.trajectoireSnbc3ConsulterMethodologie}
        </Button>

        <Button
          size="sm"
          variant="outlined"
          external
          href={SIMULATEUR_TERRITORIAL_URL}
        >
          {appLabels.trajectoireVoirSimulateurSgpe}
        </Button>
      </div>
    </div>
  );
};
